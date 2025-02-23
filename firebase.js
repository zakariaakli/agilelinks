// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, doc, getDoc, query, where } from "firebase/firestore";

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_REACT_APP_FIREBASE_apiKey,
  authDomain: process.env.NEXT_PUBLIC_REACT_APP_FIREBASE_authDomain,
  projectId: process.env.NEXT_PUBLIC_REACT_APP_FIREBASE_projectId,
  storageBucket: process.env.NEXT_PUBLIC_REACT_APP_FIREBASE_storageBucket,
  messagingSenderId: process.env.NEXT_PUBLIC_REACT_APP_FIREBASE_messagingSenderId,
  appId: process.env.NEXT_PUBLIC_REACT_APP_FIREBASE_appId ,
  measurementId: process.env.NEXT_PUBLIC_REACT_APP_FIREBASE_measurementId
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firestore
const db = getFirestore(app);

export { db, collection, getDocs, doc, getDoc, query, where };