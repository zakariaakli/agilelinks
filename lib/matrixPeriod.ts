import { MatrixPeriodType } from '../Models/PriorityMatrix';

/**
 * Period computation for the Priority Matrix.
 * A period is a [periodStart, periodEnd] window (inclusive, ISO YYYY-MM-DD)
 * plus a human label. Quarter is the default; month and custom are supported.
 *
 * See Functional Documentation/PRIORITY_MATRIX.md.
 */

export interface MatrixPeriod {
  periodType: MatrixPeriodType;
  periodStart: string;
  periodEnd: string;
  periodLabel: string;
}

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

/** Format a Date as YYYY-MM-DD (UTC). */
export function toISODate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

/** Quarter window containing `now`. Q1 Jan–Mar, Q2 Apr–Jun, Q3 Jul–Sep, Q4 Oct–Dec. */
export function getQuarterPeriod(now: Date): MatrixPeriod {
  const year = now.getUTCFullYear();
  const quarterIndex = Math.floor(now.getUTCMonth() / 3); // 0..3
  const startMonth = quarterIndex * 3;
  const start = new Date(Date.UTC(year, startMonth, 1));
  // Day 0 of (startMonth + 3) is the last day of the quarter.
  const end = new Date(Date.UTC(year, startMonth + 3, 0));
  return {
    periodType: 'quarter',
    periodStart: toISODate(start),
    periodEnd: toISODate(end),
    periodLabel: `Q${quarterIndex + 1} ${year}`,
  };
}

/** Calendar month window containing `now`. */
export function getMonthPeriod(now: Date): MatrixPeriod {
  const year = now.getUTCFullYear();
  const month = now.getUTCMonth();
  const start = new Date(Date.UTC(year, month, 1));
  const end = new Date(Date.UTC(year, month + 1, 0));
  return {
    periodType: 'month',
    periodStart: toISODate(start),
    periodEnd: toISODate(end),
    periodLabel: `${MONTH_NAMES[month]} ${year}`,
  };
}

/**
 * Resolve a period from a requested type. For 'custom' both customStart and
 * customEnd are required (ISO YYYY-MM-DD); otherwise falls back to quarter.
 */
export function computePeriod(
  periodType: MatrixPeriodType,
  now: Date,
  customStart?: string,
  customEnd?: string
): MatrixPeriod {
  if (periodType === 'month') return getMonthPeriod(now);
  if (periodType === 'custom') {
    if (customStart && customEnd) {
      return {
        periodType: 'custom',
        periodStart: customStart,
        periodEnd: customEnd,
        periodLabel: `${customStart} → ${customEnd}`,
      };
    }
    // Missing bounds — fall back to the quarter containing `now`.
    return getQuarterPeriod(now);
  }
  return getQuarterPeriod(now);
}

/** True when the period's target date has passed (matrix is due for rollover). */
export function isPeriodExpired(periodEnd: string, now: Date): boolean {
  return toISODate(now) > periodEnd;
}

/** Whole days remaining until periodEnd (>= 0; 0 once the end date is reached). */
export function daysRemaining(periodEnd: string, now: Date): number {
  const end = new Date(`${periodEnd}T00:00:00.000Z`).getTime();
  const today = new Date(`${toISODate(now)}T00:00:00.000Z`).getTime();
  const diff = Math.round((end - today) / 86_400_000);
  return diff > 0 ? diff : 0;
}
