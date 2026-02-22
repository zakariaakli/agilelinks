import { db } from "../firebase";
import {
  collection,
  doc,
  getDocs,
  query,
  where,
  setDoc,
  Timestamp,
} from "firebase/firestore";
import {
  getDefaultEmailStatus,
  getDefaultNotificationMeta,
} from "./notificationTracking";
import {
  trackFirebaseRead,
  trackFirebaseWrite,
} from "./firebaseTracker";

const NO_PLAN_TEMPLATES = [
  "You've taken the first step by joining Stepiva! Now it's time to set your first goal. What's one thing you'd love to achieve in the next few weeks? Let's make it happen together.",
  "Every great journey starts with a single step. You haven't set a goal yet — take 2 minutes to create one and start building momentum today.",
  "Did you know that writing down your goals makes you 42% more likely to achieve them? Create your first plan on Stepiva and give yourself that advantage.",
  "Your future self will thank you. Setting a clear goal today means progress tomorrow. What would you like to work on? Let's get started.",
  "Small goals lead to big changes. Whether it's a personal habit, a career milestone, or a learning target — define it, and Stepiva will help you stay on track.",
  "You're part of a community of goal-setters. The only thing missing is your first goal! Tap below to create a plan that's meaningful to you.",
  "Last chance reminder: Stepiva works best when you have an active goal to work toward. Take a moment today to set one — you'll be glad you did.",
];

const MAX_NO_PLAN_REMINDERS = 7;

/**
 * Creates daily notifications for users who have no active plans.
 * Sends up to 7 reminders total, one per day, with rotating template messages.
 */
export async function processNoPlanReminders(): Promise<number> {
  console.log("\n🔄 Starting no-plan reminder check...");

  // Get all users
  const usersSnapshot = await getDocs(collection(db, "users"));

  await trackFirebaseRead(
    "users",
    usersSnapshot.docs.length,
    "system",
    "system@no-plan-reminders.com",
    "server",
    "no_plan_reminders_users_query"
  );

  // Get all user IDs that have active plans
  const activePlansQuery = query(
    collection(db, "plans"),
    where("status", "==", "active")
  );
  const activePlansSnapshot = await getDocs(activePlansQuery);

  await trackFirebaseRead(
    "plans",
    activePlansSnapshot.docs.length,
    "system",
    "system@no-plan-reminders.com",
    "server",
    "no_plan_reminders_active_plans_query"
  );

  const usersWithActivePlans = new Set<string>();
  for (const planDoc of activePlansSnapshot.docs) {
    const planData = planDoc.data();
    const planUserId = planData.userId || planData.input?.userId;
    if (planUserId) {
      usersWithActivePlans.add(planUserId);
    }
  }

  // Find users with no active plans
  const planlessUsers: { userId: string; email: string }[] = [];
  for (const userDoc of usersSnapshot.docs) {
    const userId = userDoc.id;
    if (!usersWithActivePlans.has(userId)) {
      const userData = userDoc.data();
      planlessUsers.push({
        userId,
        email: userData.email || userData.userEmail || "",
      });
    }
  }

  console.log(
    `📋 Found ${planlessUsers.length} user(s) with no active plans`
  );

  let remindersCreated = 0;
  const lookbackDate = new Date();
  lookbackDate.setDate(lookbackDate.getDate() - 1);

  for (const user of planlessUsers) {
    // Check how many no_plan_reminder notifications already exist for this user
    const totalRemindersQuery = query(
      collection(db, "notifications"),
      where("userId", "==", user.userId),
      where("type", "==", "no_plan_reminder")
    );
    const totalReminders = await getDocs(totalRemindersQuery);

    await trackFirebaseRead(
      "notifications",
      totalReminders.docs.length,
      user.userId,
      user.email,
      "server",
      "no_plan_reminders_count_check"
    );

    if (totalReminders.docs.length >= MAX_NO_PLAN_REMINDERS) {
      console.log(
        `⏭️ User ${user.userId} already received ${MAX_NO_PLAN_REMINDERS} no-plan reminders. Skipping.`
      );
      continue;
    }

    // Check for existing reminder within last 1 day to avoid duplicates
    const recentQuery = query(
      collection(db, "notifications"),
      where("userId", "==", user.userId),
      where("type", "==", "no_plan_reminder"),
      where("createdAt", ">=", Timestamp.fromDate(lookbackDate))
    );
    const recentReminders = await getDocs(recentQuery);

    await trackFirebaseRead(
      "notifications",
      recentReminders.docs.length,
      user.userId,
      user.email,
      "server",
      "no_plan_reminders_recent_check"
    );

    // Allow test users to bypass duplicate check
    const isTestUser =
      user.email === "zakaria.akli.ensa@gmail.com" ||
      user.email === "serfatiamine9@gmail.com";

    if (!recentReminders.empty && !isTestUser) {
      console.log(
        `⏭️ Recent no-plan reminder already exists for user ${user.userId}. Skipping.`
      );
      continue;
    }

    // Pick the template based on how many have been sent so far
    const templateIndex = totalReminders.docs.length % NO_PLAN_TEMPLATES.length;
    const prompt = NO_PLAN_TEMPLATES[templateIndex];

    console.log(
      `📬 Creating no-plan reminder #${totalReminders.docs.length + 1} for user ${user.userId}`
    );

    const notificationRef = doc(collection(db, "notifications"));
    await setDoc(notificationRef, {
      userId: user.userId,
      type: "no_plan_reminder" as const,
      prompt,
      createdAt: Timestamp.now(),
      read: false,
      feedback: null,
      emailStatus: getDefaultEmailStatus(),
      notificationMeta: getDefaultNotificationMeta("no_plan_reminder"),
    });

    await trackFirebaseWrite(
      "notifications",
      1,
      user.userId,
      user.email,
      "server",
      "no_plan_reminders_create"
    );

    remindersCreated++;
    console.log(
      `✅ No-plan reminder created for user ${user.userId} (ID: ${notificationRef.id})`
    );
  }

  console.log(
    `✅ No-plan reminder check completed. Created ${remindersCreated} reminders.`
  );

  return remindersCreated;
}
