import { NextResponse } from 'next/server';
import { db } from '../../../firebase';
import {
  doc,
  getDoc,
  updateDoc,
  Timestamp,
  arrayUnion,
} from 'firebase/firestore';
import { Step } from '../../../Models/Step';

/**
 * GET /api/steps
 * Get all steps for a milestone
 * Query params: planId, milestoneId
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const planId = searchParams.get('planId');
    const milestoneId = searchParams.get('milestoneId');

    if (!planId || !milestoneId) {
      return NextResponse.json(
        { error: 'planId and milestoneId are required' },
        { status: 400 }
      );
    }

    const planRef = doc(db, 'plans', planId);
    const planSnap = await getDoc(planRef);

    if (!planSnap.exists()) {
      return NextResponse.json(
        { error: 'Plan not found' },
        { status: 404 }
      );
    }

    const planData = planSnap.data();
    const milestone = planData.milestones?.find(
      (m: { id: string }) => m.id === milestoneId
    );

    if (!milestone) {
      return NextResponse.json(
        { error: 'Milestone not found' },
        { status: 404 }
      );
    }

    const steps = milestone.steps || [];

    return NextResponse.json({
      status: 'success',
      steps,
    });
  } catch (error) {
    console.error('Error fetching steps:', error);
    return NextResponse.json(
      { error: 'Failed to fetch steps', details: String(error) },
      { status: 500 }
    );
  }
}

/**
 * POST /api/steps
 * Create a new step for a milestone
 * Body: { planId, milestoneId, title, source, nudgeId? }
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { planId, milestoneId, title, source, nudgeId } = body;

    if (!planId || !milestoneId || !title) {
      return NextResponse.json(
        { error: 'planId, milestoneId, and title are required' },
        { status: 400 }
      );
    }

    if (source && !['user', 'ai'].includes(source)) {
      return NextResponse.json(
        { error: 'source must be "user" or "ai"' },
        { status: 400 }
      );
    }

    const planRef = doc(db, 'plans', planId);
    const planSnap = await getDoc(planRef);

    if (!planSnap.exists()) {
      return NextResponse.json(
        { error: 'Plan not found' },
        { status: 404 }
      );
    }

    const planData = planSnap.data();
    const milestones = planData.milestones || [];
    const milestoneIndex = milestones.findIndex(
      (m: { id: string }) => m.id === milestoneId
    );

    if (milestoneIndex === -1) {
      return NextResponse.json(
        { error: 'Milestone not found' },
        { status: 404 }
      );
    }

    // Create new step
    const newStep: Step = {
      id: `step_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      title: title.trim(),
      completed: false,
      completedAt: null,
      createdAt: Timestamp.now(),
      source: source || 'user',
      nudgeId: nudgeId || null,
    };

    // Update milestone with new step
    const updatedMilestones = [...milestones];
    updatedMilestones[milestoneIndex] = {
      ...updatedMilestones[milestoneIndex],
      steps: [...(updatedMilestones[milestoneIndex].steps || []), newStep],
    };

    await updateDoc(planRef, {
      milestones: updatedMilestones,
    });

    return NextResponse.json({
      status: 'success',
      step: newStep,
    });
  } catch (error) {
    console.error('Error creating step:', error);
    return NextResponse.json(
      { error: 'Failed to create step', details: String(error) },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/steps
 * Update a step (complete/uncomplete or edit title)
 * Body: { planId, milestoneId, stepId, completed?, title? }
 */
export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { planId, milestoneId, stepId, completed, title } = body;

    if (!planId || !milestoneId || !stepId) {
      return NextResponse.json(
        { error: 'planId, milestoneId, and stepId are required' },
        { status: 400 }
      );
    }

    const planRef = doc(db, 'plans', planId);
    const planSnap = await getDoc(planRef);

    if (!planSnap.exists()) {
      return NextResponse.json(
        { error: 'Plan not found' },
        { status: 404 }
      );
    }

    const planData = planSnap.data();
    const milestones = planData.milestones || [];
    const milestoneIndex = milestones.findIndex(
      (m: { id: string }) => m.id === milestoneId
    );

    if (milestoneIndex === -1) {
      return NextResponse.json(
        { error: 'Milestone not found' },
        { status: 404 }
      );
    }

    const steps = milestones[milestoneIndex].steps || [];
    const stepIndex = steps.findIndex((s: Step) => s.id === stepId);

    if (stepIndex === -1) {
      return NextResponse.json(
        { error: 'Step not found' },
        { status: 404 }
      );
    }

    // Update step
    const updatedStep = { ...steps[stepIndex] };

    if (typeof completed === 'boolean') {
      updatedStep.completed = completed;
      updatedStep.completedAt = completed ? Timestamp.now() : null;
    }

    if (typeof title === 'string' && title.trim()) {
      updatedStep.title = title.trim();
    }

    // Update milestones array
    const updatedSteps = [...steps];
    updatedSteps[stepIndex] = updatedStep;

    const updatedMilestones = [...milestones];
    updatedMilestones[milestoneIndex] = {
      ...updatedMilestones[milestoneIndex],
      steps: updatedSteps,
    };

    await updateDoc(planRef, {
      milestones: updatedMilestones,
    });

    return NextResponse.json({
      status: 'success',
      step: updatedStep,
    });
  } catch (error) {
    console.error('Error updating step:', error);
    return NextResponse.json(
      { error: 'Failed to update step', details: String(error) },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/steps
 * Delete a step from a milestone
 * Body: { planId, milestoneId, stepId }
 */
export async function DELETE(request: Request) {
  try {
    const body = await request.json();
    const { planId, milestoneId, stepId } = body;

    if (!planId || !milestoneId || !stepId) {
      return NextResponse.json(
        { error: 'planId, milestoneId, and stepId are required' },
        { status: 400 }
      );
    }

    const planRef = doc(db, 'plans', planId);
    const planSnap = await getDoc(planRef);

    if (!planSnap.exists()) {
      return NextResponse.json(
        { error: 'Plan not found' },
        { status: 404 }
      );
    }

    const planData = planSnap.data();
    const milestones = planData.milestones || [];
    const milestoneIndex = milestones.findIndex(
      (m: { id: string }) => m.id === milestoneId
    );

    if (milestoneIndex === -1) {
      return NextResponse.json(
        { error: 'Milestone not found' },
        { status: 404 }
      );
    }

    const steps = milestones[milestoneIndex].steps || [];
    const stepIndex = steps.findIndex((s: Step) => s.id === stepId);

    if (stepIndex === -1) {
      return NextResponse.json(
        { error: 'Step not found' },
        { status: 404 }
      );
    }

    // Remove step
    const updatedSteps = steps.filter((s: Step) => s.id !== stepId);

    const updatedMilestones = [...milestones];
    updatedMilestones[milestoneIndex] = {
      ...updatedMilestones[milestoneIndex],
      steps: updatedSteps,
    };

    await updateDoc(planRef, {
      milestones: updatedMilestones,
    });

    return NextResponse.json({
      status: 'success',
      message: 'Step deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting step:', error);
    return NextResponse.json(
      { error: 'Failed to delete step', details: String(error) },
      { status: 500 }
    );
  }
}
