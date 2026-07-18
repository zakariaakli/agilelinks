import { NextResponse } from 'next/server';
import { db } from '../../../firebase';
import {
  collection,
  doc,
  addDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  query,
  where,
  Timestamp,
} from 'firebase/firestore';
import { Plan } from '../../../Models/Plan';
import {
  PriorityMatrix,
  MatrixAction,
  MatrixPeriodType,
  Quadrant,
} from '../../../Models/PriorityMatrix';
import { classifyPlanHighLevel, classifyPlan } from '../../../lib/matrixClassifier';
import { computePeriod, isPeriodExpired } from '../../../lib/matrixPeriod';
import {
  trackFirebaseRead,
  trackFirebaseWrite,
  trackFirebaseDelete,
} from '../../../lib/firebaseTracker';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function userId(params: Record<string, string | null>): string | null {
  return params.userId || null;
}

async function fetchActiveMatrix(uid: string): Promise<{ matrix: PriorityMatrix | null; matrixId: string | null }> {
  const q = query(
    collection(db, 'priorityMatrices'),
    where('userId', '==', uid),
    where('status', '==', 'active')
  );
  const snap = await getDocs(q);
  if (snap.empty) return { matrix: null, matrixId: null };
  const docSnap = snap.docs[0];
  return { matrix: { id: docSnap.id, ...docSnap.data() } as PriorityMatrix, matrixId: docSnap.id };
}

async function fetchActions(matrixId: string): Promise<MatrixAction[]> {
  const snap = await getDocs(collection(db, 'priorityMatrices', matrixId, 'actions'));
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as MatrixAction));
}

async function fetchActivePlans(uid: string): Promise<Plan[]> {
  const q = query(collection(db, 'plans'), where('userId', '==', uid), where('status', '==', 'active'));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as Plan));
}

async function seedActions(matrixId: string, plans: Plan[], now: Date): Promise<void> {
  const actionsRef = collection(db, 'priorityMatrices', matrixId, 'actions');
  // One high-level action per goal — no milestone granularity at seed time
  const existingPlanIds = new Set<string>();
  for (const plan of plans) {
    const seed = classifyPlanHighLevel(plan, now, existingPlanIds);
    if (!seed) continue;
    existingPlanIds.add(plan.id);
    await addDoc(actionsRef, {
      title: seed.title,
      quadrant: seed.quadrant,
      source: 'ai',
      sourcePlanId: seed.sourcePlanId,
      sourcePlanTitle: seed.sourcePlanTitle,
      manualOverride: false,
      status: 'open',
      effortMinutes: 0,
      createdAt: Timestamp.now(),
    });
  }
}

// ---------------------------------------------------------------------------
// GET /api/matrix?userId=xxx
// Returns the active matrix + all its actions (and period info).
// If no active matrix exists returns { matrix: null, actions: [] }.
// ---------------------------------------------------------------------------
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const uid = searchParams.get('userId');
    if (!uid) return NextResponse.json({ error: 'userId is required' }, { status: 400 });

    const { matrix, matrixId } = await fetchActiveMatrix(uid);

    await trackFirebaseRead('priorityMatrices', 1, uid, '', 'client', 'get_active_matrix');

    if (!matrix || !matrixId) {
      return NextResponse.json({ matrix: null, actions: [] });
    }

    const actions = await fetchActions(matrixId);
    await trackFirebaseRead('priorityMatrices/actions', actions.length, uid, '', 'client', 'get_matrix_actions');

    return NextResponse.json({ matrix, actions });
  } catch (error) {
    console.error('GET /api/matrix error:', error);
    return NextResponse.json({ error: 'Failed to fetch matrix', details: String(error) }, { status: 500 });
  }
}

