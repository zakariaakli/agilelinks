import { NextResponse } from 'next/server';
import { db } from '../../../../firebase';
import { doc, getDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { trackFirebaseRead, trackFirebaseWrite, trackFirebaseDelete } from '../../../../lib/firebaseTracker';

/**
 * PATCH /api/plans/[planId]
 * Update plan status (pause/resume)
 */
export async function PATCH(
  request: Request,
  { params }: { params: { planId: string } }
) {
  try {
    const { planId } = params;
    const body = await request.json();
    const { status, importance, userId, userEmail } = body;

    if (!planId) {
      return NextResponse.json(
        { error: 'Plan ID is required' },
        { status: 400 }
      );
    }

    if (!status && !importance) {
      return NextResponse.json(
        { error: 'status or importance is required' },
        { status: 400 }
      );
    }

    // Validate status
    if (status && !['active', 'paused', 'completed'].includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status. Must be: active, paused, or completed' },
        { status: 400 }
      );
    }

    // Validate importance
    if (importance && !['high', 'medium', 'low'].includes(importance)) {
      return NextResponse.json(
        { error: 'Invalid importance. Must be: high, medium, or low' },
        { status: 400 }
      );
    }

    // Get plan to verify it exists and belongs to user
    const planRef = doc(db, 'plans', planId);
    const planSnap = await getDoc(planRef);

    // Track read operation
    await trackFirebaseRead(
      'plans',
      1,
      userId || 'unknown',
      userEmail || 'unknown@user.com',
      'client',
      'update_plan_status_check'
    );

    if (!planSnap.exists()) {
      return NextResponse.json(
        { error: 'Plan not found' },
        { status: 404 }
      );
    }

    const planData = planSnap.data();
    const planUserId = planData.userId || planData.input?.userId;

    // Verify user owns this plan
    if (userId && planUserId !== userId) {
      return NextResponse.json(
        { error: 'Unauthorized: You do not own this plan' },
        { status: 403 }
      );
    }

    // Build update payload — only include fields that were sent
    const updatePayload: { updatedAt: Date; status?: string; importance?: string } = { updatedAt: new Date() };
    if (status) updatePayload.status = status;
    if (importance) updatePayload.importance = importance;

    await updateDoc(planRef, updatePayload);

    // Track write operation
    await trackFirebaseWrite(
      'plans',
      1,
      userId || planUserId,
      userEmail || 'unknown@user.com',
      'client',
      status ? 'update_plan_status' : 'update_plan_importance'
    );

    return NextResponse.json({
      success: true,
      message: status ? `Plan status updated to ${status}` : `Plan importance updated to ${importance}`,
      planId,
      status,
      importance,
    });

  } catch (error) {
    console.error('Error updating plan status:', error);
    return NextResponse.json(
      { error: 'Failed to update plan status', details: String(error) },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/plans/[planId]
 * Permanently delete a plan
 */
export async function DELETE(
  request: Request,
  { params }: { params: { planId: string } }
) {
  try {
    const { planId } = params;
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const userEmail = searchParams.get('userEmail');

    if (!planId) {
      return NextResponse.json(
        { error: 'Plan ID is required' },
        { status: 400 }
      );
    }

    // Get plan to verify it exists and belongs to user
    const planRef = doc(db, 'plans', planId);
    const planSnap = await getDoc(planRef);

    // Track read operation
    await trackFirebaseRead(
      'plans',
      1,
      userId || 'unknown',
      userEmail || 'unknown@user.com',
      'client',
      'delete_plan_check'
    );

    if (!planSnap.exists()) {
      return NextResponse.json(
        { error: 'Plan not found' },
        { status: 404 }
      );
    }

    const planData = planSnap.data();
    const planUserId = planData.userId || planData.input?.userId;

    // Verify user owns this plan
    if (userId && planUserId !== userId) {
      return NextResponse.json(
        { error: 'Unauthorized: You do not own this plan' },
        { status: 403 }
      );
    }

    // Delete the plan
    await deleteDoc(planRef);

    // Track delete operation
    await trackFirebaseDelete(
      'plans',
      1,
      userId || planUserId,
      userEmail || 'unknown@user.com',
      'client',
      'delete_plan'
    );

    return NextResponse.json({
      success: true,
      message: 'Plan deleted successfully',
      planId
    });

  } catch (error) {
    console.error('Error deleting plan:', error);
    return NextResponse.json(
      { error: 'Failed to delete plan', details: String(error) },
      { status: 500 }
    );
  }
}
