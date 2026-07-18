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
  goalName?: string; // Short AI-generated name, e.g. "Promotion by Q4"
  targetDate: string;
  hasTimePressure: boolean;
  // Optional. Drives the importance axis of the Priority Matrix.
  // Undefined is treated as 'medium'. See Functional Documentation/PRIORITY_MATRIX.md.
  importance?: 'high' | 'medium' | 'low';
  nudgeFrequency?: 'daily' | 'weekly' | 'custom';
  nudgeDays?: number[];
  milestones: Milestone[];
  status: 'active' | 'completed' | 'paused';
  createdAt: Date | Timestamp;
  updatedAt?: Date | Timestamp;
}
