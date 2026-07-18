import { MatrixAction } from '../Models/PriorityMatrix';
import { daysRemaining, toISODate } from './matrixPeriod';

export type TrajectoryStatus = 'on_track' | 'at_risk' | 'off_track';

export interface TrajectoryResult {
  status: TrajectoryStatus;
  /** 0..1 — fraction of important work completed */
  completionRatio: number;
  /** 0..1 — fraction of period elapsed */
  timeRatio: number;
  daysLeft: number;
  totalImportant: number;
  doneImportant: number;
  /** Effort allocation insight (human-readable) */
  insight: string;
}

const IMPORTANT_QUADRANTS = new Set(['urgent_important', 'not_urgent_important']);

/**
 * Compute trajectory for the active matrix.
 * Status thresholds (completion vs time elapsed):
 *   on_track  — completion >= timeRatio - 0.10
 *   at_risk   — completion >= timeRatio - 0.25
 *   off_track — completion <  timeRatio - 0.25
 */
export function computeTrajectory(
  actions: MatrixAction[],
  periodStart: string,
  periodEnd: string,
  now: Date
): TrajectoryResult {
  const important = actions.filter(
    a => IMPORTANT_QUADRANTS.has(a.quadrant) && a.status !== 'removed'
  );
  const doneImportant = important.filter(a => a.status === 'done').length;
  const totalImportant = important.length;

  const completionRatio = totalImportant > 0 ? doneImportant / totalImportant : 0;

  const start = new Date(`${periodStart}T00:00:00.000Z`).getTime();
  const end = new Date(`${periodEnd}T00:00:00.000Z`).getTime();
  const elapsed = new Date(`${toISODate(now)}T00:00:00.000Z`).getTime() - start;
  const total = end - start || 1;
  const timeRatio = Math.min(Math.max(elapsed / total, 0), 1);

  const daysLeft = daysRemaining(periodEnd, now);

  const gap = completionRatio - timeRatio;
  let status: TrajectoryStatus;
  if (gap >= -0.10) status = 'on_track';
  else if (gap >= -0.25) status = 'at_risk';
  else status = 'off_track';

  // Effort allocation insight
  const totalEffort = actions.reduce((s, a) => s + (a.effortMinutes || 0), 0);
  const unimportantEffort = actions
    .filter(a => !IMPORTANT_QUADRANTS.has(a.quadrant) && a.status !== 'removed')
    .reduce((s, a) => s + (a.effortMinutes || 0), 0);
  const unimportantPct = totalEffort > 0 ? Math.round((unimportantEffort / totalEffort) * 100) : 0;

  let insight = '';
  if (totalEffort === 0) {
    insight = 'No effort logged yet — start your first check-in tonight.';
  } else if (unimportantPct >= 50) {
    insight = `${unimportantPct}% of your effort went to non-important work this period — that trends toward a missed quarter.`;
  } else if (status === 'on_track') {
    insight = `You're on pace. Keep protecting time for the important quadrants.`;
  } else if (status === 'at_risk') {
    insight = `Slightly behind pace — ${daysLeft} days left to close the gap.`;
  } else {
    insight = `Significantly behind pace — consider cutting the non-essential work to recover.`;
  }

  return { status, completionRatio, timeRatio, daysLeft, totalImportant, doneImportant, insight };
}
