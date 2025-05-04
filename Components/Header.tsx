// src/components/Header.tsx
'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { auth, googleProvider } from '../firebase';
import { onAuthStateChanged, signOut, signInWithPopup } from 'firebase/auth';
import styles from '../Styles/header.module.css';
import { useRouter } from 'next/navigation';

const Header = () => {
  const [user, setUser] = useState<any>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      console.log(user)
      setUser(user);
    });
    return () => unsubscribe();
  }, []);

  const handleSignOut = async () => {
    await signOut(auth);
    setUser(null);
    router.push('/');
  };

  const handleGoogleSignIn = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
      router.push("/");
    } catch (error) {
      console.error("Error signing in with Google", error);
    }
  };

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  return (
    <header className={styles.header}>
      <div className="page-container d-flex align-items-center justify-content-between w-100">

        {/* Logo */}
        <div className={styles.logo}>
          <Link href="/">
            <img src="/logo.jpg" alt="AgileLinks Logo" className={styles.logoImage} />
          </Link>
        </div>

        {/* Mobile Menu Toggle */}
        {mobileMenuOpen ? (
          <div className={styles.menuToggle} onClick={toggleMobileMenu}>
            <span style={{ fontSize: '24px', color: '#6366F1' }}>✕</span>
          </div>
        ) : (
          <div className={styles.menuToggle} onClick={toggleMobileMenu}>
            <div className={styles.bar}></div>
            <div className={styles.bar}></div>
            <div className={styles.bar}></div>
          </div>
        )}

        {/* Desktop Navigation */}
        <nav className={styles.nav}>
          <ul className={styles.navList}>
            <li><Link href="/articles">Blog</Link></li>
          </ul>
        </nav>

        {/* Mobile Dropdown */}
        <ul className={`${styles.mobileMenu} ${mobileMenuOpen ? styles.open : ''}`}>
          {!user ? (
            <div className={styles.mobileButtons}>
              <Link href="/login" onClick={() => setMobileMenuOpen(false)} className={styles.login}>
                Log In
              </Link>
              <Link href="/signup" onClick={() => setMobileMenuOpen(false)} className={styles.signup}>
                Sign Up
              </Link>
            </div>
          ) : (
            <div className={styles.mobileUserInfo}>
              <Link href="/profile">
              <img src={user.photoURL} alt="Profile" className={styles.mobileProfilePic} />
              </Link>

              <span className={styles.mobileUserName}>{user.name}</span>
              <button onClick={() => { handleSignOut(); setMobileMenuOpen(false); }} className={`${styles.button} ${styles.logoutButton}`}>
                Sign Out
              </button>
            </div>
          )}
        </ul>

        {/* Desktop CTA */}
        <div className={styles.cta}>
          {user ? (
            <div className={styles.userInfo}>
              <Link href="/profile">
                {user.photoURL && <img src={user.photoURL} alt="Profile" className={styles.profilePic} />}
              </Link>
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

      </div>
    </header>
  );
};

export default Header;
