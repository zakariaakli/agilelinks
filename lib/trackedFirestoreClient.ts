import { db } from '../firebase';
import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  addDoc, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  limit,
  QuerySnapshot,
  DocumentSnapshot
} from 'firebase/firestore';

interface TrackingContext {
  userId?: string;
  userEmail?: string;
  source?: string;
  functionName?: string;
}

// Client-side tracking function - sends data to server
const trackFirebaseOperation = async (
  operation: 'read' | 'write' | 'delete',
  collectionName: string,
  documentCount: number,
  context: TrackingContext = {}
) => {
  try {
    // Skip tracking during server-side rendering/static generation
    if (typeof window === 'undefined') {
      return;
    }

    // Send tracking data to server endpoint
    await fetch('/api/track-firebase-usage', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        operation,
        collection: collectionName,
        documentCount,
        ...context,
        timestamp: new Date().toISOString()
      })
    });
  } catch (error) {
    console.warn('Failed to track Firebase operation:', error);
  }
};

// Client-side TrackedFirestore that works with Firebase v9+ SDK
export class TrackedFirestoreClient {
  
  // Tracked collection reference
  static collection(collectionPath: string) {
    return {
      // Tracked add operation
      add: async (data: any, context: TrackingContext = {}) => {
        const result = await addDoc(collection(db, collectionPath), data);
        
        // Track the write operation
        await trackFirebaseOperation('write', collectionPath, 1, {
          ...context,
          functionName: context.functionName || 'firestore_add'
        });
        
        return result;
      },
      
      // Tracked get operation (for entire collection)
      get: async (context: TrackingContext = {}) => {
        const snapshot = await getDocs(collection(db, collectionPath));
        
        // Track the read operation
        await trackFirebaseOperation('read', collectionPath, snapshot.size, {
          ...context,
          functionName: context.functionName || 'firestore_collection_get'
        });
        
        return snapshot;
      },
      
      // Tracked where query
      where: (field: string, operator: any, value: any) => {
        return {
          get: async (context: TrackingContext = {}) => {
            const q = query(collection(db, collectionPath), where(field, operator, value));
            const snapshot = await getDocs(q);

            // Track the read operation
            await trackFirebaseOperation('read', collectionPath, snapshot.size, {
              ...context,
              functionName: context.functionName || 'firestore_where_query'
            });

            return snapshot;
          },

          orderBy: (orderByField: string, direction?: 'asc' | 'desc') => {
            return {
              get: async (context: TrackingContext = {}) => {
                const q = query(
                  collection(db, collectionPath),
                  where(field, operator, value),
                  orderBy(orderByField, direction)
                );
                const snapshot = await getDocs(q);

                await trackFirebaseOperation('read', collectionPath, snapshot.size, {
                  ...context,
                  functionName: context.functionName || 'firestore_ordered_query'
                });

                return snapshot;
              },

              limit: (limitCount: number) => {
                return {
                  get: async (context: TrackingContext = {}) => {
                    const q = query(
                      collection(db, collectionPath),
                      where(field, operator, value),
                      orderBy(orderByField, direction),
                      limit(limitCount)
                    );
                    const snapshot = await getDocs(q);

                    await trackFirebaseOperation('read', collectionPath, snapshot.size, {
                      ...context,
                      functionName: context.functionName || 'firestore_limited_query'
                    });

                    return snapshot;
                  }
                };
              }
            };
          },
          
          limit: (limitCount: number) => {
            return {
              get: async (context: TrackingContext = {}) => {
                const q = query(
                  collection(db, collectionPath),
                  where(field, operator, value),
                  limit(limitCount)
                );
                const snapshot = await getDocs(q);
                
                await trackFirebaseOperation('read', collectionPath, snapshot.size, {
                  ...context,
                  functionName: context.functionName || 'firestore_limited_where_query'
                });
                
                return snapshot;
              }
            };
          }
        };
      },
      
      // Tracked orderBy
      orderBy: (field: string, direction?: 'asc' | 'desc') => {
        return {
          get: async (context: TrackingContext = {}) => {
            const q = query(collection(db, collectionPath), orderBy(field, direction));
            const snapshot = await getDocs(q);
            
            await trackFirebaseOperation('read', collectionPath, snapshot.size, {
              ...context,
              functionName: context.functionName || 'firestore_orderby_query'
            });
            
            return snapshot;
          },
          
          limit: (limitCount: number) => {
            return {
              get: async (context: TrackingContext = {}) => {
                const q = query(
                  collection(db, collectionPath),
                  orderBy(field, direction),
                  limit(limitCount)
                );
                const snapshot = await getDocs(q);
                
                await trackFirebaseOperation('read', collectionPath, snapshot.size, {
                  ...context,
                  functionName: context.functionName || 'firestore_ordered_limited_query'
                });
                
                return snapshot;
              }
            };
          }
        };
      }
    };
  }
  
  // Tracked document operations
  static doc(documentPath: string) {
    return {
      // Tracked get operation
      get: async (context: TrackingContext = {}) => {
        const snapshot = await getDoc(doc(db, documentPath));
        
        // Extract collection name from path
        const collectionName = documentPath.split('/')[0];
        
        await trackFirebaseOperation('read', collectionName, snapshot.exists() ? 1 : 0, {
          ...context,
          functionName: context.functionName || 'firestore_doc_get'
        });
        
        return snapshot;
      },
      
      // Tracked set operation
      set: async (data: any, context: TrackingContext = {}) => {
        const result = await setDoc(doc(db, documentPath), data);
        
        const collectionName = documentPath.split('/')[0];
        
        await trackFirebaseOperation('write', collectionName, 1, {
          ...context,
          functionName: context.functionName || 'firestore_doc_set'
        });
        
        return result;
      },
      
      // Tracked update operation
      update: async (data: any, context: TrackingContext = {}) => {
        const result = await updateDoc(doc(db, documentPath), data);
        
        const collectionName = documentPath.split('/')[0];
        
        await trackFirebaseOperation('write', collectionName, 1, {
          ...context,
          functionName: context.functionName || 'firestore_doc_update'
        });
        
        return result;
      },
      
      // Tracked delete operation
      delete: async (context: TrackingContext = {}) => {
        const result = await deleteDoc(doc(db, documentPath));
        
        const collectionName = documentPath.split('/')[0];
        
        await trackFirebaseOperation('delete', collectionName, 1, {
          ...context,
          functionName: context.functionName || 'firestore_doc_delete'
        });
        
        return result;
      }
    };
  }
}

// Convenience functions for common operations
export const trackedAdd = async (
  collectionPath: string,
  data: any,
  context: TrackingContext = {}
) => {
  return TrackedFirestoreClient.collection(collectionPath).add(data, context);
};

export const trackedGet = async (
  collectionPath: string,
  context: TrackingContext = {}
) => {
  return TrackedFirestoreClient.collection(collectionPath).get(context);
};

export const trackedDocGet = async (
  documentPath: string,
  context: TrackingContext = {}
) => {
  return TrackedFirestoreClient.doc(documentPath).get(context);
};