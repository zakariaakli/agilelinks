import { NextRequest, NextResponse } from 'next/server';
import { auth } from 'firebase-admin';
import { logTokenUsage } from '../../../lib/simpleTracker';

interface TrackingRequest {
  functionName: string;
  model: string;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  requestData?: any;
}

// Helper function to get user from Firebase Auth token
async function getUserFromRequest(request: NextRequest): Promise<{ userId: string; userEmail: string } | null> {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null;
    }

    const token = authHeader.split('Bearer ')[1];
    const decodedToken = await auth().verifyIdToken(token);
    
    return {
      userId: decodedToken.uid,
      userEmail: decodedToken.email || 'unknown@example.com'
    };
  } catch (error) {
    console.error('Error verifying auth token:', error);
    return null;
  }
}

export async function POST(request: NextRequest) {
  try {
    const body: TrackingRequest = await request.json();
    console.log('📊 Received token tracking request:', body.functionName);

    // Get user information
    const userInfo = await getUserFromRequest(request);
    
    if (!userInfo) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Use our existing token tracking system
    await logTokenUsage(
      body.functionName,
      userInfo.userEmail,
      body.totalTokens
    );

    console.log(`✅ Successfully tracked ${body.totalTokens} tokens for ${body.functionName}`);

    return NextResponse.json({
      success: true,
      message: 'Token usage tracked successfully',
      data: {
        functionName: body.functionName,
        userEmail: userInfo.userEmail,
        totalTokens: body.totalTokens,
        model: body.model
      }
    });

  } catch (error) {
    console.error('❌ Error tracking token usage:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Token tracking endpoint for client-side OpenAI calls',
    usage: 'Send POST request with token usage data'
  });
}