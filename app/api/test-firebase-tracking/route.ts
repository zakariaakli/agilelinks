import { NextRequest, NextResponse } from 'next/server';
import { trackFirebaseWrite, trackFirebaseRead } from '../../../lib/firebaseTracker';

export async function POST(request: NextRequest) {
  try {
    console.log('🧪 Testing Firebase tracking...');
    
    // Test Firebase write tracking
    await trackFirebaseWrite(
      'tokenUsage',           // collection
      1,                      // document count
      'test-user',           // userId
      'test@example.com',    // userEmail
      'server',              // source
      'test_firebase_write'  // functionName
    );
    
    // Test Firebase read tracking
    await trackFirebaseRead(
      'users',               // collection
      5,                     // document count
      'test-user',           // userId
      'test@example.com',    // userEmail
      'server',              // source
      'test_firebase_read'   // functionName
    );
    
    // Test another write to different collection
    await trackFirebaseWrite(
      'plans',               // collection
      2,                     // document count
      'admin-user',          // userId
      'admin@example.com',   // userEmail
      'client',              // source
      'test_plan_creation'   // functionName
    );
    
    console.log('✅ Firebase tracking test successful!');
    
    return NextResponse.json({
      success: true,
      message: 'Firebase tracking test successful',
      operations: [
        { type: 'write', collection: 'tokenUsage', count: 1 },
        { type: 'read', collection: 'users', count: 5 },
        { type: 'write', collection: 'plans', count: 2 }
      ]
    });
    
  } catch (error) {
    console.error('❌ Firebase tracking test failed:', error);
    
    return NextResponse.json({
      success: false,
      error: error.message,
      stack: error.stack
    }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Firebase tracking test endpoint. Use POST to test.',
    instructions: 'Send a POST request to create test Firebase usage data'
  });
}