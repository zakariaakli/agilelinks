import { Timestamp } from 'firebase/firestore';

/**
 * Eisenhower quadrants (urgency × importance).
 * See Functional Documentation/PRIORITY_MATRIX.md.
 */
export type Quadrant =
  | 'urgent_important'
  | 'not_urgent_important'
  | 'urgent_not_important'
  | 'not_urgent_not_important';

export type MatrixPeriodType = 'quarter' | 'month' | 'custom';

/**
 * One active matrix per user per period; previous periods are archived.
 * Stored at: priorityMatrices/{matrixId}
 */
export interface PriorityMatrix {
  id: string;
  userId: string;
  status: 'active' | 'archived';
  periodType: MatrixPeriodType;
  periodStart: string; // ISO date YYYY-MM-DD
  periodEnd: string; // ISO date YYYY-MM-DD — the "quarter target date"
  periodLabel: string; // e.g. "Q2 2026"
  createdAt: Date | Timestamp;
  updatedAt?: Date | Timestamp;
}

/**
 * A single action in the grid.
 * Stored at: priorityMatrices/{matrixId}/actions/{actionId}
 *
 * Actions reference their originating goal/milestone by id — goal data is
 * never duplicated. `manualOverride` becomes true once the user moves an
 * action, after which the classifier leaves it alone.
 */
export interface MatrixAction {
  id: string;
  title: string;
  quadrant: Quadrant;
  source: 'ai' | 'user'; // auto-seeded vs user-added
  sourcePlanId?: string; // link back to originating goal
  sourcePlanTitle?: string; // goal name shown as a chip on the card
  sourceMilestoneId?: string; // link back to originating milestone
  manualOverride: boolean; // true once user moves it → AI won't re-classify
  status: 'open' | 'done' | 'removed';
  effortMinutes: number; // accumulated from daily reports
  lastWorkedOn?: string; // ISO date
  createdAt: Date | Timestamp;
  updatedAt?: Date | Timestamp;
}

/**
 * One evening check-in, keyed by YYYY-MM-DD.
 * Stored at: priorityMatrices/{matrixId}/dailyLogs/{YYYY-MM-DD}
 */
export interface MatrixDailyLog {
  id: string; // YYYY-MM-DD
  reportedText: string; // raw user input from chat
  mappedActions: Array<{
    actionId: string;
    effortMinutes: number;
    quadrant: Quadrant;
  }>;
  aiSummary: string;
  worthItScore: number; // 0..1 — effort concentration in important quadrants
  createdAt: Date | Timestamp;
}

/**
 * Seed descriptor produced by the classifier before Firestore ids/timestamps
 * are assigned. Consumed by POST /api/matrix when seeding or refreshing.
 */
export interface SeedActionDescriptor {
  title: string;
  quadrant: Quadrant;
  sourcePlanId: string;
  sourcePlanTitle: string;
  sourceMilestoneId?: string; // undefined for goal-level seeds
}
