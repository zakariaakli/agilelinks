"use client";
import React, { useState } from 'react';
import styles from '../Styles/auth.module.css';
import { useRouter, usePathname, redirect } from 'next/navigation';
import { auth, googleProvider, db } from '../firebase';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signInWithPopup } from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import Link from 'next/link';

const Auth = () => {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const router = useRouter();
  const pathname = usePathname();

  // Handle Google sign-in
  const handleGoogleSignIn = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      // If it is a new user, add the user to firestore.
      // Read user test result from local storage
      const userTestResult = localStorage.getItem('userTestResult');
      if (userTestResult) {
        // Add test result to user document in Firestore
        const parsedResult = JSON.parse(userTestResult);
        await setDoc(doc(db, 'users', result.user.uid), { enneagramResult: parsedResult }, { merge: true });
        // Clear local storage
        localStorage.removeItem('userTestResult');
      }

      const user = result.user;
      const userDocRef = doc(db, 'users', user.uid);
      const userDoc = await getDoc(userDocRef);
      if (!userDoc.exists()) {
        await setDoc(userDocRef, {
          name: user.displayName,
          email: user.email,
        });
      }

      redirect('/');
    } catch (error) {
      console.error("Error signing in with Google", error);
    }
  };

  // Handle Sign Up
  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault(); // Prevent page refresh
    try {
      // Create user in Firebase Authentication
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Add user to Firestore
      // Read user test result from local storage
      const userTestResult = localStorage.getItem('userTestResult');
      if (userTestResult) {
        // Add test result to user document in Firestore
        const parsedResult = JSON.parse(userTestResult);
        await setDoc(doc(db, 'users', user.uid), { enneagramResult: parsedResult }, { merge: true });
        // Clear local storage
        localStorage.removeItem('userTestResult');
      }
      const userDocRef = doc(db, 'users', user.uid);
      await setDoc(userDocRef, {
        name: fullName,
        email: email,
      });



      router.push('/'); // Redirect to home page
    } catch (error) {
      console.error('Error signing up:', error);
    }
  };

  // Handle Sign In
  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault(); // Prevent page refresh

    try {
        // Read user test result from local storage
        const userTestResult = localStorage.getItem('userTestResult');
        const result = await signInWithEmailAndPassword(auth, email, password);
        if (userTestResult) {
          // Add test result to user document in Firestore
          const parsedResult = JSON.parse(userTestResult);
          await setDoc(doc(db, 'users', result.user.uid), { enneagramResult: parsedResult }, { merge: true });
          // Clear local storage
          localStorage.removeItem('userTestResult');
        }
      router.push('/'); // Redirect to home page
    } catch (error) {
      console.error('Error logging in:', error);
    }
  };

  return (
    <div>
      {pathname === '/signup' && (
        <form className={styles.form} onSubmit={handleSignUp}>
          <h2 className={styles.formTitle}>Welcome! Create your account</h2>
          <button onClick={handleGoogleSignIn} className={styles.googleButton}>
            <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className={styles.googleLogo} />
            Continue with Google
          </button>
          <div className={styles.separator}>Or continue with email</div>
          <label htmlFor="fullName" className={styles.label}>Full Name</label>
          <input
            type="text"
            id="fullName"
            name="fullName"
            className={styles.input}
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
          />
          <label htmlFor="email" className={styles.label}>Email</label>
          <input
            type="email"
            id="email"
            name="email"
            className={styles.input}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <label htmlFor="password" className={styles.label}>Password</label>
          <input
            type="password"
            id="password"
            name="password"
            className={styles.input}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <label htmlFor="confirmPassword" className={styles.label}>Confirm Password</label>
          <input
            type="password"
            id="confirmPassword"
            name="confirmPassword"
            className={styles.input}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
          />
          <button type="submit" className={styles.button}>Sign Up</button>
          <div style={{ textAlign: "center", marginTop: "10px" }}>
            Already have an account? <Link href="/login" className={styles.authLink}>Sign in</Link>
          </div>
        </form>
      )}

      {pathname === '/login' && (
        <form className={styles.form} onSubmit={handleSignIn}>
          <h2 className={styles.formTitle}>Happy to have you back!</h2>
          <button onClick={handleGoogleSignIn} className={styles.googleButton}>
            <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className={styles.googleLogo} />
            Continue with Google
          </button>
          <div className={styles.separator}>Or continue with email</div>
          <label htmlFor="email" className={styles.label}>Email</label>
          <input
            type="email"
            id="email"
            name="email"
            className={styles.input}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <label htmlFor="password" className={styles.label}>Password</label>
          <input
            type="password"
            id="password"
            name="password"
            className={styles.input}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <button type="submit" className={styles.button}>Log In</button>
          <div style={{ textAlign: "center", marginTop: "10px" }}>
            Create Account? <Link href="/signup" className={styles.authLink}>Sign up</Link>
          </div>
        </form>
      )}
    </div>
  );
};

export default Auth;
