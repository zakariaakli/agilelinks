import webPush from 'web-push';
import { db } from '../firebase-admin';

// Configure web-push with VAPID details
if (process.env.VAPID_PRIVATE_KEY && process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY && process.env.VAPID_SUBJECT) {
  webPush.setVapidDetails(
    process.env.VAPID_SUBJECT,
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
  );
}

export interface PushNotificationPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  url: string;
  notificationId?: string;
  tag?: string;
}

export async function sendPushNotification(
  userId: string,
  payload: PushNotificationPayload
): Promise<boolean> {
  try {
    // Get user's push subscription from Firestore
    const subscriptionDoc = await db.collection('pushSubscriptions').doc(userId).get();

    if (!subscriptionDoc.exists) {
      console.log(`No push subscription found for user: ${userId}`);
      return false;
    }

    const subscriptionData = subscriptionDoc.data();

    if (!subscriptionData || !subscriptionData.active || !subscriptionData.subscription) {
      console.log(`Push subscription inactive or invalid for user: ${userId}`);
      return false;
    }

    const subscription = subscriptionData.subscription;

    // Validate subscription has required fields
    if (!subscription.endpoint || !subscription.keys) {
      console.log(`Invalid subscription format for user: ${userId}`);
      return false;
    }

    // Prepare notification payload
    const notificationPayload = JSON.stringify({
      title: payload.title,
      body: payload.body,
      icon: payload.icon || '/icon-192x192.png',
      badge: payload.badge || '/badge-72x72.png',
      url: payload.url,
      notificationId: payload.notificationId,
      tag: payload.tag || 'milestone-nudge',
      vibrate: [200, 100, 200],
      data: {
        url: payload.url,
        notificationId: payload.notificationId
      }
    });

    // Send push notification
    await webPush.sendNotification(subscription, notificationPayload);

    // Update lastUsed timestamp
    await db.collection('pushSubscriptions').doc(userId).update({
      lastUsed: new Date()
    });

    console.log(`✅ Push notification sent successfully to user: ${userId}`);
    return true;
  } catch (error: any) {
    console.error(`❌ Error sending push notification to user ${userId}:`, error);

    // Handle expired or invalid subscriptions
    if (error.statusCode === 410 || error.statusCode === 404) {
      console.log(`Subscription expired for user ${userId}, marking as inactive`);
      try {
        await db.collection('pushSubscriptions').doc(userId).update({
          active: false
        });
      } catch (updateError) {
        console.error('Error updating subscription status:', updateError);
      }
    }

    return false;
  }
}

export async function sendPushToMultipleUsers(
  userIds: string[],
  payload: PushNotificationPayload
): Promise<{ successful: number; failed: number }> {
  const results = await Promise.allSettled(
    userIds.map(userId => sendPushNotification(userId, payload))
  );

  const successful = results.filter(r => r.status === 'fulfilled' && r.value === true).length;
  const failed = results.length - successful;

  return { successful, failed };
}
