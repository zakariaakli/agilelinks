/**
 * Test Utilities and Fake Data Generators
 *
 * This file provides helper functions to create fake users, plans, and test data
 * for automated integration testing.
 */

import { Timestamp } from 'firebase/firestore';

// ==================== FAKE USER GENERATORS ====================

export interface FakeUser {
  uid: string;
  email: string;
  displayName: string;
  enneagramResult: EnneagramResult;
}

export interface EnneagramResult {
  enneagramType1: number;
  enneagramType2: number;
  enneagramType3: number;
  enneagramType4: number;
  enneagramType5: number;
  enneagramType6: number;
  enneagramType7: number;
  enneagramType8: number;
  enneagramType9: number;
  summary: string;
  name: string;
  email: string;
}

export const generateFakeUser = (overrides?: Partial<FakeUser>): FakeUser => {
  const id = overrides?.uid || `test-user-${Date.now()}-${Math.random().toString(36).substring(7)}`;
  const enneagramType = Math.floor(Math.random() * 9) + 1;

  return {
    uid: id,
    email: overrides?.email || `test-${id}@example.com`,
    displayName: overrides?.displayName || `Test User ${id.substring(0, 8)}`,
    enneagramResult: overrides?.enneagramResult || generateEnneagramResult(enneagramType),
  };
};

export const generateEnneagramResult = (dominantType: number = 3): EnneagramResult => {
  const scores: Record<string, number> = {};

  // Generate scores with dominant type being highest
  for (let i = 1; i <= 9; i++) {
    if (i === dominantType) {
      scores[`enneagramType${i}`] = Math.floor(Math.random() * 3) + 8; // 8-10
    } else {
      scores[`enneagramType${i}`] = Math.floor(Math.random() * 7) + 1; // 1-7
    }
  }

  const typeNames: Record<number, string> = {
    1: 'The Reformer',
    2: 'The Helper',
    3: 'The Achiever',
    4: 'The Individualist',
    5: 'The Investigator',
    6: 'The Loyalist',
    7: 'The Enthusiast',
    8: 'The Challenger',
    9: 'The Peacemaker',
  };

  return {
    ...(scores as any),
    summary: `You are primarily an Enneagram Type ${dominantType} - ${typeNames[dominantType]}. This type is characterized by strong achievement orientation and goal-driven behavior.`,
    name: `Test User Type ${dominantType}`,
    email: `type${dominantType}@test.com`,
  };
};

// ==================== FAKE PLAN GENERATORS ====================

export interface FakePlan {
  id?: string;
  userId: string;
  goalType: string;
  goal: string;
  targetDate: string;
  hasTimePressure: boolean;
  nudgeFrequency: 'daily' | 'weekly';
  milestones: FakeMilestone[];
  status: 'active' | 'completed' | 'paused';
  createdAt: any;
}

export interface FakeMilestone {
  id: string;
  title: string;
  description: string;
  startDate: string;
  dueDate: string;
  completed: boolean;
  blindSpotTip?: string;
  strengthHook?: string;
}

export const generateFakePlan = (userId: string, overrides?: Partial<FakePlan>): FakePlan => {
  const targetDate = new Date();
  targetDate.setDate(targetDate.getDate() + 180); // 6 months from now

  return {
    userId,
    goalType: overrides?.goalType || 'consultant',
    goal: overrides?.goal || 'I want to become a management consultant at a top-tier firm like McKinsey, BCG, or Bain after graduating with my MBA.',
    targetDate: overrides?.targetDate || targetDate.toISOString().split('T')[0],
    hasTimePressure: overrides?.hasTimePressure || false,
    nudgeFrequency: overrides?.nudgeFrequency || 'weekly',
    milestones: overrides?.milestones || generateFakeMilestones(targetDate),
    status: overrides?.status || 'active',
    createdAt: Timestamp.now(),
  };
};

export const generateFakeMilestones = (targetDate: Date, count: number = 5): FakeMilestone[] => {
  const milestones: FakeMilestone[] = [];
  const totalDays = Math.floor((targetDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  const daysPerMilestone = Math.floor(totalDays / count);

  const titles = [
    'Research target companies',
    'Build networking connections',
    'Develop case interview skills',
    'Complete mock interviews',
    'Submit applications',
  ];

  const blindSpots = [
    'Perfectionists may spend too much time on research - set time limits!',
    'Remember to follow up with contacts - don\'t let connections go cold.',
    'Don\'t let fear of imperfection stop you from practicing - quantity builds quality.',
    'Be open to constructive feedback - defensiveness blocks growth.',
    'Avoid rushing applications - quality matters more than speed.',
  ];

  const strengths = [
    'Your attention to detail will help you thoroughly understand company cultures.',
    'Your natural empathy makes networking authentic and effective.',
    'Your goal orientation helps you stay focused under pressure.',
    'Your analytical skills make case prep efficient and structured.',
    'Your drive for excellence shows in polished application materials.',
  ];

  for (let i = 0; i < count; i++) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() + (i * daysPerMilestone));

    const dueDate = new Date(startDate);
    dueDate.setDate(dueDate.getDate() + daysPerMilestone);

    milestones.push({
      id: `milestone-${i + 1}-${Date.now()}`,
      title: titles[i] || `Milestone ${i + 1}`,
      description: `Complete key activities for ${titles[i]?.toLowerCase() || `milestone ${i + 1}`}.`,
      startDate: startDate.toISOString().split('T')[0],
      dueDate: dueDate.toISOString().split('T')[0],
      completed: false,
      blindSpotTip: blindSpots[i],
      strengthHook: strengths[i],
    });
  }

  return milestones;
};

