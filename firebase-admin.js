import admin from 'firebase-admin';
import { readFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// ✅ Fix __dirname for ES module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


// Initialize Firebase Admin if not already initialized
let firebaseInitialized = false;

if (!admin.apps.length) {
  try {
    if (process.env.NODE_ENV === 'production' && process.env.VERCEL_ENV !== 'preview') {
      const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
      if (serviceAccountKey) {
        const serviceAccount = JSON.parse(serviceAccountKey);
        if (serviceAccount.project_id) {
          admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
          });
          firebaseInitialized = true;
        } else {
          console.warn('Firebase service account missing project_id');
        }
      } else {
        console.warn('Firebase service account key not found in production');
      }
    } else if (process.env.NODE_ENV === 'development') {
      try {
        const serviceAccountPath = path.resolve(__dirname, './serviceaccount.json');
        const serviceAccount = JSON.parse(readFileSync(serviceAccountPath, 'utf8'));

        admin.initializeApp({
          credential: admin.credential.cert(serviceAccount),
        });
        firebaseInitialized = true;
      } catch (error) {
        console.warn('Firebase service account file not found in development:', error.message);
      }
    }
  } catch (error) {
    console.warn('Firebase initialization failed:', error.message);
  }
}

// Export Firebase services with safety checks
export const db = admin.apps.length > 0 ? admin.firestore() : null;
export const auth = admin.apps.length > 0 ? admin.auth() : null;
