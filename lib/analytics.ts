import posthog from 'posthog-js';

// PostHog configuration
const POSTHOG_KEY = process.env.NEXT_PUBLIC_POSTHOG_KEY || '';
const POSTHOG_HOST = process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://app.posthog.com';

let isInitialized = false;

/**
 * Initialize PostHog - should be called once on app load
 */
export const initPostHog = () => {
  if (typeof window === 'undefined') {
    console.log('🔒 PostHog: Skipping initialization (server-side)');
    return;
  }

  if (isInitialized) {
    console.log('✅ PostHog: Already initialized');
    return;
  }

  console.log('🔑 PostHog Key:', POSTHOG_KEY ? `${POSTHOG_KEY.substring(0, 10)}...` : 'NOT FOUND');
  console.log('🌐 PostHog Host:', POSTHOG_HOST);

  if (!POSTHOG_KEY) {
    console.warn('⚠️ PostHog key not found. Analytics disabled.');
    console.warn('Add NEXT_PUBLIC_POSTHOG_KEY to your .env.local file');
    return;
  }

  try {
    console.log('🚀 Initializing PostHog...');
    posthog.init(POSTHOG_KEY, {
      api_host: POSTHOG_HOST,
      loaded: (posthog) => {
        console.log('✅ PostHog loaded successfully!');
        console.log('📊 PostHog ready to track events');
      },
      capture_pageview: false, // We'll handle page views manually
      capture_pageleave: true,
      autocapture: false, // Disable autocapture for better control
      capture_performance: false, // Disable Web Vitals to prevent warnings
      debug: process.env.NODE_ENV === 'development', // Enable debug mode in development
    });

    isInitialized = true;
    console.log('✅ PostHog initialization complete');
  } catch (error) {
    console.error('❌ Error initializing PostHog:', error);
  }
};

/**
 * Track a custom event
 */
export const trackEvent = (eventName: string, properties?: Record<string, any>) => {
  if (typeof window === 'undefined') return;

  if (!isInitialized) {
    console.warn('⚠️ PostHog not initialized. Cannot track event:', eventName);
    return;
  }

  try {
    posthog.capture(eventName, properties);
    console.log('📊 Event tracked:', eventName, properties || '(no properties)');
  } catch (error) {
    console.error('❌ Error tracking event:', error);
  }
};

/**
 * Track page view
 */
export const trackPageView = (path: string, properties?: Record<string, any>) => {
  if (typeof window === 'undefined') return;

  if (!isInitialized) {
    console.warn('⚠️ PostHog not initialized. Cannot track page view:', path);
    return;
  }

  try {
    posthog.capture('$pageview', {
      $current_url: path,
      ...properties,
    });
    console.log('📄 Page view:', path);
  } catch (error) {
    console.error('❌ Error tracking page view:', error);
  }
};

/**
 * Identify user - call after authentication
 */
export const identifyUser = (userId: string, traits?: Record<string, any>) => {
  if (typeof window === 'undefined') return;

  if (!isInitialized) {
    console.warn('⚠️ PostHog not initialized. Cannot identify user:', userId);
    return;
  }

  try {
    posthog.identify(userId, traits);
    console.log('👤 User identified:', userId, traits || '(no traits)');
  } catch (error) {
    console.error('❌ Error identifying user:', error);
  }
};

/**
 * Reset user identity - call on logout
 */
export const resetUser = () => {
  if (typeof window === 'undefined') return;
  if (!isInitialized) return;

  try {
    posthog.reset();

    if (process.env.NODE_ENV === 'development') {
      console.log('🔄 User reset');
    }
  } catch (error) {
    console.error('Error resetting user:', error);
  }
};

/**
 * Set user properties
 */
export const setUserProperties = (properties: Record<string, any>) => {
  if (typeof window === 'undefined') return;
  if (!isInitialized) return;

  try {
    posthog.people.set(properties);
  } catch (error) {
    console.error('Error setting user properties:', error);
  }
};

// ============================================
// CONVENIENCE TRACKING FUNCTIONS
// ============================================

// Onboarding Events
export const trackEnneagramCompleted = (enneagramType: string, wing?: string) => {
  trackEvent('enneagram_completed', {
    enneagram_type: enneagramType,
    wing: wing || null,
  });
};

export const trackAuthSignIn = (method: string = 'google') => {
  trackEvent('auth_signin', {
    method,
  });
};