// ---------------------------------------------------------------------------
// POST /api/matrix
// Seed (or return) the active matrix for the period.
// Body: { userId, periodType?, customStart?, customEnd? }
// If a non-expired active matrix already exists for the same period, returns it.
// ---------------------------------------------------------------------------
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { userId: uid, periodType = 'quarter', customStart, customEnd } = body as {
      userId: string;
      periodType?: MatrixPeriodType;
      customStart?: string;
      customEnd?: string;
    };

    if (!uid) return NextResponse.json({ error: 'userId is required' }, { status: 400 });

    const now = new Date();
    const period = computePeriod(periodType, now, customStart, customEnd);

    // Return existing active matrix if still valid for the same period
    const { matrix: existing, matrixId: existingId } = await fetchActiveMatrix(uid);
    if (existing && existingId && existing.periodStart === period.periodStart && !isPeriodExpired(existing.periodEnd, now)) {
      const actions = await fetchActions(existingId);
      return NextResponse.json({ matrix: existing, actions, seeded: false });
    }

    // Archive the old active matrix if present
    if (existing && existingId) {
      await updateDoc(doc(db, 'priorityMatrices', existingId), {
        status: 'archived',
        updatedAt: Timestamp.now(),
      });
      await trackFirebaseWrite('priorityMatrices', 1, uid, '', 'client', 'archive_matrix');
    }

    // Create new matrix
    const matrixData = {
      userId: uid,
      status: 'active',
      periodType: period.periodType,
      periodStart: period.periodStart,
      periodEnd: period.periodEnd,
      periodLabel: period.periodLabel,
      createdAt: Timestamp.now(),
    };
    const matrixRef = await addDoc(collection(db, 'priorityMatrices'), matrixData);
    await trackFirebaseWrite('priorityMatrices', 1, uid, '', 'client', 'create_matrix');

    // Seed from active plans
    const plans = await fetchActivePlans(uid);
    await trackFirebaseRead('plans', plans.length, uid, '', 'client', 'seed_matrix_plans');
    await seedActions(matrixRef.id, plans, now);

    const actions = await fetchActions(matrixRef.id);
    await trackFirebaseWrite('priorityMatrices/actions', actions.length, uid, '', 'client', 'seed_matrix_actions');

    return NextResponse.json({
      matrix: { id: matrixRef.id, ...matrixData } as PriorityMatrix,
      actions,
      seeded: true,
    });
  } catch (error) {
    console.error('POST /api/matrix error:', error);
    return NextResponse.json({ error: 'Failed to seed matrix', details: String(error) }, { status: 500 });
  }
}

