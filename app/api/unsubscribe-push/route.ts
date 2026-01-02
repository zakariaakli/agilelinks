import { NextRequest, NextResponse } from 'next/server';
import { db } from '../../../firebase-admin';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId } = body;

    if (!userId) {
      return NextResponse.json(
        { error: 'Missing userId' },
        { status: 400 }
      );
    }

    if (!db) {
      return NextResponse.json(
        { error: 'Database not initialized' },
        { status: 500 }
      );
    }

    // Mark subscription as inactive
    const subscriptionRef = db.collection('pushSubscriptions').doc(userId);

    await subscriptionRef.update({
      active: false
    });

    console.log(`Push subscription deactivated for user: ${userId}`);

    return NextResponse.json({
      success: true,
      message: 'Subscription removed successfully'
    });
  } catch (error) {
    console.error('Error removing push subscription:', error);
    return NextResponse.json(
      { error: 'Failed to remove subscription' },
      { status: 500 }
    );
  }
}
