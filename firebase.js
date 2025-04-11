import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

// Placeholder Firebase configuration - REPLACE THESE WITH YOUR ACTUAL VALUES
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_AUTH_DOMAIN",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_STORAGE_BUCKET",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID",
  measurementId: "YOUR_MEASUREMENT_ID",
};

// Initialize Firebase app
const firebaseApp = initializeApp(firebaseConfig);

// Get the authentication object
const auth = getAuth(firebaseApp);

// Create a Google Auth Provider
const googleProvider = new GoogleAuthProvider();

// Export the firebase app and the auth object

export { firebaseApp, auth, googleProvider };

