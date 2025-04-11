"use client";
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { auth, googleProvider } from '../../firebase';
import { onAuthStateChanged, signOut, signInWithPopup } from 'firebase/auth';
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
    router.push('/');
  };

  const handleGoogleSignIn = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
      // The user is automatically signed in at this point
      router.push("/");
    } catch (error) {
      console.error("Error signing in with Google", error);
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
          <div className={styles.userInfo}>
            {user.photoURL && <img src={user.photoURL} alt="Profile" className={styles.profilePic} />}
            {user.displayName && <span className={styles.userName}>{user.displayName}</span>}
            <button onClick={handleSignOut} className={`${styles.signOutBtn} ${styles.button}`}>
              Sign Out
            </button>
          </div>
        ) : (
          <div>
            <Link href="/login" className={`${styles.button} ${styles.loginButton}`}>Log In</Link>
            <Link href="/signup" className={`${styles.button} ${styles.signupButton}`}>Sign Up</Link>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
