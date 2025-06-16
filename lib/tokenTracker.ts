import { db } from '../firebase-admin';
import { Timestamp } from 'firebase-admin/firestore';

interface TokenUsageData {
  userId: string;
  userEmail: string;
  functionName: string;
  model: string;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  cost: number;
  requestData?: any;
  responseData?: any;
  timestamp: Timestamp;
}

// OpenAI pricing (update these as needed)
const PRICING = {
  'gpt-4': {
    prompt: 0.03 / 1000,    // $0.03 per 1K prompt tokens
    completion: 0.06 / 1000  // $0.06 per 1K completion tokens
  },
  'gpt-4-turbo': {
    prompt: 0.01 / 1000,    // $0.01 per 1K prompt tokens
    completion: 0.03 / 1000  // $0.03 per 1K completion tokens
  },
  'gpt-3.5-turbo': {
    prompt: 0.0015 / 1000,   // $0.0015 per 1K prompt tokens
    completion: 0.002 / 1000  // $0.002 per 1K completion tokens
  }
};

export const calculateCost = (
  model: string,
  promptTokens: number,
  completionTokens: number
): number => {
  const modelPricing = PRICING[model as keyof typeof PRICING] || PRICING['gpt-3.5-turbo'];
  
  const promptCost = promptTokens * modelPricing.prompt;
  const completionCost = completionTokens * modelPricing.completion;
  
  return promptCost + completionCost;
};

export const trackTokenUsage = async (data: {
  userId: string;
  userEmail: string;
  functionName: string;
  model: string;
  promptTokens: number;
  completionTokens: number;
  requestData?: any;
  responseData?: any;
}): Promise<void> => {
  try {
    const totalTokens = data.promptTokens + data.completionTokens;
    const cost = calculateCost(data.model, data.promptTokens, data.completionTokens);

    const tokenUsageData: TokenUsageData = {
      userId: data.userId,
      userEmail: data.userEmail,
      functionName: data.functionName,
      model: data.model,
      promptTokens: data.promptTokens,
      completionTokens: data.completionTokens,
      totalTokens,
      cost,
      requestData: data.requestData || null,
      responseData: data.responseData || null,
      timestamp: Timestamp.now()
    };

    // Store in Firebase
    await db.collection('tokenUsage').add(tokenUsageData);

    console.log(`Token usage tracked: ${data.functionName} - ${totalTokens} tokens - $${cost.toFixed(4)}`);
  } catch (error) {
    console.error('Error tracking token usage:', error);
    // Don't throw error to avoid breaking the main functionality
  }
};

export const trackAPICall = async (
  functionName: string,
  userId: string,
  userEmail: string,
  openaiResponse: any,
  requestData?: any
): Promise<void> => {
  console.log('🔍 Tracking API call:', { functionName, userId, userEmail, hasUsage: !!openaiResponse?.usage });

  if (!openaiResponse?.usage) {
    console.warn('❌ No usage data in OpenAI response for', functionName);
    
    // For Assistant API, estimate tokens based on content length
    // This is a fallback when actual usage data is not available
    const estimatedPromptTokens = estimateTokens(JSON.stringify(requestData || {}));
    const estimatedCompletionTokens = 150; // Rough estimate for typical responses
    
    console.log('📊 Using estimated tokens:', { estimatedPromptTokens, estimatedCompletionTokens });
    
    await trackTokenUsage({
      userId,
      userEmail,
      functionName,
      model: 'gpt-4', // Assistant API typically uses GPT-4
      promptTokens: estimatedPromptTokens,
      completionTokens: estimatedCompletionTokens,
      requestData,
      responseData: { note: 'Estimated tokens - Assistant API does not return usage data' }
    });
    return;
  }

  const usage = openaiResponse.usage;
  console.log('✅ Found actual usage data:', usage);
  
  await trackTokenUsage({
    userId,
    userEmail,
    functionName,
    model: openaiResponse.model || 'gpt-4',
    promptTokens: usage.prompt_tokens || 0,
    completionTokens: usage.completion_tokens || 0,
    requestData,
    responseData: {
      model: openaiResponse.model,
      choices: openaiResponse.choices?.length || 0,
      finish_reason: openaiResponse.choices?.[0]?.finish_reason
    }
  });
};

// Helper function to estimate tokens (rough approximation)
function estimateTokens(text: string): number {
  // Rough estimation: 1 token ≈ 4 characters for English text
  return Math.ceil(text.length / 4);
}

// Function to get user stats (can be used in admin dashboard)
export const getUserTokenStats = async (
  userEmail: string,
  days: number = 30
): Promise<{
  totalCost: number;
  totalTokens: number;
  requestCount: number;
  functionBreakdown: { [key: string]: { cost: number; tokens: number; count: number } };
}> => {
  try {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const snapshot = await db
      .collection('tokenUsage')
      .where('userEmail', '==', userEmail)
      .where('timestamp', '>=', Timestamp.fromDate(startDate))
      .get();

    let totalCost = 0;
    let totalTokens = 0;
    let requestCount = 0;
    const functionBreakdown: { [key: string]: { cost: number; tokens: number; count: number } } = {};

    snapshot.forEach(doc => {
      const data = doc.data();
      totalCost += data.cost || 0;
      totalTokens += data.totalTokens || 0;
      requestCount += 1;

      const funcName = data.functionName;
      if (!functionBreakdown[funcName]) {
        functionBreakdown[funcName] = { cost: 0, tokens: 0, count: 0 };
      }
      functionBreakdown[funcName].cost += data.cost || 0;
      functionBreakdown[funcName].tokens += data.totalTokens || 0;
      functionBreakdown[funcName].count += 1;
    });

    return {
      totalCost,
      totalTokens,
      requestCount,
      functionBreakdown
    };
  } catch (error) {
    console.error('Error getting user token stats:', error);
    return {
      totalCost: 0,
      totalTokens: 0,
      requestCount: 0,
      functionBreakdown: {}
    };
  }
};