export const trackFirstGoalCreated = (goalType?: string, milestoneCount?: number) => {
  trackEvent('first_goal_created', {
    goal_type: goalType,
    milestone_count: milestoneCount,
  });
};

// Goal Wizard Events
export const trackWizardStepComplete = (stepNumber: number, stepName: string, data?: Record<string, any>) => {
  trackEvent('wizard_step_complete', {
    step_number: stepNumber,
    step_name: stepName,
    ...data,
  });
};

export const trackGoalCreated = (data: {
  goalType?: string;
  milestoneCount: number;
  hasTimePressure: boolean;
  nudgeFrequency: string;
  nudgeDays?: number[]; // Custom day selection for nudges
  targetDays?: number;
}) => {
  trackEvent('goal_created', data);
};

export const trackMilestoneEdited = (data: {
  planId: string;
  milestoneIndex: number;
  editType: 'title' | 'description' | 'dates' | 'full';
}) => {
  trackEvent('milestone_edited', data);
};

// Nudge Events
export const trackNudgeViewed = (nudgeId: string, planId: string, milestoneTitle?: string) => {
  trackEvent('nudge_viewed', {
    nudge_id: nudgeId,
    plan_id: planId,
    milestone_title: milestoneTitle,
  });
};

export const trackNudgeFeedback = (data: {
  nudgeId: string;
  planId: string;
  feedbackType: 'like' | 'better' | 'dont_relate';
}) => {
  trackEvent('nudge_feedback', data);
};

export const trackReflectionStarted = (nudgeId: string, planId: string) => {
  trackEvent('reflection_started', {
    nudge_id: nudgeId,
    plan_id: planId,
  });
};

export const trackReflectionCompleted = (nudgeId: string, planId: string, messageCount: number) => {
  trackEvent('reflection_completed', {
    nudge_id: nudgeId,
    plan_id: planId,
    message_count: messageCount,
  });
};

// Milestone Events
export const trackMilestoneCompleted = (data: {
  planId: string;
  milestoneIndex: number;
  milestoneTitle: string;
  daysSinceStart?: number;
}) => {
  trackEvent('milestone_completed', data);
};

export const trackMilestoneUncompleted = (planId: string, milestoneIndex: number) => {
  trackEvent('milestone_uncompleted', {
    plan_id: planId,
    milestone_index: milestoneIndex,
  });
};

// Plan Events
export const trackPlanPaused = (planId: string, daysSinceCreation: number, milestonesCompleted: number) => {
  trackEvent('plan_paused', {
    plan_id: planId,
    days_since_creation: daysSinceCreation,
    milestones_completed: milestonesCompleted,
  });
};

export const trackPlanResumed = (planId: string, daysSincePaused: number) => {
  trackEvent('plan_resumed', {
    plan_id: planId,
    days_since_paused: daysSincePaused,
  });
};

export const trackPlanDeleted = (planId: string, daysSinceCreation: number, milestonesCompleted: number, totalMilestones: number) => {
  trackEvent('plan_deleted', {
    plan_id: planId,
    days_since_creation: daysSinceCreation,
    milestones_completed: milestonesCompleted,
    total_milestones: totalMilestones,
  });
};

// Feedback Events
export const trackAppFeedback = (data: {
  sentiment: 'love' | 'good' | 'okay' | 'frustrated';
  page: string;
  hasComment: boolean;
  deviceType: 'mobile' | 'desktop';
}) => {
  trackEvent('app_feedback_submitted', data);
};

// Navigation Events
export const trackButtonClick = (buttonName: string, location: string, context?: Record<string, any>) => {
  trackEvent('button_click', {
    button_name: buttonName,
    location,
    ...context,
  });
};

export const trackModalOpen = (modalName: string, trigger?: string) => {
  trackEvent('modal_open', {
    modal_name: modalName,
    trigger,
  });
};

export const trackModalClose = (modalName: string, action?: string) => {
  trackEvent('modal_close', {
    modal_name: modalName,
    action,
  });
};

// Settings Events
export const trackSettingsChanged = (settingName: string, newValue: any, oldValue?: any) => {
  trackEvent('settings_changed', {
    setting_name: settingName,
    new_value: newValue,
    old_value: oldValue,
  });
};

// Notification Events
export const trackNotificationClicked = (notificationId: string, notificationType: string) => {
  trackEvent('notification_clicked', {
    notification_id: notificationId,
    notification_type: notificationType,
  });
};

export const trackNotificationMarkAllRead = (count: number) => {
  trackEvent('notification_mark_all_read', {
    notification_count: count,
  });
};
