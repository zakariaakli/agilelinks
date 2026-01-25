"use client";

import React from 'react';
import Link from 'next/link';
import styles from '../Styles/levelIndicator.module.css';

interface UserStats {
  totalPlans: number;
  completedMilestones: number;
  totalMilestones: number;
  nudgeStreak: number;
  totalNudgeResponses: number;
  daysActive: number;
}

interface LevelIndicatorProps {
  userStats: UserStats;
}

const MAX_LEVEL = 10;

const LevelIndicator: React.FC<LevelIndicatorProps> = ({ userStats }) => {
  // Progressive XP requirements for each level
  const getXPRequiredForLevel = (level: number): number => {
    const xpRequirements: { [key: number]: number } = {
      1: 0,      // Starting level
      2: 50,     // Level 1 → 2
      3: 150,    // Level 2 → 3 (50 + 100)
      4: 300,    // Level 3 → 4 (150 + 150)
      5: 500,    // Level 4 → 5 (300 + 200)
      6: 800,    // Level 5 → 6 (500 + 300)
      7: 1200,   // Level 6 → 7 (800 + 400)
      8: 1700,   // Level 7 → 8 (1200 + 500)
      9: 2300,   // Level 8 → 9 (1700 + 600)
      10: 3000,  // Level 9 → 10 (2300 + 700)
    };
    return xpRequirements[level] || 3000;
  };

  // Calculate user level based on total activity
  const calculateLevel = (stats: UserStats) => {
    const totalXP =
      (stats.completedMilestones * 150) +
      (stats.totalNudgeResponses * 40) +
      (stats.nudgeStreak * 20) +
      (stats.totalPlans * 300) +
      (stats.daysActive * 10);

    for (let level = MAX_LEVEL; level >= 1; level--) {
      if (totalXP >= getXPRequiredForLevel(level)) {
        return level;
      }
    }
    return 1;
  };

  const calculateProgress = (stats: UserStats) => {
    const currentLevel = calculateLevel(stats);

    if (currentLevel >= MAX_LEVEL) {
      return 100; // Max level reached
    }

    const totalXP =
      (stats.completedMilestones * 150) +
      (stats.totalNudgeResponses * 40) +
      (stats.nudgeStreak * 20) +
      (stats.totalPlans * 300) +
      (stats.daysActive * 10);

    const xpForCurrentLevel = getXPRequiredForLevel(currentLevel);
    const xpForNextLevel = getXPRequiredForLevel(currentLevel + 1);
    const xpNeededForThisLevel = xpForNextLevel - xpForCurrentLevel;
    const currentLevelProgress = totalXP - xpForCurrentLevel;
    const progressPercentage = (currentLevelProgress / xpNeededForThisLevel) * 100;

    return Math.min(progressPercentage, 100);
  };

  const currentLevel = calculateLevel(userStats);
  const progress = calculateProgress(userStats);
  const isMaxLevel = currentLevel >= MAX_LEVEL;

  return (
    <Link href="/profile/levels" className={styles.levelIndicator}>
      <div className={styles.levelContent}>
        <span className={styles.levelText}>
          Level {currentLevel}
        </span>
        <span className={styles.maxLevel}>/ {MAX_LEVEL}</span>
      </div>
      {!isMaxLevel && (
        <div className={styles.progressBar}>
          <div
            className={styles.progressFill}
            style={{ width: `${progress}%` }}
          />
        </div>
      )}
      {isMaxLevel && (
        <span className={styles.maxBadge}>MAX</span>
      )}
    </Link>
  );
};

export default LevelIndicator;
