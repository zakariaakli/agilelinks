import { NextResponse } from "next/server";
import { db } from "../../../firebase";
import {
  collection,
  doc,
  getDocs,
  query,
  where,
  setDoc,
  Timestamp,
  getDoc,
} from "firebase/firestore";
import {
  getDefaultEmailStatus,
  getDefaultNotificationMeta,
} from "../../../lib/notificationTracking";
import {
  trackFirebaseRead,
  trackFirebaseWrite,
} from "../../../lib/firebaseTracker";

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
  nudgeFrequency?: "daily" | "weekly"; // Optional for backward compatibility
  milestones: Milestone[];
  status: "active" | "completed" | "paused";
  createdAt: any;
}

/**
 * MAIN MILESTONE REMINDERS PROCESSOR
 *
 * This function creates pending notifications for all active milestones.
 * Works within Vercel's 10-second timeout by creating notifications WITHOUT AI processing.
 * AI processing happens separately via GitHub Actions script.
 *
 * How it works:
 * 1. Scans all active plans for current milestones
 * 2. Checks if reminders are needed (based on frequency and existing reminders)
 * 3. Creates pending notifications with empty prompt (fast, <10s)
 * 4. Returns 200 response immediately
 * 5. GitHub Actions script processes pending notifications with AI later
 *
 * @param request - HTTP request object
 * @returns NextResponse with pending notifications count
 */
async function processMilestoneReminders(_request: Request) {
  try {
    console.log("🔄 Starting milestone reminder check...");

    // Get all active plans
    const plansQuery = query(
      collection(db, "plans"),
      where("status", "==", "active")
    );

    const plansSnapshot = await getDocs(plansQuery);

    // COST MONITORING: Track Firebase read operation for plans query
    await trackFirebaseRead(
      "plans",
      plansSnapshot.docs.length,
      "system",
      "system@milestone-scheduler.com",
      "server",
      "milestone_reminders_plans_query"
    );

    let remindersCreated = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Set to start of day for comparison

    for (const planDoc of plansSnapshot.docs) {
      const planData = planDoc.data() as PlanData;
      // Use plan ID from document data (with fallback to Firestore doc ID for old plans)
      const planId = planData.id || planDoc.id;

      console.log(`📋 Checking plan ${planId} for user ${planData.userId}`);

      // Get plan's nudge frequency preference (default to weekly for backward compatibility)
      const nudgeFrequency = planData.nudgeFrequency || "weekly";
      console.log(
        `📅 Plan nudge frequency: ${nudgeFrequency}${!planData.nudgeFrequency ? " (default - plan needs migration)" : ""}`
      );

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
          console.log(
            `📋 Current milestone found: ${milestone.title} (${milestone.startDate} to ${milestone.dueDate})`
          );

          // Check if we already sent a reminder for this milestone recently
          // Daily: within last 1 day, Weekly: within last 7 days

          // Calculate the lookback period based on nudge frequency
          const lookbackDays = nudgeFrequency === "daily" ? 1 : 7;
          const lookbackDate = new Date();
          lookbackDate.setDate(lookbackDate.getDate() - lookbackDays);

          console.log(
            `🔍 Checking for existing reminders within last ${lookbackDays} day(s) for milestone: ${milestone.title}`
          );

          const existingRemindersQuery = query(
            collection(db, "notifications"),
            where("userId", "==", planData.userId),
            where("planId", "==", planId),
            where("milestoneId", "==", milestone.id),
            where("createdAt", ">=", Timestamp.fromDate(lookbackDate))
          );

          const existingReminders = await getDocs(existingRemindersQuery);

          // COST MONITORING: Track Firebase read operation for existing reminders check
          await trackFirebaseRead(
            "notifications",
            existingReminders.docs.length,
            planData.userId,
            "user@checking-reminders.com", // Will be updated with actual email in background
            "server",
            "milestone_reminders_check_existing"
          );

          // Get user email to check for testing override
          let userEmail = "";
          try {
            const userDocRef = doc(db, "users", planData.userId);
            const userDoc = await getDoc(userDocRef);
            if (userDoc.exists()) {
              const userData = userDoc.data();
              userEmail = userData.email || userData.userEmail || "";
            }
          } catch (err) {
            console.error("Error fetching user email:", err);
          }

          // TESTING OVERRIDE: Allow specific users to bypass frequency limits
          const isTestUser = userEmail === "zakaria.akli.ensa@gmail.com" || userEmail === "serfatiamine9@gmail.com";
          const shouldCreateReminder = isTestUser || existingReminders.empty;

          if (isTestUser && !existingReminders.empty) {
            console.log(
              `🧪 [TESTING] Bypassing frequency limit for test user: ${userEmail}`
            );
          }

          // If no recent reminder exists, create one
          if (shouldCreateReminder) {
            console.log(
              `📬 Creating pending ${nudgeFrequency} reminder for current milestone: ${milestone.title}`
            );

            // Create pending notification (AI will process later via GitHub Actions)
            const notificationRef = doc(collection(db, "notifications"));
            await setDoc(notificationRef, {
              userId: planData.userId,
              type: "milestone_reminder" as const,
              planId: planId,
              milestoneId: milestone.id,
              milestoneTitle: milestone.title,
              blindSpotTip: milestone.blindSpotTip || null,
              strengthHook: milestone.strengthHook || null,
              startDate: milestone.startDate,
              dueDate: milestone.dueDate,
              prompt: "", // Empty prompt - AI will fill this in
              goalContext: planData.goal, // Store for AI processing
              createdAt: Timestamp.now(),
              read: false,
              feedback: null,
              emailStatus: getDefaultEmailStatus(),
              notificationMeta: getDefaultNotificationMeta("milestone_reminder"),
            });

            // Track Firebase write operation
            await trackFirebaseWrite(
              "notifications",
              1,
              planData.userId,
              "pending-notification@system.com",
              "server",
              "milestone_reminders_create_pending"
            );

            remindersCreated++;

            console.log(
              `✅ Pending ${nudgeFrequency} reminder created: ${milestone.title} (ID: ${notificationRef.id})`
            );
          } else {
            console.log(
              `⏭️ Recent reminder already exists for milestone: ${milestone.title}`
            );
          }
        }
      }
    }

    console.log(
      `✅ Milestone reminder check completed. Created ${remindersCreated} pending reminders.`
    );

    // Return response - AI processing will happen via GitHub Actions
    return NextResponse.json({
      status: "success",
      pendingRemindersCreated: remindersCreated,
      message: `Successfully created ${remindersCreated} pending milestone reminders (AI processing will follow)`,
    });
  } catch (error) {
    console.error("❌ Error in milestone reminders:", error);
    return NextResponse.json(
      {
        status: "error",
        message: "Failed to process milestone reminders",
        error: String(error),
      },
      { status: 500 }
    );
  }
}

/**
 * GET endpoint for milestone reminders
 * Creates pending notifications (fast, <10s) without AI processing
 * AI processing happens separately via GitHub Actions script
 */
export async function GET(request: Request) {
  return processMilestoneReminders(request);
}

/**
 * POST endpoint for milestone reminders
 * Creates pending notifications (fast, <10s) without AI processing
 * AI processing happens separately via GitHub Actions script
 */
export async function POST(request: Request) {
  return processMilestoneReminders(request);
}
