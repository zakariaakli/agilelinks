"use client";

import React from 'react';
import Link from 'next/link';
import { Timestamp } from 'firebase/firestore';
import styles from '../Styles/notificationCard.module.css';
import { TargetIcon, ClockIcon } from './Icons';

interface NotificationCardProps {
  id: string;
  type?: 'milestone_reminder' | 'no_plan_reminder';
  milestoneTitle?: string;
  prompt: string;
  createdAt: Date | Timestamp;
  read: boolean;
  priority?: 'low' | 'medium' | 'high';
  expiresAt?: Date | Timestamp;
  onClick?: () => void;
}

const NotificationCard: React.FC<NotificationCardProps> = ({
  id,
  type = 'milestone_reminder',
  milestoneTitle,
  prompt,
  createdAt,
  read,
  priority,
  expiresAt,
  onClick
}) => {
  // Format time ago
  const getTimeAgo = (date: Date | Timestamp) => {
    try {
      const actualDate = date instanceof Date ? date : date.toDate();
      const now = new Date();
      const diffMs = now.getTime() - actualDate.getTime();
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      const diffDays = Math.floor(diffHours / 24);

      if (diffHours < 1) return 'Just now';
      if (diffHours < 24) return `${diffHours}h ago`;
      if (diffDays < 7) return `${diffDays}d ago`;
      if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;
      return `${Math.floor(diffDays / 30)}mo ago`;
    } catch {
      return '';
    }
  };

  // Check if expired
  const isExpired = expiresAt
    ? (() => {
        try {
          const expirationDate = expiresAt instanceof Date ? expiresAt : expiresAt.toDate();
          return expirationDate < new Date();
        } catch {
          return false;
        }
      })()
    : false;

  // Get preview text (first 150 characters)
  const getPreviewText = (text: string) => {
    if (!text) return 'No content available';
    const cleanText = text.replace(/[#*_`~]/g, '').trim();
    return cleanText.length > 150 ? `${cleanText.slice(0, 150)}...` : cleanText;
  };

  const isNoPlan = type === 'no_plan_reminder';
  const linkHref = isNoPlan ? '/welcome' : `/nudge/${id}`;
  const displayTitle = isNoPlan ? 'Get Started' : (milestoneTitle || 'Milestone Reminder');

  return (
    <Link
      href={linkHref}
      className={`${styles.notificationCard} ${!read ? styles.unread : ''} ${isExpired ? styles.expired : ''}`}
      onClick={onClick}
    >
      {/* Unread indicator */}
      {!read && <div className={styles.unreadDot} />}

      <div className={styles.cardContent}>
        {/* Header with milestone title and time */}
        <div className={styles.cardHeader}>
          <div className={styles.titleSection}>
            <TargetIcon size={16} className={styles.icon} />
            <h3 className={styles.milestoneTitle}>
              {displayTitle}
            </h3>
          </div>
          <div className={styles.metadata}>
            {priority === 'high' && (
              <span className={`${styles.priorityBadge} ${styles.priorityHigh}`}>
                HIGH
              </span>
            )}
            <span className={styles.timeAgo}>
              <ClockIcon size={12} className={styles.clockIcon} />
              {getTimeAgo(createdAt)}
            </span>
          </div>
        </div>

        {/* Preview text */}
        <p className={styles.preview}>{getPreviewText(prompt)}</p>

        {/* Footer with status indicators */}
        <div className={styles.cardFooter}>
          {isExpired && (
            <span className={styles.expiredBadge}>Expired</span>
          )}
        </div>
      </div>
    </Link>
  );
};

export default NotificationCard;
