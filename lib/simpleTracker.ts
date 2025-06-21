import { db } from '../firebase-admin';
import { trackFirebaseWrite } from './firebaseTracker';

export const logTokenUsage = async (
  functionName: string,
  userEmail: string = 'anonymous@example.com',
  estimatedTokens: number = 200
) => {
  try {
    console.log('🔥 Simple tracking attempt:', { functionName, userEmail, estimatedTokens });
    
    // Skip tracking if Firebase is not initialized
    if (!db) {
      console.warn('⚠️ Firebase not initialized, skipping simple tracking');
      return null;
    }
    
    const docData = {
      userId: 'simple-user',
      userEmail,
      functionName,
      model: 'gpt-4',
      promptTokens: Math.floor(estimatedTokens * 0.7),
      completionTokens: Math.floor(estimatedTokens * 0.3),
      totalTokens: estimatedTokens,
      cost: estimatedTokens * 0.00006, // Rough estimate
      requestData: { source: 'simple-tracker' },
      responseData: { note: 'simplified tracking' },
      timestamp: new Date().toISOString()
    };
    
    const result = await db.collection('tokenUsage').add(docData);
    console.log('✅ Successfully created document:', result.id);
    
    // Track the Firebase write operation
    await trackFirebaseWrite('tokenUsage', 1, 'simple-user', userEmail, 'server', functionName);
    
    return result.id;
  } catch (error) {
    console.error('❌ Simple tracking failed:', error);
    throw error;
  }
};