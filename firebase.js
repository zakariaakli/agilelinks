import { initializeApp, getApps } from "firebase/app";
import { getFirestore, collection, getDocs, doc, getDoc, query, where } from "firebase/firestore";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

// Placeholder Firebase configuration - REPLACE THESE WITH YOUR ACTUAL VALUES
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_REACT_APP_FIREBASE_apiKey,
  authDomain: process.env.NEXT_PUBLIC_REACT_APP_FIREBASE_authDomain,
  projectId: process.env.NEXT_PUBLIC_REACT_APP_FIREBASE_projectId,
  storageBucket: process.env.NEXT_PUBLIC_REACT_APP_FIREBASE_storageBucket,
  messagingSenderId: process.env.NEXT_PUBLIC_REACT_APP_FIREBASE_messagingSenderId,
  appId: process.env.NEXT_PUBLIC_REACT_APP_FIREBASE_appId ,
  measurementId: process.env.NEXT_PUBLIC_REACT_APP_FIREBASE_measurementId
};

// Initialize Firebase app if it hasn't been initialized yet
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

// Get the authentication object
const auth = getAuth(app);

// Create a Google Auth Provider
const googleProvider = new GoogleAuthProvider();

const db = getFirestore(app);

// Export the firebase app and the auth object
export { db, collection, getDocs, doc, getDoc, query, where, auth, googleProvider};