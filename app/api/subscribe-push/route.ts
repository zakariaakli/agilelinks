import { NextRequest, NextResponse } from 'next/server';
import { db } from '../../../firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, subscription } = body;

    if (!userId || !subscription) {
      return NextResponse.json(
        { error: 'Missing userId or subscription' },
        { status: 400 }
      );
    }

    // Validate subscription object
    if (!subscription.endpoint || !subscription.keys) {
      return NextResponse.json(
        { error: 'Invalid subscription format' },
        { status: 400 }
      );
    }

    if (!db) {
      return NextResponse.json(
        { error: 'Database not initialized' },
        { status: 500 }
      );
    }

    // Save subscription to Firestore
    const subscriptionRef = db.collection('pushSubscriptions').doc(userId);

    await subscriptionRef.set({
      userId,
      subscription,
      createdAt: FieldValue.serverTimestamp(),
      lastUsed: FieldValue.serverTimestamp(),
      active: true
    }, { merge: true });

    console.log(`Push subscription saved for user: ${userId}`);

    return NextResponse.json({
      success: true,
      message: 'Subscription saved successfully'
    });
  } catch (error) {
    console.error('Error saving push subscription:', error);
    return NextResponse.json(
      { error: 'Failed to save subscription' },
      { status: 500 }
    );
  }
}
