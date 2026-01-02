"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { auth } from '../../firebase';
import { onAuthStateChanged } from 'firebase/auth';
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  Timestamp,
  doc,
  updateDoc
} from 'firebase/firestore';
import { db } from '../../firebase';
import NotificationCard from '../../Components/NotificationCard';
import { LoaderIcon, BellIcon } from '../../Components/Icons';
import styles from '../../Styles/notificationCenter.module.css';
import { EnhancedNotification } from '../../lib/notificationTracking';

type FilterType = 'all' | 'unread';

const NotificationsPage: React.FC = () => {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState<EnhancedNotification[]>([]);
  const [filter, setFilter] = useState<FilterType>('all');

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
      if (!currentUser) {
        router.push('/login');
        return;
      }
      setUser(currentUser);
    });

    return () => unsubscribeAuth();
  }, [router]);

  useEffect(() => {
    if (!user) {
      setLoading(true);
      return;
    }

    // Real-time listener for notifications
    const notificationsRef = collection(db, 'notifications');
    const q = query(
      notificationsRef,
      where('userId', '==', user.uid),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const notifList: EnhancedNotification[] = [];
      const now = Timestamp.now().toMillis();

      querySnapshot.forEach((doc) => {
        const data = doc.data() as EnhancedNotification;

        // Filter out notifications that don't have a prompt yet (pending AI processing)
        if (!data.prompt || data.prompt.trim() === '') {
          return;
        }

        // Include all non-expired notifications
        const expiresAt = data.notificationMeta?.expiresAt;
        const isExpired = expiresAt ? expiresAt.toMillis() < now : false;

        // Include both expired and non-expired (we'll show expired with visual indicator)
        notifList.push({
          ...data,
          id: doc.id
        });
      });

      setNotifications(notifList);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const markAllAsRead = async () => {
    if (!user) return;

    const unreadNotifications = notifications.filter((n) => !n.read);

    // Update all unread notifications
    const updatePromises = unreadNotifications.map((notif) => {
      if (!notif.id) return Promise.resolve();
      const notifRef = doc(db, 'notifications', notif.id);
      return updateDoc(notifRef, { read: true });
    });

    try {
      await Promise.all(updatePromises);
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  const handleNotificationClick = async (notificationId: string) => {
    // Mark as read when clicked (will happen on nudge page too, but this is for immediate feedback)
    const notifRef = doc(db, 'notifications', notificationId);
    try {
      await updateDoc(notifRef, { read: true });
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const filteredNotifications = filter === 'unread'
    ? notifications.filter((n) => !n.read)
    : notifications;

  const unreadCount = notifications.filter((n) => !n.read).length;

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <LoaderIcon size={40} className={styles.spinner} />
        <p>Loading notifications...</p>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.pageContainer}>
        {/* Header */}
        <div className={styles.header}>
          <div className={styles.titleSection}>
            <BellIcon size={28} className={styles.bellIcon} />
            <h1 className={styles.pageTitle}>Notifications</h1>
            {unreadCount > 0 && (
              <span className={styles.unreadBadge}>{unreadCount} unread</span>
            )}
          </div>

          {/* Actions */}
          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              className={styles.markAllReadBtn}
            >
              Mark all as read
            </button>
          )}
        </div>

        {/* Filter Tabs */}
        <div className={styles.filterTabs}>
          <button
            className={`${styles.filterTab} ${filter === 'all' ? styles.active : ''}`}
            onClick={() => setFilter('all')}
          >
            All ({notifications.length})
          </button>
          <button
            className={`${styles.filterTab} ${filter === 'unread' ? styles.active : ''}`}
            onClick={() => setFilter('unread')}
          >
            Unread ({unreadCount})
          </button>
        </div>

        {/* Notifications List */}
        <div className={styles.notificationsList}>
          {filteredNotifications.length === 0 ? (
            <div className={styles.emptyState}>
              <BellIcon size={64} className={styles.emptyIcon} />
              <h2 className={styles.emptyTitle}>
                {filter === 'unread'
                  ? "You're all caught up!"
                  : "No notifications yet"}
              </h2>
              <p className={styles.emptyDescription}>
                {filter === 'unread'
                  ? "All your notifications have been read. Great job staying on top of things!"
                  : "Your milestone nudges will appear here once they're created."}
              </p>
              <a href="/profile" className={styles.ctaButton}>
                View Your Goals
              </a>
            </div>
          ) : (
            filteredNotifications.map((notification) => (
              <NotificationCard
                key={notification.id}
                id={notification.id!}
                milestoneTitle={notification.milestoneTitle}
                prompt={notification.prompt}
                createdAt={notification.createdAt}
                read={notification.read}
                priority={notification.notificationMeta?.priority}
                expiresAt={notification.notificationMeta?.expiresAt}
                onClick={() => handleNotificationClick(notification.id!)}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default NotificationsPage;
