"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { auth } from '../firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { collection, query, where, onSnapshot, Timestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { BellIcon } from './Icons';
import styles from '../Styles/notificationBell.module.css';

const NotificationBell: React.FC = () => {
  const [user, setUser] = useState<any>(null);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });

    return () => unsubscribeAuth();
  }, []);

  useEffect(() => {
    if (!user) {
      setUnreadCount(0);
      return;
    }

    // Real-time listener for unread notifications
    const notificationsRef = collection(db, 'notifications');
    const q = query(
      notificationsRef,
      where('userId', '==', user.uid),
      where('read', '==', false)
    );

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      // Filter out expired notifications and notifications without AI-generated prompts
      const now = Timestamp.now().toMillis();
      const validNotifications = querySnapshot.docs.filter((doc) => {
        const data = doc.data();

        // Filter out notifications that don't have a prompt yet (pending AI processing)
        if (!data.prompt || data.prompt.trim() === '') {
          return false;
        }

        const expiresAt = data.notificationMeta?.expiresAt;

        // If no expiration, include it
        if (!expiresAt) return true;

        // Check if not expired
        return expiresAt.toMillis() > now;
      });

      setUnreadCount(validNotifications.length);
    });

    return () => unsubscribe();
  }, [user]);

  // Don't render if user is not logged in
  if (!user) {
    return null;
  }

  return (
    <Link href="/notifications" className={styles.notificationBell}>
      <div className={styles.bellContainer}>
        <BellIcon size={20} strokeWidth={2} />
        {unreadCount > 0 && (
          <span className={styles.badge}>
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </div>
    </Link>
  );
};

export default NotificationBell;
