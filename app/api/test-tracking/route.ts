import { NextRequest, NextResponse } from 'next/server';
import { trackTokenUsage } from '../../../lib/tokenTracker';

export async function POST(request: NextRequest) {
  try {
    console.log('🧪 Testing token tracking...');
    
    // Test data
    const testData = {
      userId: 'test-user-123',
      userEmail: 'test@example.com',
      functionName: 'test_function',
      model: 'gpt-4',
      promptTokens: 100,
      completionTokens: 50,
      requestData: { test: 'data' },
      responseData: { test: 'response' }
    };
    
    await trackTokenUsage(testData);
    
    console.log('✅ Test tracking successful!');
    
    return NextResponse.json({
      success: true,
      message: 'Token tracking test successful',
      testData
    });
    
  } catch (error) {
    console.error('❌ Test tracking failed:', error);
    
    return NextResponse.json({
      success: false,
      error: error.message,
      stack: error.stack
    }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Token tracking test endpoint. Use POST to test.',
    instructions: 'Send a POST request to test the token tracking system'
  });
}