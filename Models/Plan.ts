import { Timestamp } from 'firebase/firestore';
import { Step } from './Step';

export interface Milestone {
  id: string;
  title: string;
  description: string;
  startDate: string;
  dueDate: string;
  completed: boolean;
  blindSpotTip?: string;
  strengthHook?: string;
  steps?: Step[];
}

export interface Plan {
  id: string;
  userId: string;
  goalType: string;
  goal: string;
  targetDate: string;
  hasTimePressure: boolean;
  nudgeFrequency?: 'daily' | 'weekly' | 'custom';
  nudgeDays?: number[];
  milestones: Milestone[];
  status: 'active' | 'completed' | 'paused';
  createdAt: Date | Timestamp;
  updatedAt?: Date | Timestamp;
}
