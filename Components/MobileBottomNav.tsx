"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { auth, db } from "../firebase";
import { onAuthStateChanged } from "firebase/auth";
import { collection, query, where, getDocs, orderBy, limit } from "firebase/firestore";
import { useRouter } from "next/navigation";
import styles from "../Styles/mobileBottomNav.module.css";
import { LogOutIcon, PlusIcon, UserIcon, TargetIcon } from "./Icons";
import NotificationBell from "./NotificationBell";
import MobileProjectSheet from "./MobileProjectSheet";
import { signOut } from "firebase/auth";

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

const MobileBottomNav = () => {
  const [user, setUser] = useState<any>(null);
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [userPlans, setUserPlans] = useState<PlanForSwitcher[]>([]);
  const [projectSheetOpen, setProjectSheetOpen] = useState(false);
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
      const plansQuery = query(
        collection(db, "plans"),
        where("userId", "==", userId)
      );
      const plansSnapshot = await getDocs(plansQuery);
      const plans = plansSnapshot.docs.map((doc) => doc.data());

      let completedMilestones = 0;
      let totalMilestones = 0;
      plans.forEach((plan: any) => {
        if (plan.milestones) {
          totalMilestones += plan.milestones.length;
          completedMilestones += plan.milestones.filter((m: any) => m.completed).length;
        }
      });

      const nudgesQuery = query(
        collection(db, "nudges"),
        where("userId", "==", userId)
      );
      const nudgesSnapshot = await getDocs(nudgesQuery);
      const nudges = nudgesSnapshot.docs.map((doc) => doc.data());
      const totalNudgeResponses = nudges.filter((n: any) => n.feedback).length;

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

  const currentLevel = userStats
    ? Math.min(
        Math.floor(
          ((userStats.completedMilestones * 100) +
            (userStats.totalNudgeResponses * 25) +
            (userStats.nudgeStreak * 10) +
            (userStats.totalPlans * 200) +
            (userStats.daysActive * 5)) /
            500
        ) + 1,
        10
      )
    : 1;

  if (!user) {
    return (
      <nav className={styles.bottomNav}>
        <Link href="/login" className={styles.authButton}>
          Log In
        </Link>
      </nav>
    );
  }

  return (
    <>
      <nav className={styles.bottomNav}>
        <div className={styles.navItem}>
          <NotificationBell />
        </div>
        {userPlans.length > 0 && (
          <button
            onClick={() => setProjectSheetOpen(true)}
            className={styles.navItem}
            aria-label="Switch project"
          >
            <TargetIcon size={20} strokeWidth={2} />
          </button>
        )}
        <Link href="/profile/companion" className={`${styles.navItem} ${styles.createPlanButton}`}>
          <div className={styles.createPlanIcon}>
            <PlusIcon size={16} strokeWidth={2.5} />
          </div>
        </Link>
        {userStats && (
          <Link href="/profile/levels" className={styles.navItem}>
            <div className={styles.levelIconWrapper}>
              <span className={styles.levelNumber}>{currentLevel}</span>
            </div>
          </Link>
        )}
        <Link href="/profile" className={styles.navItem}>
          <img
            src={user.photoURL}
            alt="Profile"
            className={styles.profileIconPic}
          />
        </Link>
      </nav>

      {/* Mobile Project Sheet */}
      <MobileProjectSheet
        isOpen={projectSheetOpen}
        onClose={() => setProjectSheetOpen(false)}
        plans={userPlans}
      />
    </>
  );
};

export default MobileBottomNav;
