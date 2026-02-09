// src/components/Header.tsx
"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { auth, googleProvider, db } from "../firebase";
import { onAuthStateChanged, signOut, signInWithPopup } from "firebase/auth";
import { collection, query, where, getDocs, orderBy, limit } from "firebase/firestore";
import styles from "../Styles/header.module.css";
import { useRouter } from "next/navigation";
import LevelIndicator from "./LevelIndicator";
import ProjectSwitcher from "./ProjectSwitcher";
import MobileProjectSheet from "./MobileProjectSheet";
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
import NotificationBell from "./NotificationBell";

interface UserStats {
  totalPlans: number;
  completedMilestones: number;
  totalMilestones: number;
  nudgeStreak: number;
  totalNudgeResponses: number;
  daysActive: number;
}

interface PlanForSwitcher {
  id: string;
  goalName?: string;
  goalType: string;
  status: 'active' | 'paused' | 'completed';
  milestones: Array<{
    id: string;
    completed: boolean;
  }>;
}

const Header = () => {
  const [user, setUser] = useState<any>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [userPlans, setUserPlans] = useState<PlanForSwitcher[]>([]);
  const [mobileProjectSheetOpen, setMobileProjectSheetOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      if (user) {
        fetchUserStats(user.uid);
        fetchUserPlans(user.uid);
      } else {
        setUserStats(null);
        setUserPlans([]);
      }
    });
    return () => unsubscribe();
  }, []);

  const fetchUserPlans = async (userId: string) => {
    try {
      const plansQuery = query(
        collection(db, "plans"),
        where("userId", "==", userId),
        orderBy("createdAt", "desc"),
        limit(10)
      );
      const plansSnapshot = await getDocs(plansQuery);
      const plans: PlanForSwitcher[] = plansSnapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          goalName: data.goalName,
          goalType: data.goalType || '',
          status: data.status || 'active',
          milestones: (data.milestones || []).map((m: any) => ({
            id: m.id,
            completed: m.completed || false,
          })),
        };
      });
      setUserPlans(plans);
    } catch (error) {
      console.error("Error fetching user plans:", error);
    }
  };

  const fetchUserStats = async (userId: string) => {
    try {
      // Fetch user plans
      const plansQuery = query(
        collection(db, "plans"),
        where("userId", "==", userId)
      );
      const plansSnapshot = await getDocs(plansQuery);
      const plans = plansSnapshot.docs.map((doc) => doc.data());

      // Calculate stats
      let completedMilestones = 0;
      let totalMilestones = 0;
      plans.forEach((plan: any) => {
        if (plan.milestones) {
          totalMilestones += plan.milestones.length;
          completedMilestones += plan.milestones.filter((m: any) => m.completed).length;
        }
      });

      // Fetch nudge responses
      const nudgesQuery = query(
        collection(db, "nudges"),
        where("userId", "==", userId)
      );
      const nudgesSnapshot = await getDocs(nudgesQuery);
      const nudges = nudgesSnapshot.docs.map((doc) => doc.data());
      const totalNudgeResponses = nudges.filter((n: any) => n.feedback).length;

      // Calculate streak (simplified - could be more sophisticated)
      let nudgeStreak = 0;
      const sortedNudges = nudges
        .filter((n: any) => n.feedback)
        .sort((a: any, b: any) => b.createdAt?.toMillis() - a.createdAt?.toMillis());

      for (let i = 0; i < sortedNudges.length; i++) {
        if (sortedNudges[i].feedback) {
          nudgeStreak++;
        } else {
          break;
        }
      }

      // Calculate days active (simplified)
      const daysActive = plans.length > 0 ? Math.ceil((Date.now() - plans[0].createdAt?.toMillis()) / (1000 * 60 * 60 * 24)) : 0;

      setUserStats({
        totalPlans: plans.length,
        completedMilestones,
        totalMilestones,
        nudgeStreak,
        totalNudgeResponses,
        daysActive,
      });
    } catch (error) {
      console.error("Error fetching user stats:", error);
    }
  };

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
              <Link href="/articles">Articles</Link>
            </li>
            <li>
              <Link href="/about">About</Link>
            </li>
            {user && (
              <>
                <li>
                  <Link href="/personality">Personality</Link>
                </li>
                <li>
                  <Link href="/profile">Dashboard</Link>
                </li>
              </>
            )}
          </ul>
        </nav>

        {/* Mobile Dropdown */}
        <div
          className={`${styles.mobileMenu} ${mobileMenuOpen ? styles.open : ""}`}
        >
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
              <div className={styles.mobileIconList}>
                <div className={styles.iconButton}>
                  <NotificationBell />
                </div>
                {userStats && (
                  <Link
                    href="/profile/levels"
                    onClick={() => setMobileMenuOpen(false)}
                    className={styles.iconButton}
                  >
                    <div className={styles.levelIconWrapper}>
                      <span className={styles.levelNumber}>
                        {Math.min(Math.floor(((userStats.completedMilestones * 100) + (userStats.totalNudgeResponses * 25) + (userStats.nudgeStreak * 10) + (userStats.totalPlans * 200) + (userStats.daysActive * 5)) / 500) + 1, 10)}
                      </span>
                    </div>
                  </Link>
                )}
                <Link
                  href="/profile"
                  onClick={() => setMobileMenuOpen(false)}
                  className={styles.iconButton}
                >
                  <img
                    src={user.photoURL}
                    alt="Profile"
                    className={styles.profileIconPic}
                  />
                </Link>
                <button
                  onClick={() => {
                    handleSignOut();
                    setMobileMenuOpen(false);
                  }}
                  className={`${styles.iconButton} ${styles.signOutIconButton}`}
                >
                  <LogOutIcon size={20} />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Desktop CTA */}
        <div className={styles.cta}>
          {user ? (
            <div className={styles.userInfo}>
              {userPlans.length > 0 && (
                <ProjectSwitcher plans={userPlans} />
              )}
              {userStats && <LevelIndicator userStats={userStats} />}
              <NotificationBell />
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
                    href="/personality"
                    className={styles.dropdownItem}
                  >
                    <UserIcon size={16} /> Personality
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
              <a
                href="/#test"
                className={`${styles.button} ${styles.signupButton}`}
              >
                <SparklesIcon size={16} /> Get Started
              </a>
            </>
          )}
        </div>
      </div>

      {/* Mobile Project Sheet */}
      {user && (
        <MobileProjectSheet
          isOpen={mobileProjectSheetOpen}
          onClose={() => setMobileProjectSheetOpen(false)}
          plans={userPlans}
        />
      )}
    </header>
  );
};

export default Header;
