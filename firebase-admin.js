import admin from 'firebase-admin';
import { readFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// ✅ Fix __dirname for ES module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);



if (!admin.apps.length) {
  if (process.env.NODE_ENV === 'production') {
    const serviceAccount = JSON.parse(
      process.env.FIREBASE_SERVICE_ACCOUNT_KEY
    );
    // ✅ Production (e.g., Vercel) — use env vars
    admin.initializeApp({
      credential: admin.credential.cert({
        credential: admin.credential.cert(serviceAccount),
      }),
    });
  } else {
    // ✅ Development — use local serviceAccount.json file
    const serviceAccountPath = path.resolve(__dirname, './serviceaccount.json');
    const serviceAccount = JSON.parse(readFileSync(serviceAccountPath, 'utf8'));

    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
  }
}

export const db = admin.firestore();
export const auth = admin.auth();
