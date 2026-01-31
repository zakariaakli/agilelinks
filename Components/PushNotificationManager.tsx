"use client";

import React, { useEffect, useState } from 'react';
import { auth } from '../firebase';
import { onAuthStateChanged } from 'firebase/auth';
import styles from '../Styles/pushNotificationManager.module.css';

const PushNotificationManager: React.FC = () => {
  const [user, setUser] = useState<any>(null);
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });

    return () => unsubscribeAuth();
  }, []);

  useEffect(() => {
    if (!isMounted) return;

    if (typeof window !== 'undefined' && 'Notification' in window) {
      setPermission(Notification.permission);
    }

    // Check if user is already subscribed
    checkSubscription();
  }, [user, isMounted]);

  const checkSubscription = async () => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      return;
    }

    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      setIsSubscribed(!!subscription);
    } catch (error) {
      console.error('Error checking subscription:', error);
    }
  };

  const urlBase64ToUint8Array = (base64String: string) => {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding)
      .replace(/\-/g, '+')
      .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  };

  const subscribeToPush = async () => {
    if (!user) {
      alert('Please log in to enable notifications');
      return;
    }

    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      alert('Push notifications are not supported in your browser');
      return;
    }

    setIsLoading(true);

    try {
      // Request notification permission
      const permissionResult = await Notification.requestPermission();
      setPermission(permissionResult);

      if (permissionResult !== 'granted') {
        alert('Notification permission denied');
        setIsLoading(false);
        return;
      }

      // Register service worker
      const registration = await navigator.serviceWorker.register('/sw.js');
      await navigator.serviceWorker.ready;

      // Subscribe to push notifications
      const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      if (!vapidPublicKey) {
        throw new Error('VAPID public key not found');
      }

      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidPublicKey)
      });

      // Send subscription to backend
      const response = await fetch('/api/subscribe-push', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          userId: user.uid,
          subscription: subscription.toJSON()
        })
      });

      if (!response.ok) {
        throw new Error('Failed to save subscription');
      }

      setIsSubscribed(true);
      console.log('Successfully subscribed to push notifications');
    } catch (error) {
      console.error('Error subscribing to push notifications:', error);
      alert('Failed to enable notifications. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const unsubscribeFromPush = async () => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      return;
    }

    setIsLoading(true);

    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();

      if (subscription) {
        await subscription.unsubscribe();

        // Notify backend
        if (user) {
          await fetch('/api/unsubscribe-push', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              userId: user.uid
            })
          });
        }

        setIsSubscribed(false);
        console.log('Successfully unsubscribed from push notifications');
      }
    } catch (error) {
      console.error('Error unsubscribing from push notifications:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Don't render during SSR
  if (!isMounted) {
    return null;
  }

  // Don't render anything if notifications aren't supported
  if (typeof window === 'undefined' || !('Notification' in window) || !('serviceWorker' in navigator)) {
    return null;
  }

  // Don't render if user is not logged in
  if (!user) {
    return null;
  }

  // Only show if permission is not granted or user is not subscribed
  if (permission === 'granted' && isSubscribed) {
    return null;
  }

  return (
    <div className={styles.banner} data-push-banner="true">
      <div className={styles.header}>
        <span className={styles.icon}>🔔</span>
        <strong className={styles.title}>Get notified about your milestones</strong>
      </div>
      <p className={styles.description}>
        Never miss a milestone reminder. Enable browser notifications to stay on track with your goals.
      </p>
      <div className={styles.actions}>
        <button
          onClick={subscribeToPush}
          disabled={isLoading}
          className={styles.enableButton}
        >
          {isLoading ? 'Enabling...' : 'Enable Notifications'}
        </button>
        <button
          onClick={() => {
            // Hide the banner temporarily
            const banner = document.querySelector('[data-push-banner]') as HTMLElement;
            if (banner) banner.style.display = 'none';
          }}
          className={styles.laterButton}
        >
          Later
        </button>
      </div>
    </div>
  );
};

export default PushNotificationManager;
