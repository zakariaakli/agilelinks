"use client";
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { auth } from '../../firebase';
import { onAuthStateChanged, signOut, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import styles from '../Styles/header.module.css';
import { useRouter } from 'next/navigation';
 
const Header = () => {
  const [user, setUser] = useState<any>(null);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user); // Update user state on login/logout
    });
    return () => unsubscribe();
  }, []);

  const handleSignOut = async () => {
    await signOut(auth); // Sign out the user
    setUser(null); // Reset user state
    router.push('/'); // Redirect to the home page after sign out
  };

  const handleGoogleSignIn = async () => {
    try {
      const provider = new GoogleAuthProvider(); // Create a Google authentication provider
      await signInWithPopup(auth, provider); // Open a popup window for Google sign-in
    } catch (error) {
      console.error("Error signing in with Google", error); // Display an error if something goes wrong
    }
  };

  return (
    <header className={styles.header}>
      <div className={styles.logo}>
        <Link href="/">
          <img src="/logo.jpg" alt="AgileLinks Logo" className={styles.logoImage} />
        </Link>
      </div>
      <nav className={styles.nav}>
        <ul className={styles.navList}>
          <li><Link href="/product">Product</Link></li>
          <li><Link href="/articles">Blog</Link></li>
          <li><Link href="/about">About</Link></li>
        </ul>
      </nav>

      {/* Conditional rendering of buttons */}
      <div className={styles.cta}>
        {user ? (
          <button onClick={handleSignOut} className={`${styles.signOutBtn} ${styles.button}`}>
            Sign Out
          </button>
        ) : (
          <div>
            <Link href="/login" className={`${styles.button} ${styles.loginButton}`}>Log In</Link>
          </div>
        )}
        <button onClick={handleGoogleSignIn} className={`${styles.googleButton} ${styles.button}`}>
            Continue with Google
          </button>
      </div>
    </header>
    
  );
};

export default Header;
