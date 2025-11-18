import { NextResponse } from 'next/server';
import { db } from '../../../firebase';
import { collection, doc, getDocs, query, where, setDoc, Timestamp, getDoc } from 'firebase/firestore';
import { generateMilestoneNudgeFromAI } from '../../../lib/generateMilestoneNudgeFromAI';
import { getDefaultEmailStatus, getDefaultNotificationMeta } from '../../../lib/notificationTracking';
import { sendMilestoneEmail } from '../../../lib/sendMilestoneEmail';
import { trackFirebaseRead, trackFirebaseWrite } from '../../../lib/firebaseTracker';

/**
 * TIMEOUT FIX: Async AI Processing Function
 * 
 * This function handles AI generation in the background to avoid Vercel's 10-second timeout.
 * It runs asynchronously after the main API response is sent, ensuring users only see
 * the final AI-generated notification (no placeholder notifications).
 * 
 * COST MONITORING: This function includes comprehensive tracking of:
 * - OpenAI API usage (tokens and costs)
 * - Firebase operations (reads/writes and costs)
 * - User-specific cost attribution
 * 
 * @param notificationData - The notification data to process
 * @param aiInput - Input parameters for AI generation
 */
async function processAIInBackground(
  notificationData: {
    userId: string;
    planId: string;
    milestoneId: string;
    milestoneTitle: string;
    blindSpotTip: string | null;
    strengthHook: string | null;
    startDate: string;
    dueDate: string;
  },
  aiInput: {
    milestone: Milestone;
    goalContext: string;
    userId: string;
  }
) {
  try {
    console.log(`🤖 [BACKGROUND] Starting AI generation for milestone: ${notificationData.milestoneTitle}`);
    
    // COST MONITORING: Get user email for cost tracking
    let userEmail = 'unknown@system.com'; // Default fallback
    try {
      const userDocRef = doc(db, 'users', notificationData.userId);
      const userDoc = await getDoc(userDocRef);
      
      // Track Firebase read operation
      await trackFirebaseRead(
        'users',
        1,
        notificationData.userId,
        userEmail,
        'server',
        'milestone_reminders_user_lookup'
      );
      
      if (userDoc.exists()) {
        const userData = userDoc.data();
        userEmail = userData.email || userData.userEmail || userEmail;
        console.log(`📧 [COST-TRACKING] Retrieved user email for cost attribution: ${userEmail}`);
      }
    } catch (userLookupError) {
      console.error('❌ [COST-TRACKING] Failed to get user email for tracking:', userLookupError);
    }
    
    // Generate AI-powered nudge message (this can take 10-30 seconds)
    // COST MONITORING: Pass userEmail for OpenAI cost tracking
    const aiNudgeMessage = await generateMilestoneNudgeFromAI(aiInput, userEmail);
    
    if (aiNudgeMessage) {
      // Create the final notification with AI-generated content
      // User will only see this notification, not any placeholder
      const notificationRef = doc(collection(db, 'notifications'));
      
      await setDoc(notificationRef, {
        ...notificationData,
        prompt: aiNudgeMessage,
        createdAt: Timestamp.now(),
        read: false,
        feedback: null,
        // Enhanced tracking fields
        emailStatus: getDefaultEmailStatus(),
        notificationMeta: getDefaultNotificationMeta('milestone_reminder')
      });
      
      // COST MONITORING: Track Firebase write operation
      await trackFirebaseWrite(
        'notifications',
        1,
        notificationData.userId,
        userEmail,
        'server',
        'milestone_reminders_create_notification'
      );
      
      console.log(`✅ [BACKGROUND] AI notification created successfully for milestone: ${notificationData.milestoneTitle}`);
      
      // INTEGRATED EMAIL SYSTEM: Send email immediately after notification creation
      // This ensures users get notified as soon as their milestone reminder is ready
      console.log(`📧 [BACKGROUND] Attempting to send email for notification: ${notificationRef.id}`);
      try {
        await sendMilestoneEmail(notificationRef.id, notificationData.userId, {
          prompt: aiNudgeMessage,
          milestoneTitle: notificationData.milestoneTitle,
          blindSpotTip: notificationData.blindSpotTip,
          strengthHook: notificationData.strengthHook
        });
      } catch (emailError) {
        console.error(`❌ [BACKGROUND] Email sending failed for notification ${notificationRef.id}:`, emailError);
        // Don't throw - email failure shouldn't break notification creation
      }
    } else {
      // Fallback: create notification with basic message if AI fails
      console.log(`⚠️ [BACKGROUND] AI generation failed, creating fallback notification for: ${notificationData.milestoneTitle}`);
      
      const today = new Date();
      const startDate = new Date(aiInput.milestone.startDate);
      const dueDate = new Date(aiInput.milestone.dueDate);
      const daysInProgress = Math.ceil((today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
      const daysRemaining = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      
      const fallbackMessage = generateFallbackNudge(aiInput.milestone, daysInProgress, daysRemaining);
      
      const notificationRef = doc(collection(db, 'notifications'));
      await setDoc(notificationRef, {
        ...notificationData,
        prompt: fallbackMessage,
        createdAt: Timestamp.now(),
        read: false,
        feedback: null,
        emailStatus: getDefaultEmailStatus(),
        notificationMeta: getDefaultNotificationMeta('milestone_reminder')
      });
      
      // COST MONITORING: Track Firebase write operation for fallback
      await trackFirebaseWrite(
        'notifications',
        1,
        notificationData.userId,
        userEmail,
        'server',
        'milestone_reminders_fallback_notification'
      );
      
      // INTEGRATED EMAIL SYSTEM: Send email for AI failure fallback notification
      console.log(`📧 [BACKGROUND] Attempting to send email for AI-failure fallback notification: ${notificationRef.id}`);
      try {
        await sendMilestoneEmail(notificationRef.id, notificationData.userId, {
          prompt: fallbackMessage,
          milestoneTitle: notificationData.milestoneTitle,
          blindSpotTip: notificationData.blindSpotTip,
          strengthHook: notificationData.strengthHook
        });
      } catch (emailError) {
        console.error(`❌ [BACKGROUND] Email sending failed for AI-failure fallback notification ${notificationRef.id}:`, emailError);
        // Don't throw - email failure shouldn't break notification creation
      }
    }
    
  } catch (error) {
    console.error(`❌ [BACKGROUND] Failed to process AI generation for milestone ${notificationData.milestoneTitle}:`, error);
    
    // Create fallback notification even if everything fails
    try {
      const today = new Date();
      const startDate = new Date(aiInput.milestone.startDate);
      const dueDate = new Date(aiInput.milestone.dueDate);
      const daysInProgress = Math.ceil((today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
      const daysRemaining = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      
      const fallbackMessage = generateFallbackNudge(aiInput.milestone, daysInProgress, daysRemaining);
      
      const notificationRef = doc(collection(db, 'notifications'));
      await setDoc(notificationRef, {
        ...notificationData,
        prompt: fallbackMessage,
        createdAt: Timestamp.now(),
        read: false,
        feedback: null,
        emailStatus: getDefaultEmailStatus(),
        notificationMeta: getDefaultNotificationMeta('milestone_reminder')
      });
      
      // COST MONITORING: Track Firebase write operation for critical fallback
      // Use fallback email since userEmail may not be accessible in this catch block
      await trackFirebaseWrite(
        'notifications',
        1,
        notificationData.userId,
        'unknown@critical-fallback.com',
        'server',
        'milestone_reminders_critical_fallback'
      );
      
      console.log(`🆘 [BACKGROUND] Fallback notification created after error for: ${notificationData.milestoneTitle}`);
      
      // INTEGRATED EMAIL SYSTEM: Send email for critical error fallback notification
      console.log(`📧 [BACKGROUND] Attempting to send email for critical-error fallback notification: ${notificationRef.id}`);
      try {
        await sendMilestoneEmail(notificationRef.id, notificationData.userId, {
          prompt: fallbackMessage,
          milestoneTitle: notificationData.milestoneTitle,
          blindSpotTip: notificationData.blindSpotTip,
          strengthHook: notificationData.strengthHook
        });
      } catch (emailError) {
        console.error(`❌ [BACKGROUND] Email sending failed for critical-error fallback notification ${notificationRef.id}:`, emailError);
        // Don't throw - this is already the final fallback
      }
    } catch (fallbackError) {
      console.error(`💥 [BACKGROUND] Critical error - could not create any notification:`, fallbackError);
    }
  }
}

/**
 * Generates a simple fallback nudge message when AI is unavailable
 * This ensures users always get a notification even if AI fails
 */
function generateFallbackNudge(milestone: Milestone, daysInProgress: number, daysRemaining: number): string {
  const encouragements = [
    "You're making great progress!",
    "Keep up the momentum!",
    "You've got this - stay focused!",
    "Every step forward counts!",
    "You're on the right track!"
  ];

  const randomEncouragement = encouragements[Math.floor(Math.random() * encouragements.length)];

  let message = `Week ${Math.ceil(daysInProgress / 7)} of your "${milestone.title}" milestone! ${randomEncouragement} You have ${daysRemaining} days remaining to achieve this goal.`;

  // Add blind spot tip if available
  if (milestone.blindSpotTip) {
    message += ` Keep in mind: ${milestone.blindSpotTip}`;
  }

  // Add strength hook if available
  if (milestone.strengthHook) {
    message += ` Leverage your strength: ${milestone.strengthHook}`;
  }

  message += " What's one key action you can take this week to move closer to completion?";

  return message;
}

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

/**
 * MAIN MILESTONE REMINDERS PROCESSOR
 * 
 * This function processes milestone reminders for all active plans.
 * TIMEOUT FIX: Returns response immediately (under 10s) while AI processing
 * continues in the background to avoid Vercel serverless timeouts.
 * 
 * How it works:
 * 1. Scans all active plans for current milestones
 * 2. Checks if reminders are needed (based on frequency and existing reminders)
 * 3. Queues AI generation tasks for background processing
 * 4. Returns 200 response immediately
 * 5. AI processing continues asynchronously and creates notifications when done
 * 
 * @param request - HTTP request object
 * @returns NextResponse with immediate status
 */
async function processMilestoneReminders(_request: Request) {
  try {
    console.log('🔄 Starting milestone reminder check...');

    // Get all active plans
    const plansQuery = query(
      collection(db, 'plans'),
      where('status', '==', 'active')
    );

    const plansSnapshot = await getDocs(plansQuery);
    
    // COST MONITORING: Track Firebase read operation for plans query
    await trackFirebaseRead(
      'plans',
      plansSnapshot.docs.length,
      'system',
      'system@milestone-scheduler.com',
      'server',
      'milestone_reminders_plans_query'
    );
    
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
        const isCurrentMilestone = startDate <= today && today <= dueDate;

        if (isCurrentMilestone) {
          console.log(`📋 Current milestone found: ${milestone.title} (${milestone.startDate} to ${milestone.dueDate})`);

          // Check if we already sent a reminder for this milestone recently
          // Daily: within last 1 day, Weekly: within last 7 days
          
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

          // COST MONITORING: Track Firebase read operation for existing reminders check
          await trackFirebaseRead(
            'notifications',
            existingReminders.docs.length,
            planData.userId,
            'user@checking-reminders.com', // Will be updated with actual email in background
            'server',
            'milestone_reminders_check_existing'
          );

          // Get user email to check for testing override
          let userEmail = '';
          try {
            const userDocRef = doc(db, 'users', planData.userId);
            const userDoc = await getDoc(userDocRef);
            if (userDoc.exists()) {
              const userData = userDoc.data();
              userEmail = userData.email || userData.userEmail || '';
            }
          } catch (err) {
            console.error('Error fetching user email:', err);
          }

          // TESTING OVERRIDE: Allow zakaria.akli.ensa@gmail.com to bypass frequency limits
          const isTestUser = userEmail === 'zakaria.akli.ensa@gmail.com';
          const shouldCreateReminder = isTestUser || existingReminders.empty;

          if (isTestUser && !existingReminders.empty) {
            console.log(`🧪 [TESTING] Bypassing frequency limit for test user: ${userEmail}`);
          }

          // If no recent reminder exists, create one
          if (shouldCreateReminder) {
            console.log(`📬 Queuing ${nudgeFrequency} reminder for current milestone: ${milestone.title}`);

            // TIMEOUT FIX: Instead of waiting for AI generation (which can take 10-30 seconds),
            // we immediately count this as a reminder being created and process AI in background.
            // The user will only see the final notification when AI processing completes.
            remindersCreated++;
            
            // Prepare notification data structure
            const notificationData = {
              userId: planData.userId,
              type: 'milestone_reminder' as const,
              planId: planId,
              milestoneId: milestone.id,
              milestoneTitle: milestone.title,
              blindSpotTip: milestone.blindSpotTip || null,
              strengthHook: milestone.strengthHook || null,
              startDate: milestone.startDate,
              dueDate: milestone.dueDate,
            };

            // Prepare AI input parameters
            const aiInput = {
              milestone,
              goalContext: planData.goal,
              userId: planData.userId
            };

            // Process AI generation in background (non-blocking)
            // This will create the actual notification after AI completes
            processAIInBackground(notificationData, aiInput).catch(error => {
              console.error(`❌ [MAIN] Background processing failed for milestone ${milestone.title}:`, error);
            });

            console.log(`✅ ${nudgeFrequency.charAt(0).toUpperCase() + nudgeFrequency.slice(1)} reminder queued for background processing: ${milestone.title}`);
          } else {
            console.log(`⏭️ Recent reminder already exists for milestone: ${milestone.title}`);
          }
        }
      }
    }

    console.log(`✅ Milestone reminder check completed. Queued ${remindersCreated} reminders for background processing.`);

    // TIMEOUT FIX: Return response immediately to avoid Vercel timeout
    // The actual notifications will be created by background AI processing
    return NextResponse.json({
      status: 'success',
      remindersQueued: remindersCreated,
      message: `Successfully queued ${remindersCreated} milestone reminders for AI processing`,
      note: 'Notifications will appear after AI generation completes in background'
    });

  } catch (error) {
    console.error('❌ Error in milestone reminders:', error);
    return NextResponse.json(
      { status: 'error', message: 'Failed to process milestone reminders', error: String(error) },
      { status: 500 }
    );
  }
}

/**
 * GET endpoint for milestone reminders
 * Used by scheduled cron jobs and manual triggers
 * Returns immediately to avoid timeouts while processing continues in background
 */
export async function GET(request: Request) {
  return processMilestoneReminders(request);
}

/**
 * POST endpoint for milestone reminders  
 * Used for webhook triggers and API calls
 * Returns immediately to avoid timeouts while processing continues in background
 */
export async function POST(request: Request) {
  return processMilestoneReminders(request);
}