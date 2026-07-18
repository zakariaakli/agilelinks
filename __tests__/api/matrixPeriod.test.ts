import {
  toISODate,
  getQuarterPeriod,
  getMonthPeriod,
  computePeriod,
  isPeriodExpired,
  daysRemaining,
} from '../../lib/matrixPeriod';

// Fixed reference date: 2026-05-15 (UTC) — Q2, May
const REF = new Date('2026-05-15T12:00:00.000Z');

describe('toISODate', () => {
  it('formats a Date as YYYY-MM-DD', () => {
    expect(toISODate(new Date('2026-01-07T00:00:00.000Z'))).toBe('2026-01-07');
  });
});

describe('getQuarterPeriod', () => {
  it('returns Q2 for May 2026', () => {
    const p = getQuarterPeriod(REF);
    expect(p.periodType).toBe('quarter');
    expect(p.periodStart).toBe('2026-04-01');
    expect(p.periodEnd).toBe('2026-06-30');
    expect(p.periodLabel).toBe('Q2 2026');
  });

  it('returns Q1 for Jan 1', () => {
    const p = getQuarterPeriod(new Date('2026-01-01T00:00:00.000Z'));
    expect(p.periodStart).toBe('2026-01-01');
    expect(p.periodEnd).toBe('2026-03-31');
    expect(p.periodLabel).toBe('Q1 2026');
  });

  it('returns Q4 for Dec 31', () => {
    const p = getQuarterPeriod(new Date('2026-12-31T00:00:00.000Z'));
    expect(p.periodLabel).toBe('Q4 2026');
    expect(p.periodEnd).toBe('2026-12-31');
  });
});

describe('getMonthPeriod', () => {
  it('returns May for REF date', () => {
    const p = getMonthPeriod(REF);
    expect(p.periodType).toBe('month');
    expect(p.periodStart).toBe('2026-05-01');
    expect(p.periodEnd).toBe('2026-05-31');
    expect(p.periodLabel).toBe('May 2026');
  });

  it('handles February correctly (28 days 2026)', () => {
    const p = getMonthPeriod(new Date('2026-02-15T00:00:00.000Z'));
    expect(p.periodEnd).toBe('2026-02-28');
  });
});

describe('computePeriod', () => {
  it('returns quarter by default', () => {
    const p = computePeriod('quarter', REF);
    expect(p.periodType).toBe('quarter');
  });

  it('returns month when requested', () => {
    const p = computePeriod('month', REF);
    expect(p.periodType).toBe('month');
  });

  it('returns custom period when both bounds supplied', () => {
    const p = computePeriod('custom', REF, '2026-06-01', '2026-08-31');
    expect(p.periodType).toBe('custom');
    expect(p.periodStart).toBe('2026-06-01');
    expect(p.periodEnd).toBe('2026-08-31');
  });

  it('falls back to quarter when custom bounds missing', () => {
    const p = computePeriod('custom', REF);
    expect(p.periodType).toBe('quarter');
  });
});

describe('isPeriodExpired', () => {
  it('returns false when today is before end', () => {
    expect(isPeriodExpired('2026-06-30', new Date('2026-05-15T00:00:00.000Z'))).toBe(false);
  });

  it('returns false on the end date itself', () => {
    expect(isPeriodExpired('2026-06-30', new Date('2026-06-30T00:00:00.000Z'))).toBe(false);
  });

  it('returns true the day after end', () => {
    expect(isPeriodExpired('2026-06-30', new Date('2026-07-01T00:00:00.000Z'))).toBe(true);
  });
});

describe('daysRemaining', () => {
  it('returns correct day count', () => {
    expect(daysRemaining('2026-05-20', new Date('2026-05-15T00:00:00.000Z'))).toBe(5);
  });

  it('returns 0 on the end date', () => {
    expect(daysRemaining('2026-05-15', new Date('2026-05-15T00:00:00.000Z'))).toBe(0);
  });

  it('returns 0 when past end', () => {
    expect(daysRemaining('2026-05-10', new Date('2026-05-15T00:00:00.000Z'))).toBe(0);
  });
});
