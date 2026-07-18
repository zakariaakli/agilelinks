import { classifyPlan, classifyPlanHighLevel, classifyMilestone } from '../../lib/matrixClassifier';
import { Plan } from '../../Models/Plan';

const NOW = new Date('2026-05-15T00:00:00.000Z');

function makePlan(overrides: Partial<Plan> = {}): Plan {
  return {
    id: 'plan-1',
    userId: 'user-1',
    goalType: 'career',
    goal: 'Get promoted',
    targetDate: '2026-12-31',
    hasTimePressure: false,
    milestones: [],
    status: 'active',
    createdAt: new Date(),
    ...overrides,
  };
}

function makeMilestone(dueDate: string, completed = false) {
  return {
    id: `m-${dueDate}`,
    title: `Milestone due ${dueDate}`,
    description: '',
    startDate: '2026-01-01',
    dueDate,
    completed,
  };
}

describe('classifyPlan', () => {
  it('skips completed milestones', () => {
    const plan = makePlan({ milestones: [makeMilestone('2026-05-20', true)] });
    expect(classifyPlan(plan, NOW)).toHaveLength(0);
  });

  it('skips milestones already in the matrix', () => {
    const m = makeMilestone('2026-05-20');
    const plan = makePlan({ milestones: [m] });
    const existing = new Set([m.id]);
    expect(classifyPlan(plan, NOW, existing)).toHaveLength(0);
  });

  describe('quadrant derivation', () => {
    it('urgent_important: time pressure + high importance', () => {
      const plan = makePlan({
        hasTimePressure: true,
        importance: 'high',
        milestones: [makeMilestone('2026-06-30')],
      });
      const [seed] = classifyPlan(plan, NOW);
      expect(seed.quadrant).toBe('urgent_important');
    });

    it('urgent_important: due within 14 days + medium importance (default)', () => {
      const plan = makePlan({ milestones: [makeMilestone('2026-05-22')] });
      const [seed] = classifyPlan(plan, NOW);
      expect(seed.quadrant).toBe('urgent_important');
    });

    it('not_urgent_important: far-off due date + medium importance', () => {
      const plan = makePlan({ milestones: [makeMilestone('2026-09-01')] });
      const [seed] = classifyPlan(plan, NOW);
      expect(seed.quadrant).toBe('not_urgent_important');
    });

    it('urgent_not_important: time pressure + low importance', () => {
      const plan = makePlan({
        hasTimePressure: true,
        importance: 'low',
        milestones: [makeMilestone('2026-09-01')],
      });
      const [seed] = classifyPlan(plan, NOW);
      expect(seed.quadrant).toBe('urgent_not_important');
    });

    it('not_urgent_not_important: far-off + low importance', () => {
      const plan = makePlan({
        importance: 'low',
        milestones: [makeMilestone('2026-09-01')],
      });
      const [seed] = classifyPlan(plan, NOW);
      expect(seed.quadrant).toBe('not_urgent_not_important');
    });

    it('treats undefined importance as medium (important)', () => {
      const plan = makePlan({ milestones: [makeMilestone('2026-09-01')] });
      const [seed] = classifyPlan(plan, NOW);
      expect(['urgent_important', 'not_urgent_important']).toContain(seed.quadrant);
    });
  });

  it('returns one seed per open milestone', () => {
    const plan = makePlan({
      milestones: [
        makeMilestone('2026-05-20'),
        makeMilestone('2026-07-01'),
        makeMilestone('2026-09-01', true), // completed
      ],
    });
    expect(classifyPlan(plan, NOW)).toHaveLength(2);
  });

  it('includes correct sourcePlanId and sourceMilestoneId', () => {
    const m = makeMilestone('2026-09-01');
    const plan = makePlan({ id: 'plan-42', milestones: [m] });
    const [seed] = classifyPlan(plan, NOW);
    expect(seed.sourcePlanId).toBe('plan-42');
    expect(seed.sourceMilestoneId).toBe(m.id);
  });
});

describe('classifyPlanHighLevel', () => {
  it('returns one seed per plan', () => {
    const plan = makePlan({ targetDate: '2026-12-31', milestones: [makeMilestone('2026-06-01')] });
    expect(classifyPlanHighLevel(plan, NOW)).not.toBeNull();
  });

  it('returns null if plan already in existingPlanIds', () => {
    const plan = makePlan({ id: 'plan-x' });
    expect(classifyPlanHighLevel(plan, NOW, new Set(['plan-x']))).toBeNull();
  });

  it('urgent_important when targetDate within 60 days + medium importance', () => {
    const plan = makePlan({ targetDate: '2026-07-01' }); // 47 days from May 15
    const seed = classifyPlanHighLevel(plan, NOW)!;
    expect(seed.quadrant).toBe('urgent_important');
  });

  it('not_urgent_important when targetDate far away + medium importance', () => {
    const plan = makePlan({ targetDate: '2026-12-31' }); // 230 days away
    const seed = classifyPlanHighLevel(plan, NOW)!;
    expect(seed.quadrant).toBe('not_urgent_important');
  });

  it('uses goalName when present', () => {
    const plan = makePlan({ goalName: 'My Vision', goal: 'Long description text' });
    const seed = classifyPlanHighLevel(plan, NOW)!;
    expect(seed.title).toBe('My Vision');
    expect(seed.sourcePlanTitle).toBe('My Vision');
  });

  it('falls back to goal text when goalName missing', () => {
    const plan = makePlan({ goal: 'Get promoted by Q4' });
    const seed = classifyPlanHighLevel(plan, NOW)!;
    expect(seed.title).toBe('Get promoted by Q4');
  });

  it('truncates very long goal text to 80 chars', () => {
    const plan = makePlan({ goal: 'A'.repeat(90) });
    const seed = classifyPlanHighLevel(plan, NOW)!;
    expect(seed.title.length).toBeLessThanOrEqual(80);
    expect(seed.title.endsWith('…')).toBe(true);
  });

  it('sets no sourceMilestoneId', () => {
    const plan = makePlan({ milestones: [makeMilestone('2026-06-01')] });
    const seed = classifyPlanHighLevel(plan, NOW)!;
    expect(seed.sourceMilestoneId).toBeUndefined();
  });
});

describe('classifyMilestone', () => {
  it('returns correct quadrant for a single milestone', () => {
    const plan = makePlan({ importance: 'low', hasTimePressure: false });
    expect(classifyMilestone(plan, 'm-1', '2026-09-01', NOW)).toBe('not_urgent_not_important');
  });
});
