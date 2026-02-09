import { Timestamp } from 'firebase/firestore';

export interface Step {
  id: string;
  title: string;
  completed: boolean;
  completedAt?: Date | Timestamp | null;
  createdAt: Date | Timestamp;
  source: 'user' | 'ai';
  nudgeId?: string | null;
}

export interface StepsContext {
  active: Array<{
    title: string;
    daysOld: number;
  }>;
  recentlyCompleted: Array<{
    title: string;
    completedDaysAgo: number;
  }>;
  totalCompleted: number;
}
