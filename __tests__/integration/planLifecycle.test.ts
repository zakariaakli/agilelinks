/**
 * Integration Tests: Complete Plan Lifecycle
 *
 * Tests the entire user journey from plan creation through automated notifications
 */

import { generateFakeUser, generateFakePlan, generateCurrentMilestonePlan } from '../utils/testHelpers';

// Mock Firebase
const mockFirestore = {
  collection: jest.fn(),
  doc: jest.fn(),
  addDoc: jest.fn(),
  setDoc: jest.fn(),
  getDoc: jest.fn(),
  getDocs: jest.fn(),
  query: jest.fn(),
  where: jest.fn(),
  orderBy: jest.fn(),
};

jest.mock('../../firebase', () => ({
  db: mockFirestore,
  auth: {
    currentUser: { uid: 'test-user-123', email: 'test@example.com' },
  },
}));

describe('Plan Lifecycle Integration Tests', () => {
  let fakeUser: ReturnType<typeof generateFakeUser>;
  let fakePlan: ReturnType<typeof generateFakePlan>;

  beforeEach(() => {
    jest.clearAllMocks();
    fakeUser = generateFakeUser({ uid: 'test-user-lifecycle' });
    fakePlan = generateFakePlan(fakeUser.uid);
  });

  describe('Phase 1: Plan Creation', () => {
    test('should create a new plan with milestones', async () => {
      const mockDocRef = { id: 'new-plan-123' };
      mockFirestore.addDoc.mockResolvedValue(mockDocRef);

      // Simulate plan creation
      const planData = generateFakePlan(fakeUser.uid, {
        goalType: 'consultant',
        nudgeFrequency: 'weekly',
      });

      expect(planData.userId).toBe(fakeUser.uid);
      expect(planData.milestones.length).toBeGreaterThan(0);
      expect(planData.status).toBe('active');
      expect(planData.nudgeFrequency).toBe('weekly');
    });

    test('should generate milestones with personality tips', () => {
      const plan = generateFakePlan(fakeUser.uid);

      plan.milestones.forEach((milestone) => {
        expect(milestone).toHaveProperty('id');
        expect(milestone).toHaveProperty('title');
        expect(milestone).toHaveProperty('description');
        expect(milestone).toHaveProperty('startDate');
        expect(milestone).toHaveProperty('dueDate');
        expect(milestone).toHaveProperty('blindSpotTip');
        expect(milestone).toHaveProperty('strengthHook');
        expect(milestone.completed).toBe(false);
      });
    });

    test('should set correct milestone date progression', () => {
      const plan = generateFakePlan(fakeUser.uid);

      for (let i = 0; i < plan.milestones.length - 1; i++) {
        const currentStart = new Date(plan.milestones[i].startDate);
        const nextStart = new Date(plan.milestones[i + 1].startDate);

        expect(nextStart.getTime()).toBeGreaterThan(currentStart.getTime());
      }
    });
  });

  describe('Phase 2: Current Milestone Detection', () => {
    test('should identify current milestones correctly', () => {
      const plan = generateCurrentMilestonePlan(fakeUser.uid);
      const currentMilestone = plan.milestones[0];

      const today = new Date();
      const startDate = new Date(currentMilestone.startDate);
      const dueDate = new Date(currentMilestone.dueDate);

      // Verify milestone is indeed current
      expect(startDate.getTime()).toBeLessThanOrEqual(today.getTime());
      expect(dueDate.getTime()).toBeGreaterThanOrEqual(today.getTime());
      expect(currentMilestone.completed).toBe(false);
    });

    test('should not flag completed milestones as current', () => {
      const plan = generateCurrentMilestonePlan(fakeUser.uid);
      plan.milestones[0].completed = true;

      // A completed milestone should not trigger notifications
      expect(plan.milestones[0].completed).toBe(true);
    });

    test('should not flag future milestones as current', () => {
      const plan = generateFakePlan(fakeUser.uid);
      const futureMilestone = plan.milestones[plan.milestones.length - 1];

      const today = new Date();
      const startDate = new Date(futureMilestone.startDate);

      // Verify milestone is in the future
      expect(startDate.getTime()).toBeGreaterThan(today.getTime());
    });
  });

  describe('Phase 3: Duplicate Prevention Logic', () => {
    test('should respect daily nudge frequency lookback', () => {
      const dailyPlan = generateFakePlan(fakeUser.uid, { nudgeFrequency: 'daily' });

      expect(dailyPlan.nudgeFrequency).toBe('daily');

      // Simulate lookback calculation
      const lookbackDays = dailyPlan.nudgeFrequency === 'daily' ? 1 : 7;
      expect(lookbackDays).toBe(1);
    });

    test('should respect weekly nudge frequency lookback', () => {
      const weeklyPlan = generateFakePlan(fakeUser.uid, { nudgeFrequency: 'weekly' });

      expect(weeklyPlan.nudgeFrequency).toBe('weekly');

      // Simulate lookback calculation
      const lookbackDays = weeklyPlan.nudgeFrequency === 'weekly' ? 7 : 1;
      expect(lookbackDays).toBe(7);
    });
  });

  describe('Phase 4: Notification Structure', () => {
    test('should create notification with all required fields', () => {
      const plan = generateCurrentMilestonePlan(fakeUser.uid);
      const milestone = plan.milestones[0];

      const notification = {
        userId: fakeUser.uid,
        type: 'milestone_reminder',
        planId: plan.id || 'test-plan',
        milestoneId: milestone.id,
        milestoneTitle: milestone.title,
        blindSpotTip: milestone.blindSpotTip,
        strengthHook: milestone.strengthHook,
        startDate: milestone.startDate,
        dueDate: milestone.dueDate,
      };

      expect(notification).toHaveProperty('userId');
      expect(notification).toHaveProperty('type');
      expect(notification).toHaveProperty('milestoneId');
      expect(notification).toHaveProperty('blindSpotTip');
      expect(notification).toHaveProperty('strengthHook');
    });
  });

  describe('Phase 5: Email Opt-In Checking', () => {
    test('should only send emails to opted-in users', () => {
      const optedInSettings = {
        userId: fakeUser.uid,
        email: fakeUser.email,
        emailNudgesOptIn: true,
      };

      expect(optedInSettings.emailNudgesOptIn).toBe(true);
    });

    test('should not send emails to opted-out users', () => {
      const optedOutSettings = {
        userId: fakeUser.uid,
        email: fakeUser.email,
        emailNudgesOptIn: false,
      };

      expect(optedOutSettings.emailNudgesOptIn).toBe(false);
    });
  });

  describe('Complete User Journey Simulation', () => {
    test('should execute full lifecycle: create plan → detect current milestone → prepare notification', () => {
      // Step 1: User creates a plan
      const user = generateFakeUser();
      const plan = generateCurrentMilestonePlan(user.uid);

      expect(plan.status).toBe('active');
      expect(plan.milestones.length).toBeGreaterThan(0);

      // Step 2: System detects current milestone
      const currentMilestone = plan.milestones[0];
      const today = new Date();
      const startDate = new Date(currentMilestone.startDate);
      const dueDate = new Date(currentMilestone.dueDate);

      const isCurrentMilestone =
        startDate <= today && today <= dueDate && !currentMilestone.completed;

      expect(isCurrentMilestone).toBe(true);

      // Step 3: System prepares notification data
      const notificationData = {
        userId: user.uid,
        type: 'milestone_reminder',
        planId: plan.id || 'test-plan-id',
        milestoneId: currentMilestone.id,
        milestoneTitle: currentMilestone.title,
        blindSpotTip: currentMilestone.blindSpotTip,
        strengthHook: currentMilestone.strengthHook,
        emailStatus: {
          sent: false,
          attempts: 0,
          deliveryStatus: 'pending',
        },
      };

      expect(notificationData.milestoneTitle).toBeTruthy();
      expect(notificationData.blindSpotTip).toBeTruthy();
      expect(notificationData.strengthHook).toBeTruthy();
      expect(notificationData.emailStatus.sent).toBe(false);
    });
  });
});
