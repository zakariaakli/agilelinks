// Utility functions for setting up nudge configurations
// This file can be expanded in the future for nudge scheduling preferences

export interface NudgeSettings {
  userId: string;
  emailEnabled: boolean;
  frequency: 'daily' | 'weekly' | 'milestone_only';
  preferredTime?: string; // HH:MM format
}

export function createDefaultNudgeSettings(userId: string): NudgeSettings {
  return {
    userId,
    emailEnabled: true,
    frequency: 'weekly',
    preferredTime: '09:00'
  };
}

export function validateNudgeSettings(settings: Partial<NudgeSettings>): boolean {
  if (!settings.userId) return false;
  if (settings.frequency && !['daily', 'weekly', 'milestone_only'].includes(settings.frequency)) return false;
  if (settings.preferredTime && !/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(settings.preferredTime)) return false;
  return true;
}