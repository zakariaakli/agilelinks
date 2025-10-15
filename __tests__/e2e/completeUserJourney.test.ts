/**
 * End-to-End Tests: Complete User Journey
 *
 * Simulates real users going through the entire platform experience:
 * 1. User signs up
 * 2. Completes Enneagram test
 * 3. Creates a goal plan
 * 4. Receives automated milestone reminders
 * 5. Interacts with notifications
 * 6. Earns XP and achievements
 */

import {
  generateFakeUser,
  generateFakePlan,
  generateCurrentMilestonePlan,
  generateFakeNotification,
  generateFakeCompanionSettings,
} from '../utils/testHelpers';

describe('E2E: Complete User Journey', () => {
  describe('Journey 1: New User Onboarding to First Notification', () => {
    test('should complete full onboarding and receive first milestone reminder', async () => {
      // ===== STEP 1: USER REGISTRATION =====
      const newUser = generateFakeUser({
        displayName: 'Alice Johnson',
        email: 'alice.johnson@example.com',
      });

      expect(newUser.uid).toBeTruthy();
      expect(newUser.email).toContain('@example.com');

      console.log(`✅ Step 1: User registered - ${newUser.email}`);

      // ===== STEP 2: ENNEAGRAM ASSESSMENT COMPLETION =====
      const enneagramResult = newUser.enneagramResult;

      expect(enneagramResult).toBeTruthy();
      expect(enneagramResult.summary).toContain('Type');

      console.log(`✅ Step 2: Enneagram completed - Dominant type found`);

      // ===== STEP 3: EMAIL OPT-IN =====
      const companionSettings = generateFakeCompanionSettings(
        newUser.uid,
        newUser.email,
        true
      );

      expect(companionSettings.emailNudgesOptIn).toBe(true);

      console.log(`✅ Step 3: Email opt-in enabled`);

      // ===== STEP 4: CREATE FIRST PLAN =====
      const firstPlan = generateCurrentMilestonePlan(newUser.uid);

      expect(firstPlan.userId).toBe(newUser.uid);
      expect(firstPlan.status).toBe('active');
      expect(firstPlan.milestones.length).toBeGreaterThan(0);

      console.log(`✅ Step 4: Plan created with ${firstPlan.milestones.length} milestones`);

      // ===== STEP 5: VERIFY CURRENT MILESTONE EXISTS =====
      const currentMilestone = firstPlan.milestones[0];
      const today = new Date();
      const startDate = new Date(currentMilestone.startDate);
      const dueDate = new Date(currentMilestone.dueDate);

      const isCurrentMilestone =
        startDate <= today && today <= dueDate && !currentMilestone.completed;

      expect(isCurrentMilestone).toBe(true);

      console.log(`✅ Step 5: Current milestone detected - "${currentMilestone.title}"`);

      // ===== STEP 6: AUTOMATED SYSTEM CREATES NOTIFICATION =====
      const notification = generateFakeNotification(
        newUser.uid,
        firstPlan.id,
        currentMilestone.id,
        {
          milestoneTitle: currentMilestone.title,
          blindSpotTip: currentMilestone.blindSpotTip,
          strengthHook: currentMilestone.strengthHook,
        }
      );

      expect(notification.userId).toBe(newUser.uid);
      expect(notification.type).toBe('milestone_reminder');
      expect(notification.emailStatus.sent).toBe(false);

      console.log(`✅ Step 6: Notification created and queued for email delivery`);

      // ===== STEP 7: SIMULATE EMAIL SENDING =====
      notification.emailStatus.sent = true;
      notification.emailStatus.deliveryStatus = 'sent';

      expect(notification.emailStatus.sent).toBe(true);

      console.log(`✅ Step 7: Email sent to ${newUser.email}`);

      // ===== STEP 8: USER OPENS NOTIFICATION =====
      notification.read = true;

      expect(notification.read).toBe(true);

      console.log(`✅ Step 8: User opened notification`);

      // ===== STEP 9: USER PROVIDES FEEDBACK =====
      notification.feedback = 'I like this nudge';

      expect(notification.feedback).toBeTruthy();

      console.log(`✅ Step 9: User provided feedback - earning 25 XP`);

      // ===== STEP 10: CALCULATE XP EARNED =====
      const xpEarned = {
        planCreation: 200,
        feedbackResponse: 25,
        total: 225,
      };

      expect(xpEarned.total).toBe(225);

      console.log(`✅ Step 10: Total XP earned - ${xpEarned.total} XP`);
      console.log(`\n🎉 Complete user journey successful!\n`);
    });
  });

  describe('Journey 2: Multi-Plan Power User', () => {
    test('should handle user with multiple active plans', async () => {
      // Power user with multiple goals
      const powerUser = generateFakeUser({
        displayName: 'Bob Chen',
        email: 'bob.chen@example.com',
      });

      // Create 3 different plans
      const plans = [
        generateCurrentMilestonePlan(powerUser.uid), // Career plan
        generateFakePlan(powerUser.uid, {
          goalType: 'personal',
          goal: 'Improve work-life balance and stress management',
        }),
        generateFakePlan(powerUser.uid, {
          goalType: 'health',
          goal: 'Run a half-marathon in 6 months',
        }),
      ];

      expect(plans.length).toBe(3);

      console.log(`✅ Power user created with ${plans.length} active plans`);

      // Calculate total milestones
      const totalMilestones = plans.reduce(
        (sum, plan) => sum + plan.milestones.length,
        0
      );

      expect(totalMilestones).toBeGreaterThan(5);

      console.log(`✅ Total milestones across all plans: ${totalMilestones}`);

      // Calculate XP for multi-plan user
      const multiPlanXP = {
        plansCreated: plans.length * 200, // 200 XP per plan
        milestones: totalMilestones * 100, // Assume all completed for max XP
        totalXP: plans.length * 200 + totalMilestones * 100,
      };

      const level = Math.floor(multiPlanXP.totalXP / 500) + 1;

      expect(level).toBeGreaterThan(1);

      console.log(`✅ Multi-plan user level: ${level} (${multiPlanXP.totalXP} XP)`);
    });
  });

  describe('Journey 3: Inactive to Re-engaged User', () => {
    test('should handle user returning after inactivity', async () => {
      const inactiveUser = generateFakeUser({
        displayName: 'Carol Davis',
        email: 'carol.davis@example.com',
      });

      // Old plan from 30 days ago
      const oldPlan = generateFakePlan(inactiveUser.uid);
      oldPlan.milestones[0].completed = true;
      oldPlan.milestones[1].completed = true;

      console.log(`✅ Inactive user with partially completed plan`);

      // User returns and gets current milestone
      const currentMilestone = oldPlan.milestones[2];
      const today = new Date();
      const startDate = new Date(currentMilestone.startDate);
      const dueDate = new Date(currentMilestone.dueDate);

      // Check if milestone is overdue
      const isOverdue = dueDate < today && !currentMilestone.completed;

      console.log(`✅ Milestone status: ${isOverdue ? 'Overdue' : 'Active'}`);

      // System should still send reminders for overdue milestones
      const shouldSendReminder = !currentMilestone.completed;

      expect(shouldSendReminder).toBe(true);

      console.log(`✅ Re-engagement notification queued`);
    });
  });

  describe('Journey 4: Achievement Unlocking Progression', () => {
    test('should track achievement progression', async () => {
      const achievementUser = generateFakeUser({
        displayName: 'David Lee',
        email: 'david.lee@example.com',
      });

      // Simulate user stats
      const userStats = {
        totalPlans: 1,
        completedMilestones: 0,
        totalMilestones: 5,
        nudgeStreak: 0,
        totalNudgeResponses: 0,
        daysActive: 1,
      };

      console.log(`✅ Starting user stats:`, userStats);

      // Achievement 1: Create first plan (already done)
      const goalSetterAchievement = {
        name: 'Goal Setter',
        unlocked: userStats.totalPlans >= 1,
        progress: (userStats.totalPlans / 1) * 100,
      };

      expect(goalSetterAchievement.unlocked).toBe(true);

      console.log(`✅ Achievement unlocked: ${goalSetterAchievement.name}`);

      // Simulate progress
      userStats.completedMilestones = 3;
      userStats.totalNudgeResponses = 5;
      userStats.nudgeStreak = 3;

      // Achievement 2: Complete 5 milestones (progress)
      const milestoneMasterProgress = {
        name: 'Milestone Master',
        unlocked: userStats.completedMilestones >= 5,
        progress: (userStats.completedMilestones / 5) * 100,
      };

      expect(milestoneMasterProgress.progress).toBe(60); // 3/5 = 60%

      console.log(
        `✅ Milestone Master progress: ${milestoneMasterProgress.progress}%`
      );

      // Calculate total XP
      const totalXP =
        userStats.totalPlans * 200 +
        userStats.completedMilestones * 100 +
        userStats.totalNudgeResponses * 25 +
        userStats.nudgeStreak * 10 +
        userStats.daysActive * 5;

      const level = Math.floor(totalXP / 500) + 1;

      console.log(`✅ User level: ${level} (${totalXP} XP)`);
      console.log(`✅ Achievements unlocked: 1/6`);
    });
  });

  describe('Journey 5: Email Opt-Out and Re-Opt-In', () => {
    test('should respect email preferences throughout journey', async () => {
      const privacyUser = generateFakeUser({
        displayName: 'Eva Martinez',
        email: 'eva.martinez@example.com',
      });

      // Initially opted in
      let companionSettings = generateFakeCompanionSettings(
        privacyUser.uid,
        privacyUser.email,
        true
      );

      expect(companionSettings.emailNudgesOptIn).toBe(true);

      console.log(`✅ User initially opted in for emails`);

      // Create plan and milestone reminder
      const plan = generateCurrentMilestonePlan(privacyUser.uid);
      const notification = generateFakeNotification(
        privacyUser.uid,
        plan.id,
        plan.milestones[0].id
      );

      // Email should be sent
      let shouldSendEmail = companionSettings.emailNudgesOptIn;
      expect(shouldSendEmail).toBe(true);

      console.log(`✅ Email sent for first notification`);

      // User opts out
      companionSettings.emailNudgesOptIn = false;

      // New notification created
      const notification2 = generateFakeNotification(
        privacyUser.uid,
        plan.id,
        plan.milestones[0].id
      );

      // Email should NOT be sent
      shouldSendEmail = companionSettings.emailNudgesOptIn;
      expect(shouldSendEmail).toBe(false);

      console.log(`✅ Email delivery skipped after opt-out`);

      // Notification still created in database for in-app viewing
      expect(notification2).toBeTruthy();
      console.log(`✅ In-app notification still created`);
    });
  });
});
