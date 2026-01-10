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
  // Calculate user level based on total activity
  const calculateLevel = (stats: UserStats) => {
    const totalXP =
      (stats.completedMilestones * 100) +
      (stats.totalNudgeResponses * 25) +
      (stats.nudgeStreak * 10) +
      (stats.totalPlans * 200) +
      (stats.daysActive * 5);

    return Math.min(Math.floor(totalXP / 500) + 1, MAX_LEVEL); // Level up every 500 XP, max level 10
  };

  const calculateProgress = (stats: UserStats) => {
    const currentLevel = calculateLevel(stats);

    if (currentLevel >= MAX_LEVEL) {
      return 100; // Max level reached
    }

    const totalXP =
      (stats.completedMilestones * 100) +
      (stats.totalNudgeResponses * 25) +
      (stats.nudgeStreak * 10) +
      (stats.totalPlans * 200) +
      (stats.daysActive * 5);

    const xpForCurrentLevel = (currentLevel - 1) * 500;
    const currentLevelProgress = totalXP - xpForCurrentLevel;
    const progressPercentage = (currentLevelProgress / 500) * 100;

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
