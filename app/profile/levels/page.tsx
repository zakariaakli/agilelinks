"use client";

import React, { useState, useEffect } from "react";
import { auth, db } from "../../../firebase";
import { onAuthStateChanged } from "firebase/auth";
import { collection, query, where, getDocs } from "firebase/firestore";
import { useRouter } from "next/navigation";
import styles from "../../../Styles/levels.module.css";
import Link from "next/link";
import { ArrowLeftIcon, TrophyIcon, StarIcon, FireIcon, ZapIcon } from "../../../Components/Icons";

interface UserStats {
  totalPlans: number;
  completedMilestones: number;
  totalMilestones: number;
  nudgeStreak: number;
  totalNudgeResponses: number;
  daysActive: number;
}

interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlocked: boolean;
  requirement: string;
  progress?: number;
  maxProgress?: number;
}

const MAX_LEVEL = 10;

export default function LevelsPage() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [userStats, setUserStats] = useState<UserStats>({
    totalPlans: 0,
    completedMilestones: 0,
    totalMilestones: 0,
    nudgeStreak: 0,
    totalNudgeResponses: 0,
    daysActive: 0,
  });
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUser(user);
        fetchUserStats(user.uid);
      } else {
        router.push("/login");
      }
    });
    return () => unsubscribe();
  }, [router]);

  const fetchUserStats = async (userId: string) => {
    try {
      setLoading(true);

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

      // Calculate streak
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

      // Calculate days active
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
    } finally {
      setLoading(false);
    }
  };

  const calculateLevel = (stats: UserStats) => {
    const totalXP =
      (stats.completedMilestones * 100) +
      (stats.totalNudgeResponses * 25) +
      (stats.nudgeStreak * 10) +
      (stats.totalPlans * 200) +
      (stats.daysActive * 5);

    return Math.min(Math.floor(totalXP / 500) + 1, MAX_LEVEL);
  };

  const calculateTotalXP = (stats: UserStats) => {
    return (
      (stats.completedMilestones * 100) +
      (stats.totalNudgeResponses * 25) +
      (stats.nudgeStreak * 10) +
      (stats.totalPlans * 200) +
      (stats.daysActive * 5)
    );
  };

  const calculateXPForNextLevel = (stats: UserStats) => {
    const currentLevel = calculateLevel(stats);

    if (currentLevel >= MAX_LEVEL) {
      return {
        currentXP: 500,
        neededXP: 0,
        progressPercentage: 100
      };
    }

    const totalXP = calculateTotalXP(stats);
    const xpForCurrentLevel = (currentLevel - 1) * 500;
    const currentLevelProgress = totalXP - xpForCurrentLevel;
    const progressPercentage = (currentLevelProgress / 500) * 100;

    return {
      currentXP: currentLevelProgress,
      neededXP: 500 - currentLevelProgress,
      progressPercentage: Math.min(progressPercentage, 100)
    };
  };

  const generateAchievements = (stats: UserStats): Achievement[] => {
    return [
      {
        id: 'first_plan',
        title: 'Goal Setter',
        description: 'Created your first plan',
        icon: '🎯',
        unlocked: stats.totalPlans >= 1,
        requirement: 'Create 1 plan',
        progress: Math.min(stats.totalPlans, 1),
        maxProgress: 1
      },
      {
        id: 'milestone_achiever',
        title: 'Milestone Master',
        description: 'Completed 5 milestones',
        icon: '🏆',
        unlocked: stats.completedMilestones >= 5,
        requirement: 'Complete 5 milestones',
        progress: Math.min(stats.completedMilestones, 5),
        maxProgress: 5
      },
      {
        id: 'streak_keeper',
        title: 'Streak Keeper',
        description: 'Maintained a 7-day nudge streak',
        icon: '🔥',
        unlocked: stats.nudgeStreak >= 7,
        requirement: 'Maintain 7-day streak',
        progress: Math.min(stats.nudgeStreak, 7),
        maxProgress: 7
      },
      {
        id: 'engaged_user',
        title: 'Engaged Learner',
        description: 'Responded to 10 nudges',
        icon: '💬',
        unlocked: stats.totalNudgeResponses >= 10,
        requirement: 'Respond to 10 nudges',
        progress: Math.min(stats.totalNudgeResponses, 10),
        maxProgress: 10
      },
      {
        id: 'goal_master',
        title: 'Goal Master',
        description: 'Created 5 plans',
        icon: '⭐',
        unlocked: stats.totalPlans >= 5,
        requirement: 'Create 5 plans',
        progress: Math.min(stats.totalPlans, 5),
        maxProgress: 5
      },
      {
        id: 'milestone_veteran',
        title: 'Milestone Veteran',
        description: 'Completed 20 milestones',
        icon: '👑',
        unlocked: stats.completedMilestones >= 20,
        requirement: 'Complete 20 milestones',
        progress: Math.min(stats.completedMilestones, 20),
        maxProgress: 20
      },
    ];
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>Loading your progress...</div>
      </div>
    );
  }

  const currentLevel = calculateLevel(userStats);
  const totalXP = calculateTotalXP(userStats);
  const { currentXP, neededXP, progressPercentage } = calculateXPForNextLevel(userStats);
  const achievements = generateAchievements(userStats);
  const unlockedAchievements = achievements.filter(a => a.unlocked);
  const isMaxLevel = currentLevel >= MAX_LEVEL;

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <Link href="/profile" className={styles.backButton}>
          <ArrowLeftIcon size={20} />
          Back to Dashboard
        </Link>
        <h1 className={styles.title}>Level & Achievements</h1>
      </div>

      {/* Current Level Section */}
      <section className={styles.levelSection}>
        <div className={styles.levelCard}>
          <div className={styles.levelBadge}>
            <div className={styles.levelNumber}>{currentLevel}</div>
            <div className={styles.levelLabel}>Level</div>
          </div>

          <div className={styles.levelInfo}>
            <div className={styles.levelTitle}>
              {isMaxLevel ? (
                <>
                  <span className={styles.maxBadge}>MAX LEVEL REACHED!</span>
                  <span className={styles.congratsText}>🎉 You're at the top!</span>
                </>
              ) : (
                <>
                  <span>Level {currentLevel}</span>
                  <span className={styles.nextLevel}> → {currentLevel + 1}</span>
                </>
              )}
            </div>

            {!isMaxLevel && (
              <>
                <div className={styles.progressBar}>
                  <div
                    className={styles.progressFill}
                    style={{ width: `${progressPercentage}%` }}
                  />
                </div>
                <div className={styles.xpText}>
                  {currentXP} / 500 XP
                  <span className={styles.xpNeeded}>({neededXP} XP needed)</span>
                </div>
              </>
            )}

            <div className={styles.totalXP}>
              Total XP: <strong>{totalXP}</strong>
            </div>
          </div>
        </div>

        {/* XP Breakdown */}
        <div className={styles.xpBreakdown}>
          <h3>How to Earn XP</h3>
          <div className={styles.xpList}>
            <div className={styles.xpItem}>
              <span className={styles.xpIcon}>🎯</span>
              <span className={styles.xpAction}>Create a Plan</span>
              <span className={styles.xpValue}>+200 XP</span>
            </div>
            <div className={styles.xpItem}>
              <span className={styles.xpIcon}>✅</span>
              <span className={styles.xpAction}>Complete a Milestone</span>
              <span className={styles.xpValue}>+100 XP</span>
            </div>
            <div className={styles.xpItem}>
              <span className={styles.xpIcon}>💬</span>
              <span className={styles.xpAction}>Respond to a Nudge</span>
              <span className={styles.xpValue}>+25 XP</span>
            </div>
            <div className={styles.xpItem}>
              <span className={styles.xpIcon}>🔥</span>
              <span className={styles.xpAction}>Maintain Streak (per day)</span>
              <span className={styles.xpValue}>+10 XP</span>
            </div>
            <div className={styles.xpItem}>
              <span className={styles.xpIcon}>📅</span>
              <span className={styles.xpAction}>Daily Activity</span>
              <span className={styles.xpValue}>+5 XP</span>
            </div>
          </div>
        </div>
      </section>

      {/* Achievements Section */}
      <section className={styles.achievementsSection}>
        <div className={styles.achievementsHeader}>
          <h2>
            <TrophyIcon size={24} /> Achievements
          </h2>
          <div className={styles.achievementCount}>
            {unlockedAchievements.length} / {achievements.length} Unlocked
          </div>
        </div>

        <div className={styles.achievementsGrid}>
          {achievements.map((achievement) => (
            <div
              key={achievement.id}
              className={`${styles.achievementCard} ${
                achievement.unlocked ? styles.unlocked : styles.locked
              }`}
            >
              <div className={styles.achievementIcon}>{achievement.icon}</div>
              <div className={styles.achievementContent}>
                <h3 className={styles.achievementTitle}>{achievement.title}</h3>
                <p className={styles.achievementDescription}>
                  {achievement.description}
                </p>
                <div className={styles.achievementRequirement}>
                  {achievement.requirement}
                </div>

                {!achievement.unlocked && achievement.progress !== undefined && achievement.maxProgress !== undefined && (
                  <div className={styles.achievementProgress}>
                    <div className={styles.achievementProgressBar}>
                      <div
                        className={styles.achievementProgressFill}
                        style={{
                          width: `${(achievement.progress / achievement.maxProgress) * 100}%`
                        }}
                      />
                    </div>
                    <div className={styles.achievementProgressText}>
                      {achievement.progress} / {achievement.maxProgress}
                    </div>
                  </div>
                )}

                {achievement.unlocked && (
                  <div className={styles.unlockedBadge}>
                    <StarIcon size={14} /> Unlocked
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Stats Overview */}
      <section className={styles.statsSection}>
        <h2>Your Stats</h2>
        <div className={styles.statsGrid}>
          <div className={styles.statCard}>
            <div className={styles.statIcon}>🎯</div>
            <div className={styles.statValue}>{userStats.totalPlans}</div>
            <div className={styles.statLabel}>Total Plans</div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statIcon}>✅</div>
            <div className={styles.statValue}>{userStats.completedMilestones}</div>
            <div className={styles.statLabel}>Milestones Completed</div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statIcon}>💬</div>
            <div className={styles.statValue}>{userStats.totalNudgeResponses}</div>
            <div className={styles.statLabel}>Nudge Responses</div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statIcon}>🔥</div>
            <div className={styles.statValue}>{userStats.nudgeStreak}</div>
            <div className={styles.statLabel}>Current Streak</div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statIcon}>📅</div>
            <div className={styles.statValue}>{userStats.daysActive}</div>
            <div className={styles.statLabel}>Days Active</div>
          </div>
        </div>
      </section>
    </div>
  );
}