// ---------------------------------------------------------------------------
// PATCH /api/matrix
// Unified action endpoint. op field dispatches to the right handler.
//
// op: 'move'     { matrixId, actionId, quadrant }      → move + set manualOverride
// op: 'done'     { matrixId, actionId }                → mark action done
// op: 'add'      { matrixId, userId, title, quadrant } → add user action
// op: 'remove'   { matrixId, actionId }                → soft-remove action
// op: 'edit'     { matrixId, actionId, title }         → rename action
// op: 'rollover' { matrixId, userId }                  → archive + seed next period
// op: 'refresh'  { matrixId, userId }                  → re-classify non-override actions
// ---------------------------------------------------------------------------
export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { op } = body as { op: string };

    if (!op) return NextResponse.json({ error: 'op is required' }, { status: 400 });

    if (op === 'move') {
      const { matrixId, actionId, quadrant } = body as { matrixId: string; actionId: string; quadrant: Quadrant };
      if (!matrixId || !actionId || !quadrant) {
        return NextResponse.json({ error: 'matrixId, actionId, quadrant required' }, { status: 400 });
      }
      await updateDoc(doc(db, 'priorityMatrices', matrixId, 'actions', actionId), {
        quadrant,
        manualOverride: true,
        updatedAt: Timestamp.now(),
      });
      return NextResponse.json({ success: true });
    }

    if (op === 'done') {
      const { matrixId, actionId } = body as { matrixId: string; actionId: string };
      if (!matrixId || !actionId) {
        return NextResponse.json({ error: 'matrixId, actionId required' }, { status: 400 });
      }
      await updateDoc(doc(db, 'priorityMatrices', matrixId, 'actions', actionId), {
        status: 'done',
        updatedAt: Timestamp.now(),
      });
      return NextResponse.json({ success: true });
    }

    if (op === 'add') {
      const { matrixId, userId: uid, title, quadrant } = body as {
        matrixId: string; userId: string; title: string; quadrant: Quadrant;
      };
      if (!matrixId || !title || !quadrant) {
        return NextResponse.json({ error: 'matrixId, title, quadrant required' }, { status: 400 });
      }
      const newAction = {
        title,
        quadrant,
        source: 'user',
        manualOverride: true,
        status: 'open',
        effortMinutes: 0,
        createdAt: Timestamp.now(),
      };
      const ref = await addDoc(collection(db, 'priorityMatrices', matrixId, 'actions'), newAction);
      await trackFirebaseWrite('priorityMatrices/actions', 1, uid || '', '', 'client', 'add_user_action');
      return NextResponse.json({ success: true, actionId: ref.id });
    }

    if (op === 'remove') {
      const { matrixId, actionId } = body as { matrixId: string; actionId: string };
      if (!matrixId || !actionId) {
        return NextResponse.json({ error: 'matrixId, actionId required' }, { status: 400 });
      }
      await updateDoc(doc(db, 'priorityMatrices', matrixId, 'actions', actionId), {
        status: 'removed',
        updatedAt: Timestamp.now(),
      });
      return NextResponse.json({ success: true });
    }

    if (op === 'edit') {
      const { matrixId, actionId, title } = body as { matrixId: string; actionId: string; title: string };
      if (!matrixId || !actionId || !title) {
        return NextResponse.json({ error: 'matrixId, actionId, title required' }, { status: 400 });
      }
      await updateDoc(doc(db, 'priorityMatrices', matrixId, 'actions', actionId), {
        title,
        updatedAt: Timestamp.now(),
      });
      return NextResponse.json({ success: true });
    }

    if (op === 'rollover') {
      const { matrixId, userId: uid } = body as { matrixId: string; userId: string };
      if (!matrixId || !uid) {
        return NextResponse.json({ error: 'matrixId, userId required' }, { status: 400 });
      }
      // Archive current
      await updateDoc(doc(db, 'priorityMatrices', matrixId), {
        status: 'archived',
        updatedAt: Timestamp.now(),
      });
      await trackFirebaseWrite('priorityMatrices', 1, uid, '', 'client', 'rollover_archive');

      // Create next quarter matrix
      const now = new Date();
      const matrixSnap = await getDoc(doc(db, 'priorityMatrices', matrixId));
      const matrixData = matrixSnap.data() as PriorityMatrix;
      const period = computePeriod(matrixData.periodType || 'quarter', now);

      const newMatrixData = {
        userId: uid,
        status: 'active',
        periodType: period.periodType,
        periodStart: period.periodStart,
        periodEnd: period.periodEnd,
        periodLabel: period.periodLabel,
        createdAt: Timestamp.now(),
      };
      const newRef = await addDoc(collection(db, 'priorityMatrices'), newMatrixData);
      await trackFirebaseWrite('priorityMatrices', 1, uid, '', 'client', 'rollover_create');

      const plans = await fetchActivePlans(uid);
      await seedActions(newRef.id, plans, now);

      const actions = await fetchActions(newRef.id);
      return NextResponse.json({ matrix: { id: newRef.id, ...newMatrixData }, actions });
    }

    if (op === 'refresh') {
      const { matrixId, userId: uid } = body as { matrixId: string; userId: string };
      if (!matrixId || !uid) {
        return NextResponse.json({ error: 'matrixId, userId required' }, { status: 400 });
      }
      const now = new Date();
      const plans = await fetchActivePlans(uid);
      const actions = await fetchActions(matrixId);

      // Plans already represented in the matrix (skip re-seeding them)
      const existingPlanIds = new Set(
        actions
          .filter(a => a.status !== 'removed' && a.sourcePlanId)
          .map(a => a.sourcePlanId) as string[]
      );

      // Re-classify non-override AI actions whose goal importance/urgency may have changed
      const { classifyPlanHighLevel } = await import('../../../lib/matrixClassifier');
      for (const action of actions) {
        if (action.manualOverride || action.source === 'user' || action.status !== 'open') continue;
        const plan = plans.find(p => p.id === action.sourcePlanId);
        if (!plan) continue;
        const seed = classifyPlanHighLevel(plan, now);
        if (seed && seed.quadrant !== action.quadrant) {
          await updateDoc(doc(db, 'priorityMatrices', matrixId, 'actions', action.id), {
            quadrant: seed.quadrant,
            updatedAt: Timestamp.now(),
          });
        }
      }

      // Add any new goals that appeared since last seed
      const actionsRef = collection(db, 'priorityMatrices', matrixId, 'actions');
      for (const plan of plans) {
        const seed = classifyPlanHighLevel(plan, now, existingPlanIds);
        if (!seed) continue;
        existingPlanIds.add(plan.id);
        await addDoc(actionsRef, {
          title: seed.title,
          quadrant: seed.quadrant,
          source: 'ai',
          sourcePlanId: seed.sourcePlanId,
          sourcePlanTitle: seed.sourcePlanTitle,
          manualOverride: false,
          status: 'open',
          effortMinutes: 0,
          createdAt: Timestamp.now(),
        });
      }

      const refreshedActions = await fetchActions(matrixId);
      return NextResponse.json({ success: true, actions: refreshedActions });
    }

    // ── drilldown ────────────────────────────────────────────────────────────
    // Seeds milestone-level actions for a specific goal the first time the user
    // opens that goal's drill-down. Idempotent: skips milestones already present.
    if (op === 'drilldown') {
      const { matrixId, planId, userId: uid } = body as {
        matrixId: string; planId: string; userId: string;
      };
      if (!matrixId || !planId) {
        return NextResponse.json({ error: 'matrixId and planId required' }, { status: 400 });
      }
      const now = new Date();
      const plans = await fetchActivePlans(uid);
      const plan = plans.find(p => p.id === planId);
      if (!plan) {
        return NextResponse.json({ error: 'Plan not found' }, { status: 404 });
      }

      // Find milestone IDs already seeded for this plan
      const existing = await fetchActions(matrixId);
      const existingMilestoneIds = new Set(
        existing
          .filter(a => a.sourcePlanId === planId && a.sourceMilestoneId)
          .map(a => a.sourceMilestoneId) as string[]
      );

      const actionsRef = collection(db, 'priorityMatrices', matrixId, 'actions');
      const seeds = classifyPlan(plan, now, existingMilestoneIds);
      for (const seed of seeds) {
        await addDoc(actionsRef, {
          title: seed.title,
          quadrant: seed.quadrant,
          source: 'ai',
          sourcePlanId: seed.sourcePlanId,
          sourcePlanTitle: seed.sourcePlanTitle,
          sourceMilestoneId: seed.sourceMilestoneId,
          manualOverride: false,
          status: 'open',
          effortMinutes: 0,
          createdAt: Timestamp.now(),
        });
      }

      // Return only the milestone-level actions for this plan
      const all = await fetchActions(matrixId);
      const drilldownActions = all.filter(
        a => a.sourcePlanId === planId && a.sourceMilestoneId
      );
      return NextResponse.json({ success: true, actions: drilldownActions });
    }

    return NextResponse.json({ error: `Unknown op: ${op}` }, { status: 400 });
  } catch (error) {
    console.error('PATCH /api/matrix error:', error);
    return NextResponse.json({ error: 'Failed to update matrix', details: String(error) }, { status: 500 });
  }
}

// ---------------------------------------------------------------------------
// DELETE /api/matrix?matrixId=xxx&actionId=xxx&userId=xxx
// Hard-delete an action (use soft-remove via PATCH op:remove for normal flow).
// ---------------------------------------------------------------------------
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const matrixId = searchParams.get('matrixId');
    const actionId = searchParams.get('actionId');
    const uid = searchParams.get('userId');

    if (!matrixId || !actionId) {
      return NextResponse.json({ error: 'matrixId and actionId are required' }, { status: 400 });
    }

    await deleteDoc(doc(db, 'priorityMatrices', matrixId, 'actions', actionId));
    await trackFirebaseDelete('priorityMatrices/actions', 1, uid || '', '', 'client', 'delete_action');

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('DELETE /api/matrix error:', error);
    return NextResponse.json({ error: 'Failed to delete action', details: String(error) }, { status: 500 });
  }
}
