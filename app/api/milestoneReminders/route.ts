import { NextResponse } from 'next/server';
import { db } from '../../../firebase';
import { collection, doc, getDocs, query, where, setDoc, Timestamp } from 'firebase/firestore';
import { generateMilestoneNudgeFromAI } from '../../../lib/generateMilestoneNudgeFromAI';
import { getDefaultEmailStatus, getDefaultNotificationMeta } from '../../../lib/notificationTracking';

interface Milestone {
  id: string;
  title: string;
  description: string;
  startDate: string;
  dueDate: string;
  completed: boolean;
  blindSpotTip?: string;
  strengthHook?: string;
}

interface PlanData {
  id: string;
  userId: string;
  goalType: string;
  goal: string;
  targetDate: string;
  hasTimePressure: boolean;
  nudgeFrequency?: 'daily' | 'weekly'; // Optional for backward compatibility
  milestones: Milestone[];
  status: 'active' | 'completed' | 'paused';
  createdAt: any;
}

async function processMilestoneReminders(request: Request) {
  try {
    console.log('🔄 Starting milestone reminder check...');

    // Debug mode - check for debug parameter to bypass date checks
    const { searchParams } = new URL(request.url);
    const debugMode = searchParams.get('debug') === 'true';

    if (debugMode) {
      console.log('🐛 DEBUG MODE ENABLED - Bypassing date checks for testing');
    }

    // Get all active plans
    const plansQuery = query(
      collection(db, 'plans'),
      where('status', '==', 'active')
    );

    const plansSnapshot = await getDocs(plansQuery);
    let remindersCreated = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Set to start of day for comparison

    for (const planDoc of plansSnapshot.docs) {
      const planData = planDoc.data() as PlanData;
      const planId = planDoc.id;

      console.log(`📋 Checking plan ${planId} for user ${planData.userId}`);

      // Get plan's nudge frequency preference (default to weekly for backward compatibility)
      const nudgeFrequency = planData.nudgeFrequency || 'weekly';
      console.log(`📅 Plan nudge frequency: ${nudgeFrequency}${!planData.nudgeFrequency ? ' (default - plan needs migration)' : ''}`);

      // Special admin override for zakaria.akli.ensa@gmail.com
      const isAdminUser = planData.userId === 'CN3zNBjcyZTvzGpaAo3ro0C4eOl1';
      if (isAdminUser) {
        console.log(`👑 Admin user detected - bypassing all date conditions for ${planData.userId}`);
      }

      // Check each milestone in the plan
      for (const milestone of planData.milestones || []) {
        // Skip completed milestones
        if (milestone.completed) {
          continue;
        }

        const dueDate = new Date(milestone.dueDate);
        dueDate.setHours(0, 0, 0, 0); // Set to start of day for comparison

        const startDate = new Date(milestone.startDate);
        startDate.setHours(0, 0, 0, 0); // Set to start of day for comparison

        // Check if milestone is currently active (startDate <= today <= dueDate and not completed)
        // For admin user, bypass date checks completely
        const isCurrentMilestone = isAdminUser || startDate <= today && today <= dueDate;

        if (isCurrentMilestone) {
          console.log(`📋 Current milestone found: ${milestone.title} (${milestone.startDate} to ${milestone.dueDate})`);

          // Check if we already sent a reminder for this milestone recently
          // Daily: within last 1 day, Weekly: within last 7 days
          // Skip this check in debug mode or for admin user
          let shouldCreateReminder = false;

          if (debugMode || isAdminUser) {
            console.log(`🐛 ${isAdminUser ? 'ADMIN USER' : 'DEBUG'}: Bypassing date check for milestone: ${milestone.title}`);
            shouldCreateReminder = true;
          } else {
            // Calculate the lookback period based on nudge frequency
            const lookbackDays = nudgeFrequency === 'daily' ? 1 : 7;
            const lookbackDate = new Date();
            lookbackDate.setDate(lookbackDate.getDate() - lookbackDays);

            console.log(`🔍 Checking for existing reminders within last ${lookbackDays} day(s) for milestone: ${milestone.title}`);

            const existingRemindersQuery = query(
              collection(db, 'notifications'),
              where('userId', '==', planData.userId),
              where('milestoneId', '==', milestone.id),
              where('createdAt', '>=', Timestamp.fromDate(lookbackDate))
            );

            const existingReminders = await getDocs(existingRemindersQuery);
            shouldCreateReminder = existingReminders.empty;
          }

          // If no recent reminder exists (or debug mode/admin user), create one
          if (shouldCreateReminder) {
            console.log(`📬 Creating ${nudgeFrequency} reminder for current milestone: ${milestone.title}`);

            // Generate AI-powered nudge message
            const nudgeMessage = await generateMilestoneNudgeFromAI({
              milestone,
              goalContext: planData.goal,
              userId: planData.userId
            });

            if (nudgeMessage) {
              // Create notification document
              const notificationRef = doc(collection(db, 'notifications'));

              await setDoc(notificationRef, {
                userId: planData.userId,
                type: 'milestone_reminder',
                planId: planId,
                milestoneId: milestone.id,
                milestoneTitle: milestone.title,
                prompt: nudgeMessage,
                blindSpotTip: milestone.blindSpotTip || null,
                strengthHook: milestone.strengthHook || null,
                startDate: milestone.startDate,
                dueDate: milestone.dueDate,
                createdAt: Timestamp.now(),
                read: false,
                feedback: null,
                // Enhanced tracking fields
                emailStatus: getDefaultEmailStatus(),
                notificationMeta: getDefaultNotificationMeta('milestone_reminder')
              });

              remindersCreated++;
              console.log(`✅ ${nudgeFrequency.charAt(0).toUpperCase() + nudgeFrequency.slice(1)} reminder created for milestone: ${milestone.title}`);
            } else {
              console.log(`⚠️ Failed to generate nudge for milestone: ${milestone.title}`);
            }
          } else {
            if (!debugMode && !isAdminUser) {
              console.log(`⏭️ Recent reminder already exists for milestone: ${milestone.title}`);
            }
          }
        }
      }
    }

    console.log(`✅ Milestone reminder check completed. Created ${remindersCreated} reminders.`);

    return NextResponse.json({
      status: 'success',
      remindersCreated,
      message: `Successfully created ${remindersCreated} milestone reminders`
    });

  } catch (error) {
    console.error('❌ Error in milestone reminders:', error);
    return NextResponse.json(
      { status: 'error', message: 'Failed to process milestone reminders', error: String(error) },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  return processMilestoneReminders(request);
}

export async function POST(request: Request) {
  return processMilestoneReminders(request);
}