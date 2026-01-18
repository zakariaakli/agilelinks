import { NextRequest, NextResponse } from 'next/server';
import { db } from '../../../firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { sentiment, comment, page, userId, userName, userEmail } = body;

    // Validate required fields
    if (!sentiment || !page) {
      return NextResponse.json(
        { error: 'Missing required fields: sentiment and page' },
        { status: 400 }
      );
    }

    // Validate sentiment value
    const validSentiments = ['love', 'good', 'okay', 'frustrated'];
    if (!validSentiments.includes(sentiment)) {
      return NextResponse.json(
        { error: 'Invalid sentiment value' },
        { status: 400 }
      );
    }

    if (!db) {
      return NextResponse.json(
        { error: 'Database not initialized' },
        { status: 500 }
      );
    }

    // Get user agent for device detection
    const userAgent = request.headers.get('user-agent') || 'Unknown';
    const deviceType = /mobile|android|iphone|ipad|ipod/i.test(userAgent) ? 'mobile' : 'desktop';

    // Create feedback document
    const feedbackData = {
      userId: userId || 'anonymous',
      userName: userName || null,
      userEmail: userEmail || null,
      page,
      sentiment,
      comment: comment || null,
      userAgent,
      deviceType,
      timestamp: FieldValue.serverTimestamp(),
      resolved: false,
      adminNotes: null,
    };

    // Save to Firestore
    const feedbackRef = await db.collection('feedback').add(feedbackData);

    console.log(`Feedback submitted: ${feedbackRef.id} | ${sentiment} | ${page}`);

    return NextResponse.json({
      success: true,
      message: 'Feedback submitted successfully',
      feedbackId: feedbackRef.id,
    });
  } catch (error) {
    console.error('Error saving feedback:', error);
    return NextResponse.json(
      { error: 'Failed to save feedback' },
      { status: 500 }
    );
  }
}

// GET endpoint to fetch all feedback (for admin dashboard)
export async function GET(request: NextRequest) {
  try {
    if (!db) {
      return NextResponse.json(
        { error: 'Database not initialized' },
        { status: 500 }
      );
    }

    // Optional query parameters for filtering
    const searchParams = request.nextUrl.searchParams;
    const sentiment = searchParams.get('sentiment');
    const resolved = searchParams.get('resolved');
    const limit = parseInt(searchParams.get('limit') || '100');

    let query = db.collection('feedback').orderBy('timestamp', 'desc');

    // Apply filters if provided
    if (sentiment) {
      query = query.where('sentiment', '==', sentiment) as any;
    }
    if (resolved !== null) {
      query = query.where('resolved', '==', resolved === 'true') as any;
    }

    query = query.limit(limit) as any;

    const snapshot = await query.get();
    const feedbackList = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));

    return NextResponse.json({
      success: true,
      count: feedbackList.length,
      feedback: feedbackList,
    });
  } catch (error) {
    console.error('Error fetching feedback:', error);
    return NextResponse.json(
      { error: 'Failed to fetch feedback' },
      { status: 500 }
    );
  }
}
