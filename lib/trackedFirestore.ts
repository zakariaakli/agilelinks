import { db } from '../firebase-admin';
import { trackFirebaseQuery } from './firebaseTracker';

interface TrackingContext {
  userId?: string;
  userEmail?: string;
  source?: string;
  functionName?: string;
}

// Tracked Firestore operations that automatically log usage
export class TrackedFirestore {
  
  // Tracked collection reference
  static collection(collectionPath: string) {
    return {
      // Tracked add operation
      add: async (data: any, context: TrackingContext = {}) => {
        const result = await db.collection(collectionPath).add(data);
        
        // Track the write operation
        await trackFirebaseQuery('write', collectionPath, 1, {
          ...context,
          functionName: context.functionName || 'firestore_add'
        });
        
        return result;
      },
      
      // Tracked get operation (for entire collection)
      get: async (context: TrackingContext = {}) => {
        const snapshot = await db.collection(collectionPath).get();
        
        // Track the read operation
        await trackFirebaseQuery('read', collectionPath, snapshot.size, {
          ...context,
          functionName: context.functionName || 'firestore_collection_get'
        });
        
        return snapshot;
      },
      
      // Tracked where query
      where: (field: string, operator: any, value: any) => {
        const query = db.collection(collectionPath).where(field, operator, value);
        
        return {
          get: async (context: TrackingContext = {}) => {
            const snapshot = await query.get();
            
            // Track the read operation
            await trackFirebaseQuery('read', collectionPath, snapshot.size, {
              ...context,
              functionName: context.functionName || 'firestore_where_query'
            });
            
            return snapshot;
          },
          
          orderBy: (field: string, direction?: 'asc' | 'desc') => {
            const orderedQuery = query.orderBy(field, direction);
            
            return {
              get: async (context: TrackingContext = {}) => {
                const snapshot = await orderedQuery.get();
                
                await trackFirebaseQuery('read', collectionPath, snapshot.size, {
                  ...context,
                  functionName: context.functionName || 'firestore_ordered_query'
                });
                
                return snapshot;
              },
              
              limit: (limitCount: number) => {
                const limitedQuery = orderedQuery.limit(limitCount);
                
                return {
                  get: async (context: TrackingContext = {}) => {
                    const snapshot = await limitedQuery.get();
                    
                    await trackFirebaseQuery('read', collectionPath, snapshot.size, {
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
            const limitedQuery = query.limit(limitCount);
            
            return {
              get: async (context: TrackingContext = {}) => {
                const snapshot = await limitedQuery.get();
                
                await trackFirebaseQuery('read', collectionPath, snapshot.size, {
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
        const query = db.collection(collectionPath).orderBy(field, direction);
        
        return {
          get: async (context: TrackingContext = {}) => {
            const snapshot = await query.get();
            
            await trackFirebaseQuery('read', collectionPath, snapshot.size, {
              ...context,
              functionName: context.functionName || 'firestore_orderby_query'
            });
            
            return snapshot;
          },
          
          limit: (limitCount: number) => {
            const limitedQuery = query.limit(limitCount);
            
            return {
              get: async (context: TrackingContext = {}) => {
                const snapshot = await limitedQuery.get();
                
                await trackFirebaseQuery('read', collectionPath, snapshot.size, {
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
        const snapshot = await db.doc(documentPath).get();
        
        // Extract collection name from path
        const collectionName = documentPath.split('/')[0];
        
        await trackFirebaseQuery('read', collectionName, snapshot.exists ? 1 : 0, {
          ...context,
          functionName: context.functionName || 'firestore_doc_get'
        });
        
        return snapshot;
      },
      
      // Tracked set operation
      set: async (data: any, context: TrackingContext = {}) => {
        const result = await db.doc(documentPath).set(data);
        
        const collectionName = documentPath.split('/')[0];
        
        await trackFirebaseQuery('write', collectionName, 1, {
          ...context,
          functionName: context.functionName || 'firestore_doc_set'
        });
        
        return result;
      },
      
      // Tracked update operation
      update: async (data: any, context: TrackingContext = {}) => {
        const result = await db.doc(documentPath).update(data);
        
        const collectionName = documentPath.split('/')[0];
        
        await trackFirebaseQuery('write', collectionName, 1, {
          ...context,
          functionName: context.functionName || 'firestore_doc_update'
        });
        
        return result;
      },
      
      // Tracked delete operation
      delete: async (context: TrackingContext = {}) => {
        const result = await db.doc(documentPath).delete();
        
        const collectionName = documentPath.split('/')[0];
        
        await trackFirebaseQuery('delete', collectionName, 1, {
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
  collection: string,
  data: any,
  context: TrackingContext = {}
) => {
  return TrackedFirestore.collection(collection).add(data, context);
};

export const trackedGet = async (
  collection: string,
  context: TrackingContext = {}
) => {
  return TrackedFirestore.collection(collection).get(context);
};

export const trackedDocGet = async (
  documentPath: string,
  context: TrackingContext = {}
) => {
  return TrackedFirestore.doc(documentPath).get(context);
};