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
    const { status, userId, userEmail } = body;

    if (!planId) {
      return NextResponse.json(
        { error: 'Plan ID is required' },
        { status: 400 }
      );
    }

    if (!status) {
      return NextResponse.json(
        { error: 'Status is required' },
        { status: 400 }
      );
    }

    // Validate status
    if (!['active', 'paused', 'completed'].includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status. Must be: active, paused, or completed' },
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

    // Verify user owns this plan
    if (userId && planData.userId !== userId) {
      return NextResponse.json(
        { error: 'Unauthorized: You do not own this plan' },
        { status: 403 }
      );
    }

    // Update plan status
    await updateDoc(planRef, {
      status,
      updatedAt: new Date()
    });

    // Track write operation
    await trackFirebaseWrite(
      'plans',
      1,
      userId || planData.userId,
      userEmail || 'unknown@user.com',
      'client',
      'update_plan_status'
    );

    return NextResponse.json({
      success: true,
      message: `Plan status updated to ${status}`,
      planId,
      status
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

    // Verify user owns this plan
    if (userId && planData.userId !== userId) {
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
      userId || planData.userId,
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
