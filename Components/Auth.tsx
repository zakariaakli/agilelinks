"use client";

import React, { useState, useEffect } from 'react';
import styles from '../Styles/auth.module.css';
import { useRouter, usePathname } from 'next/navigation';
import { auth, googleProvider, db } from '../firebase';
import { signInWithPopup, onAuthStateChanged } from 'firebase/auth';
import { TrackedFirestoreClient } from '../lib/trackedFirestoreClient';
import Link from 'next/link';

const Auth = () => {
  const [user, setUser] = useState<any>(null);
  const router = useRouter();
  const pathname = usePathname();

  const handleGoogleSignIn = async (e?: React.MouseEvent<HTMLButtonElement>) => {
    e?.preventDefault();
    try {
      const result = await signInWithPopup(auth, googleProvider);

      const userTestResult = localStorage.getItem('userTestResult');
      if (userTestResult) {
        const parsedResult = JSON.parse(userTestResult);
        await TrackedFirestoreClient.doc(`users/${result.user.uid}`).set({
          enneagramResult: parsedResult,
          name: result.user.displayName,
          email: result.user.email
        }, {
          userId: result.user.uid,
          userEmail: result.user.email || undefined,
          source: 'auth_component',
          functionName: 'save_enneagram_result_on_signup'
        });
        localStorage.removeItem('userTestResult');
      }

      const user = result.user;
      const userDoc = await TrackedFirestoreClient.doc(`users/${user.uid}`).get({
        userId: user.uid,
        userEmail: user.email || undefined,
        source: 'auth_component',
        functionName: 'check_user_exists_on_signin'
      });

      if (!userDoc.exists()) {
        await TrackedFirestoreClient.doc(`users/${user.uid}`).set({
          name: user.displayName,
          email: user.email,
        }, {
          userId: user.uid,
          userEmail: user.email || undefined,
          source: 'auth_component',
          functionName: 'create_user_on_signin'
        });

        // Create default companion settings with email notifications enabled
        await TrackedFirestoreClient.doc(`companionSettings/${user.uid}`).set({
          email: user.email || '',
          emailNudgesOptIn: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        }, {
          userId: user.uid,
          userEmail: user.email || undefined,
          source: 'auth_component',
          functionName: 'create_default_companion_settings'
        });
      }

      router.push('/');
    } catch (error) {
      console.error("Error signing in with Google", error);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const storedResult = localStorage.getItem('userTestResult');
        if (storedResult) {
          try {
            const enneagramResult = JSON.parse(storedResult);
            await TrackedFirestoreClient.doc(`users/${user.uid}`).set({
              enneagramResult
            }, {
              userId: user.uid,
              userEmail: user.email || undefined,
              source: 'auth_component',
              functionName: 'save_enneagram_result_on_auth_change'
            });
            localStorage.removeItem('userTestResult');
          } catch (error) {
            console.error('Error saving stored result after login:', error);
          }
        }
        setUser(user);
      }
    });
    return () => unsubscribe();
  }, []);

  return (
    <div className={styles.form}>
      <h2 className={styles.formTitle}>
        {pathname === '/signup' ? 'Welcome! Create your account' : 'Happy to have you back!'}
      </h2>
      <button onClick={(e) => handleGoogleSignIn(e)} className={styles.googleButton}>
        <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className={styles.googleLogo} />
        Continue with Google
      </button>
      <div style={{ textAlign: "center", marginTop: "10px" }}>
        {pathname === '/signup' ? (
          <>Already have an account? <Link href="/login" className={styles.authLink}>Sign in</Link></>
        ) : (
          <>Create Account? <Link href="/signup" className={styles.authLink}>Sign up</Link></>
        )}
      </div>
    </div>
  );
};

export default Auth;
