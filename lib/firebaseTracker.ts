import { db } from '../firebase-admin';

interface FirebaseUsageData {
  userId: string;
  userEmail: string;
  operation: 'read' | 'write' | 'delete';
  collection: string;
  documentCount: number;
  timestamp: string;
  cost: number;
  source: string; // e.g., 'client', 'server', 'functions'
  functionName?: string; // which function triggered this operation
}

// Firebase pricing (as of 2024 - update as needed)
const FIREBASE_PRICING = {
  // Firestore pricing per operation
  reads: 0.06 / 100000,     // $0.06 per 100K reads  
  writes: 0.18 / 100000,    // $0.18 per 100K writes
  deletes: 0.02 / 100000,   // $0.02 per 100K deletes
  
  // Storage pricing
  storage: 0.18 / (1024 * 1024 * 1024 * 30), // $0.18 per GB-month (daily rate)
  
  // Network egress (simplified)
  networkEgress: 0.12 / (1024 * 1024 * 1024) // $0.12 per GB
};

export const calculateFirebaseCost = (
  operation: 'read' | 'write' | 'delete',
  documentCount: number
): number => {
  switch (operation) {
    case 'read':
      return documentCount * FIREBASE_PRICING.reads;
    case 'write':
      return documentCount * FIREBASE_PRICING.writes;
    case 'delete':
      return documentCount * FIREBASE_PRICING.deletes;
    default:
      return 0;
  }
};

export const trackFirebaseUsage = async (data: {
  userId: string;
  userEmail: string;
  operation: 'read' | 'write' | 'delete';
  collection: string;
  documentCount: number;
  source: string;
  functionName?: string;
}): Promise<void> => {
  try {
    const cost = calculateFirebaseCost(data.operation, data.documentCount);
    
    const usageData: FirebaseUsageData = {
      ...data,
      cost,
      timestamp: new Date().toISOString()
    };
    
    // Store in Firebase (ironically, this is also a write operation)
    await db.collection('firebaseUsage').add(usageData);
    
    console.log(`🔥 Firebase usage tracked: ${data.operation} ${data.documentCount} docs in ${data.collection} - $${cost.toFixed(6)}`);
  } catch (error) {
    console.error('❌ Error tracking Firebase usage:', error);
    // Don't throw error to avoid breaking main functionality
  }
};

// Wrapper functions for common Firebase operations
export const trackFirebaseRead = async (
  collection: string,
  documentCount: number,
  userId: string = 'system',
  userEmail: string = 'system@app.com',
  source: string = 'server',
  functionName?: string
) => {
  await trackFirebaseUsage({
    userId,
    userEmail,
    operation: 'read',
    collection,
    documentCount,
    source,
    functionName
  });
};

export const trackFirebaseWrite = async (
  collection: string,
  documentCount: number,
  userId: string = 'system',
  userEmail: string = 'system@app.com',
  source: string = 'server',
  functionName?: string
) => {
  await trackFirebaseUsage({
    userId,
    userEmail,
    operation: 'write',
    collection,
    documentCount,
    source,
    functionName
  });
};

export const trackFirebaseDelete = async (
  collection: string,
  documentCount: number,
  userId: string = 'system',
  userEmail: string = 'system@app.com',
  source: string = 'server',
  functionName?: string
) => {
  await trackFirebaseUsage({
    userId,
    userEmail,
    operation: 'delete',
    collection,
    documentCount,
    source,
    functionName
  });
};

// Helper to track a full Firebase query operation
export const trackFirebaseQuery = async (
  operation: 'read' | 'write' | 'delete',
  collection: string,
  resultCount: number,
  context: {
    userId?: string;
    userEmail?: string;
    source?: string;
    functionName?: string;
  } = {}
) => {
  await trackFirebaseUsage({
    userId: context.userId || 'system',
    userEmail: context.userEmail || 'system@app.com',
    operation,
    collection,
    documentCount: resultCount,
    source: context.source || 'server',
    functionName: context.functionName
  });
};

// Function to get Firebase usage statistics
export const getFirebaseUsageStats = async (
  days: number = 30
): Promise<{
  totalCost: number;
  totalReads: number;
  totalWrites: number;
  totalDeletes: number;
  operationBreakdown: { [collection: string]: { reads: number; writes: number; deletes: number; cost: number } };
  userBreakdown: { [userEmail: string]: { operations: number; cost: number } };
}> => {
  try {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    
    const snapshot = await db
      .collection('firebaseUsage')
      .where('timestamp', '>=', startDate.toISOString())
      .get();
    
    let totalCost = 0;
    let totalReads = 0;
    let totalWrites = 0;
    let totalDeletes = 0;
    
    const operationBreakdown: { [collection: string]: { reads: number; writes: number; deletes: number; cost: number } } = {};
    const userBreakdown: { [userEmail: string]: { operations: number; cost: number } } = {};
    
    snapshot.forEach(doc => {
      const data = doc.data();
      
      totalCost += data.cost || 0;
      
      // Count operations
      switch (data.operation) {
        case 'read':
          totalReads += data.documentCount || 0;
          break;
        case 'write':
          totalWrites += data.documentCount || 0;
          break;
        case 'delete':
          totalDeletes += data.documentCount || 0;
          break;
      }
      
      // Collection breakdown
      const collection = data.collection;
      if (!operationBreakdown[collection]) {
        operationBreakdown[collection] = { reads: 0, writes: 0, deletes: 0, cost: 0 };
      }
      if (data.operation === 'read') {
        operationBreakdown[collection].reads += data.documentCount || 0;
      } else if (data.operation === 'write') {
        operationBreakdown[collection].writes += data.documentCount || 0;
      } else if (data.operation === 'delete') {
        operationBreakdown[collection].deletes += data.documentCount || 0;
      }
      operationBreakdown[collection].cost += data.cost || 0;
      
      // User breakdown
      const userEmail = data.userEmail;
      if (!userBreakdown[userEmail]) {
        userBreakdown[userEmail] = { operations: 0, cost: 0 };
      }
      userBreakdown[userEmail].operations += data.documentCount || 0;
      userBreakdown[userEmail].cost += data.cost || 0;
    });
    
    return {
      totalCost,
      totalReads,
      totalWrites,
      totalDeletes,
      operationBreakdown,
      userBreakdown
    };
  } catch (error) {
    console.error('Error getting Firebase usage stats:', error);
    return {
      totalCost: 0,
      totalReads: 0,
      totalWrites: 0,
      totalDeletes: 0,
      operationBreakdown: {},
      userBreakdown: {}
    };
  }
};