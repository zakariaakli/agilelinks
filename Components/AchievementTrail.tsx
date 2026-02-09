'use client';

import React from 'react';
import { Step } from '../Models/Step';
import { TrophyIcon, CheckCircleIcon } from './Icons';
import styles from '../Styles/steps.module.css';

interface AchievementTrailProps {
  steps: Step[];
  maxDisplay?: number;
}

const AchievementTrail: React.FC<AchievementTrailProps> = ({
  steps,
  maxDisplay = 5,
}) => {
  // Filter only completed steps and sort by completion date (most recent first)
  const completedSteps = steps
    .filter((s) => s.completed && s.completedAt)
    .sort((a, b) => {
      const dateA = a.completedAt instanceof Date
        ? a.completedAt
        : (a.completedAt as any)?.toDate?.() || new Date(0);
      const dateB = b.completedAt instanceof Date
        ? b.completedAt
        : (b.completedAt as any)?.toDate?.() || new Date(0);
      return dateB.getTime() - dateA.getTime();
    })
    .slice(0, maxDisplay);

  if (completedSteps.length === 0) {
    return null;
  }

  const formatCompletedDate = (date: Date | any) => {
    const completedAt = date instanceof Date
      ? date
      : date?.toDate?.() || new Date();
    const now = new Date();
    const diffDays = Math.floor(
      (now.getTime() - completedAt.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays}d ago`;
    return completedAt.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const totalCompleted = steps.filter((s) => s.completed).length;

  return (
    <div className={styles.achievementTrail}>
      <div className={styles.achievementTrailHeader}>
        <TrophyIcon size={16} className={styles.achievementTrailIcon} />
        <h4 className={styles.achievementTrailTitle}>Your Wins</h4>
        <span className={styles.achievementTrailCount}>
          {totalCompleted} completed
        </span>
      </div>

      <div className={styles.achievementTrailList}>
        {completedSteps.map((step) => (
          <div key={step.id} className={styles.achievementTrailItem}>
            <CheckCircleIcon size={14} />
            <span className={styles.achievementTrailItemText}>{step.title}</span>
            <span className={styles.achievementTrailItemDate}>
              {formatCompletedDate(step.completedAt)}
            </span>
          </div>
        ))}
      </div>

      {totalCompleted > maxDisplay && (
        <div
          className={styles.stepsEmpty}
          style={{ padding: '0.375rem', marginTop: '0.375rem' }}
        >
          +{totalCompleted - maxDisplay} more achievements
        </div>
      )}
    </div>
  );
};

export default AchievementTrail;
