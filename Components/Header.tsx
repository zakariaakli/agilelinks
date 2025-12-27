// src/components/Header.tsx
"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { auth, googleProvider } from "../firebase";
import { onAuthStateChanged, signOut, signInWithPopup } from "firebase/auth";
import styles from "../Styles/header.module.css";
import { useRouter } from "next/navigation";
import {
  UserIcon,
  TargetIcon,
  LogOutIcon,
  HomeIcon,
  BookOpenIcon,
  InfoIcon,
  ArrowRightIcon,
  SparklesIcon,
} from "./Icons";

const Header = () => {
  const [user, setUser] = useState<any>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
    });
    return () => unsubscribe();
  }, []);

  const handleSignOut = async () => {
    await signOut(auth);
    setUser(null);
    router.push("/");
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
        {/* Logo & Brand */}
        <Link href="/" className={`${styles.logo} elasticHover`}>
          <div>
            <div className={`${styles.brandName} gradientText`}>Stepiva</div>
            <div className={styles.brandTagline}>AI Companion</div>
          </div>
        </Link>

        {/* Mobile Menu Toggle */}
        <div
          className={`${styles.menuToggle} ${mobileMenuOpen ? styles.open : ""}`}
          onClick={toggleMobileMenu}
        >
          <div className={styles.bar}></div>
          <div className={styles.bar}></div>
          <div className={styles.bar}></div>
        </div>

        {/* Desktop Navigation */}
        <nav className={styles.nav}>
          <ul className={styles.navList}>
            <li>
              <Link href="/">Home</Link>
            </li>
            <li>
              <Link href="/articles">Articles</Link>
            </li>
            <li>
              <Link href="/about">About</Link>
            </li>
            {user && (
              <li>
                <Link href="/profile">Dashboard</Link>
              </li>
            )}
          </ul>
        </nav>

        {/* Mobile Dropdown */}
        <div
          className={`${styles.mobileMenu} ${mobileMenuOpen ? styles.open : ""}`}
        >
          {/* Navigation Links */}
          <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
            <li>
              <Link href="/" onClick={() => setMobileMenuOpen(false)}>
                Home
              </Link>
            </li>
            <li>
              <Link href="/articles" onClick={() => setMobileMenuOpen(false)}>
                Articles
              </Link>
            </li>
            <li>
              <Link href="/about" onClick={() => setMobileMenuOpen(false)}>
                About
              </Link>
            </li>
            {user && (
              <li>
                <Link href="/profile" onClick={() => setMobileMenuOpen(false)}>
                  Dashboard
                </Link>
              </li>
            )}
          </ul>

          {/* User Section */}
          {!user ? (
            <div className={styles.mobileButtons}>
              <Link
                href="/login"
                onClick={() => setMobileMenuOpen(false)}
                className={styles.login}
              >
                <ArrowRightIcon size={16} /> Log In
              </Link>
              <Link
                href="/signup"
                onClick={() => setMobileMenuOpen(false)}
                className={styles.signup}
              >
                <SparklesIcon size={16} /> Sign Up
              </Link>
            </div>
          ) : (
            <div className={styles.mobileUserInfo}>
              <Link href="/profile" onClick={() => setMobileMenuOpen(false)}>
                <img
                  src={user.photoURL}
                  alt="Profile"
                  className={styles.mobileProfilePic}
                />
              </Link>
              <span className={styles.mobileUserName}>
                {user.displayName || user.email}
              </span>
              <button
                onClick={() => {
                  handleSignOut();
                  setMobileMenuOpen(false);
                }}
                className={styles.logoutButton}
              >
                Sign Out
              </button>
            </div>
          )}
        </div>

        {/* Desktop CTA */}
        <div className={styles.cta}>
          {user ? (
            <div className={styles.userInfo}>
              <div className={styles.userDropdown}>
                <img
                  src={user.photoURL}
                  alt="Profile"
                  className={styles.profilePic}
                />
                <div className={styles.dropdownContent}>
                  <Link href="/profile" className={styles.dropdownItem}>
                    <UserIcon size={16} /> Dashboard
                  </Link>
                  <Link
                    href="/profile/companion"
                    className={styles.dropdownItem}
                  >
                    <TargetIcon size={16} /> Create Plan
                  </Link>
                  <Link
                    href="/profile/settings"
                    className={styles.dropdownItem}
                  >
                    <span style={{ fontSize: "16px" }}>⚙️</span> Settings
                  </Link>
                  {user.email === "zakaria.akli.ensa@gmail.com" && (
                    <Link href="/admin" className={styles.dropdownItem}>
                      <span style={{ fontSize: "16px" }}>🔧</span> Admin
                      Dashboard
                    </Link>
                  )}
                  <div className={styles.dropdownDivider}></div>
                  <button
                    onClick={handleSignOut}
                    className={`${styles.dropdownItem} ${styles.signOutBtn}`}
                  >
                    <LogOutIcon size={16} /> Sign Out
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <>
              <Link
                href="/login"
                className={`${styles.button} ${styles.loginButton}`}
              >
                Log In
              </Link>
              <Link
                href="/signup"
                className={`${styles.button} ${styles.signupButton}`}
              >
                <SparklesIcon size={16} /> Get Started
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