// ==================== CURRENT MILESTONE GENERATOR ====================

export const generateCurrentMilestonePlan = (userId: string): FakePlan => {
  const today = new Date();
  const startDate = new Date(today);
  startDate.setDate(startDate.getDate() - 7); // Started 7 days ago

  const dueDate = new Date(today);
  dueDate.setDate(dueDate.getDate() + 7); // Due in 7 days

  const milestone: FakeMilestone = {
    id: `current-milestone-${Date.now()}`,
    title: 'Complete market research analysis',
    description: 'Analyze top 5 target companies and their hiring patterns.',
    startDate: startDate.toISOString().split('T')[0],
    dueDate: dueDate.toISOString().split('T')[0],
    completed: false,
    blindSpotTip: 'Achievers may rush through analysis - take time to be thorough.',
    strengthHook: 'Your goal-orientation helps you stay focused on key findings.',
  };

  return generateFakePlan(userId, {
    milestones: [milestone],
  });
};

// ==================== FAKE NOTIFICATION GENERATOR ====================

export interface FakeNotification {
  id?: string;
  userId: string;
  type: string;
  prompt: string;
  createdAt: any;
  read: boolean;
  feedback: string | null;
  planId?: string;
  milestoneId?: string;
  milestoneTitle?: string;
  blindSpotTip?: string;
  strengthHook?: string;
  emailStatus: {
    sent: boolean;
    sentAt: any;
    attempts: number;
    deliveryStatus: string;
  };
  notificationMeta: {
    priority: string;
    category: string;
  };
}

export const generateFakeNotification = (
  userId: string,
  planId?: string,
  milestoneId?: string,
  overrides?: Partial<FakeNotification>
): FakeNotification => {
  return {
    userId,
    type: overrides?.type || 'milestone_reminder',
    prompt: overrides?.prompt || 'Great progress on your milestone! Keep pushing forward with your market research.',
    createdAt: Timestamp.now(),
    read: overrides?.read || false,
    feedback: overrides?.feedback || null,
    planId: planId || `plan-${Date.now()}`,
    milestoneId: milestoneId || `milestone-${Date.now()}`,
    milestoneTitle: overrides?.milestoneTitle || 'Test Milestone',
    blindSpotTip: overrides?.blindSpotTip || 'Stay focused and avoid perfectionism.',
    strengthHook: overrides?.strengthHook || 'Use your analytical skills to drive results.',
    emailStatus: overrides?.emailStatus || {
      sent: false,
      sentAt: null,
      attempts: 0,
      deliveryStatus: 'pending',
    },
    notificationMeta: overrides?.notificationMeta || {
      priority: 'medium',
      category: 'weekly_milestone',
    },
  };
};

// ==================== COMPANION SETTINGS GENERATOR ====================

export interface FakeCompanionSettings {
  userId: string;
  email: string;
  emailNudgesOptIn: boolean;
}

export const generateFakeCompanionSettings = (
  userId: string,
  email: string,
  optIn: boolean = true
): FakeCompanionSettings => {
  return {
    userId,
    email,
    emailNudgesOptIn: optIn,
  };
};

// ==================== TEST DATA CLEANUP ====================

export const TEST_USER_PREFIX = 'test-user-';
export const TEST_EMAIL_SUFFIX = '@example.com';

export const isTestData = (email: string): boolean => {
  return email.includes(TEST_EMAIL_SUFFIX);
};

// ==================== MOCK API RESPONSES ====================

export const mockOpenAIResponse = {
  questions: [
    'What specific consulting firms are you targeting?',
    'What timeline do you have in mind for this transition?',
    'What skills do you currently have that align with consulting?',
  ],
  isPersonalized: true,
  personalizationLevel: 'ai-enhanced' as const,
};

export const mockMilestonesResponse = {
  milestones: [
    {
      id: 'milestone-1',
      title: 'Network with consultants',
      description: 'Reach out to 10 consultants on LinkedIn',
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      startDate: new Date().toISOString().split('T')[0],
      blindSpotTip: 'Don\'t overthink the outreach message',
      strengthHook: 'Your analytical skills will help you ask great questions',
    },
  ],
};

export const mockNudgeResponse = {
  prompt: 'Great work this week! Keep building those consulting connections.',
};
