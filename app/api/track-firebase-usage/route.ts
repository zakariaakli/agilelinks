import { NextRequest, NextResponse } from 'next/server';
import { trackFirebaseQuery } from '../../../lib/firebaseTracker';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      operation, 
      collection, 
      documentCount, 
      userId, 
      userEmail, 
      source, 
      functionName 
    } = body;

    // Validate required fields
    if (!operation || !collection || documentCount === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields: operation, collection, documentCount' },
        { status: 400 }
      );
    }

    // Track the Firebase operation
    await trackFirebaseQuery(operation, collection, documentCount, {
      userId,
      userEmail,
      source: source || 'client_side',
      functionName: functionName || 'client_firebase_operation'
    });

    return NextResponse.json({ 
      success: true, 
      message: 'Firebase usage tracked successfully' 
    });

  } catch (error) {
    console.error('Error tracking Firebase usage:', error);
    return NextResponse.json(
      { error: 'Failed to track Firebase usage' },
      { status: 500 }
    );
  }
}