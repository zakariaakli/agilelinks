import { NextResponse } from 'next/server';
import { db } from '../../../firebase';
import { doc, setDoc, Timestamp, collection } from 'firebase/firestore';

// Test endpoint to create a simple milestone reminder for debugging
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { userId = 'test-user' } = body;

    // Create a simple test milestone reminder
    const notificationRef = doc(collection(db, 'notifications'));
    
    const testNotification = {
      userId,
      type: 'milestone_reminder',
      planId: 'test-plan-id',
      milestoneId: 'test-milestone-id',
      milestoneTitle: 'Test Milestone',
      prompt: 'This is a test milestone reminder to check if the display works correctly.',
      blindSpotTip: 'This is a test blind spot tip.',
      strengthHook: 'This is a test strength hook.',
      startDate: '2025-01-01',
      dueDate: '2025-01-31',
      createdAt: Timestamp.now(),
      read: false,
      feedback: null
    };

    await setDoc(notificationRef, testNotification);

    return NextResponse.json({ 
      success: true, 
      notificationId: notificationRef.id,
      testUrl: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/nudge/${notificationRef.id}`
    });

  } catch (error) {
    console.error('Error creating test milestone reminder:', error);
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json(
    { message: 'Use POST to create a test milestone reminder' },
    { status: 405 }
  );
}