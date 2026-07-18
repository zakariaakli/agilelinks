import { Plan } from '../Models/Plan';
import { Quadrant, SeedActionDescriptor } from '../Models/PriorityMatrix';

// Goal-level urgency: target date within this many days counts as urgent
const GOAL_URGENCY_DAYS = 60;
// Milestone-level urgency window used during refresh
const MILESTONE_URGENCY_DAYS = 14;

function isImportant(plan: Plan): boolean {
  return (plan.importance ?? 'medium') !== 'low';
}

function deriveQuadrant(urgent: boolean, important: boolean): Quadrant {
  if (urgent && important) return 'urgent_important';
  if (!urgent && important) return 'not_urgent_important';
  if (urgent && !important) return 'urgent_not_important';
  return 'not_urgent_not_important';
}

function daysUntil(isoDate: string, now: Date): number {
  const due = new Date(`${isoDate}T00:00:00.000Z`).getTime();
  const today = new Date(`${now.toISOString().slice(0, 10)}T00:00:00.000Z`).getTime();
  return Math.ceil((due - today) / 86_400_000);
}

function goalTitle(plan: Plan): string {
  const raw = plan.goalName || plan.goal;
  return raw.length > 80 ? raw.slice(0, 77) + '…' : raw;
}

/**
 * HIGH-LEVEL SEEDING — one action per goal.
 * Called when creating or rolling over a matrix. Gives users a portfolio view
 * of their goals, not a long list of individual milestones.
 *
 * Urgency: plan.hasTimePressure OR targetDate within GOAL_URGENCY_DAYS.
 * Skips plans already represented in the matrix (caller passes existing sourcePlanIds).
 */
export function classifyPlanHighLevel(
  plan: Plan,
  now: Date,
  existingPlanIds: Set<string> = new Set()
): SeedActionDescriptor | null {
  if (existingPlanIds.has(plan.id)) return null;

  const urgent = plan.hasTimePressure || daysUntil(plan.targetDate, now) <= GOAL_URGENCY_DAYS;
  return {
    title: goalTitle(plan),
    quadrant: deriveQuadrant(urgent, isImportant(plan)),
    sourcePlanId: plan.id,
    sourcePlanTitle: goalTitle(plan),
  };
}

/**
 * MILESTONE-LEVEL REFRESH — adds new milestones that appeared since last seed.
 * Used by op:refresh, NOT by initial seeding.
 * Skips completed milestones and ones already in the matrix.
 */
export function classifyPlan(
  plan: Plan,
  now: Date,
  existingMilestoneIds: Set<string> = new Set()
): SeedActionDescriptor[] {
  const important = isImportant(plan);
  const seeds: SeedActionDescriptor[] = [];
  const title = goalTitle(plan);

  for (const milestone of plan.milestones) {
    if (milestone.completed) continue;
    if (existingMilestoneIds.has(milestone.id)) continue;

    const urgent =
      plan.hasTimePressure || daysUntil(milestone.dueDate, now) <= MILESTONE_URGENCY_DAYS;
    seeds.push({
      title: milestone.title,
      quadrant: deriveQuadrant(urgent, important),
      sourcePlanId: plan.id,
      sourcePlanTitle: title,
      sourceMilestoneId: milestone.id,
    });
  }

  return seeds;
}

/**
 * Re-classify a single milestone (for op:refresh on existing non-override actions).
 */
export function classifyMilestone(
  plan: Plan,
  milestoneId: string,
  milestoneDueDate: string,
  now: Date
): Quadrant {
  const urgent =
    plan.hasTimePressure || daysUntil(milestoneDueDate, now) <= MILESTONE_URGENCY_DAYS;
  return deriveQuadrant(urgent, isImportant(plan));
}
