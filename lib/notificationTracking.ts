import { db } from '../firebase';
import { 
  doc, 
  updateDoc, 
  Timestamp, 
  increment,
  collection, 
  query, 
  where, 
  getDocs, 
  orderBy,
  limit 
} from 'firebase/firestore';

// Enhanced notification interfaces
export interface EmailStatus {
  sent: boolean;
  sentAt?: Timestamp;
  attempts: number;
  lastAttemptAt?: Timestamp;
  deliveryStatus?: 'pending' | 'sent' | 'failed' | 'bounced' | 'delivered' | 'clicked';
  errorMessage?: string;
}

export interface NotificationMeta {
  priority: 'low' | 'medium' | 'high';
  category: 'daily_nudge' | 'weekly_milestone' | 'urgent_milestone';
  scheduledFor?: Timestamp;
  expiresAt?: Timestamp;
}

export interface EnhancedNotification {
  id?: string;
  userId: string;
  type: string | 'milestone_reminder';
  prompt: string;
  createdAt: Timestamp;
  read: boolean;
  feedback: string | null;
  
  // Milestone-specific fields
  planId?: string;
  milestoneId?: string;
  milestoneTitle?: string;
  blindSpotTip?: string;
  strengthHook?: string;
  startDate?: string;
  dueDate?: string;
  
  // Enhanced tracking fields
  emailStatus: EmailStatus;
  notificationMeta: NotificationMeta;
}

// Get unsent notifications for a user
export async function getUnsentNotifications(userId: string): Promise<EnhancedNotification[]> {
  try {
    const notifQuery = query(
      collection(db, 'notifications'),
      where('userId', '==', userId),
      where('emailStatus.sent', '==', false),
      orderBy('createdAt', 'desc'),
      limit(10) // Limit to prevent overwhelming users
    );

    const querySnapshot = await getDocs(notifQuery);
    const notifications: EnhancedNotification[] = [];

    querySnapshot.forEach((doc) => {
      notifications.push({
        id: doc.id,
        ...doc.data()
      } as EnhancedNotification);
    });

    return notifications;
  } catch (error) {
    console.error('Error fetching unsent notifications:', error);
    return [];
  }
}

// Prioritize notifications for sending
export function prioritizeNotifications(notifications: EnhancedNotification[]): EnhancedNotification[] {
  return notifications.sort((a, b) => {
    // Priority order: urgent_milestone > weekly_milestone > daily_nudge
    const priorityOrder = { 
      urgent_milestone: 3, 
      weekly_milestone: 2, 
      daily_nudge: 1 
    };
    
    const aPriority = priorityOrder[a.notificationMeta.category] || 1;
    const bPriority = priorityOrder[b.notificationMeta.category] || 1;
    
    if (aPriority !== bPriority) {
      return bPriority - aPriority;
    }
    
    // If same priority, send newer first
    return b.createdAt.toMillis() - a.createdAt.toMillis();
  });
}

// Mark notification as successfully sent
export async function markNotificationAsSent(notificationId: string): Promise<void> {
  try {
    const notificationRef = doc(db, 'notifications', notificationId);
    
    await updateDoc(notificationRef, {
      'emailStatus.sent': true,
      'emailStatus.sentAt': Timestamp.now(),
      'emailStatus.attempts': increment(1),
      'emailStatus.lastAttemptAt': Timestamp.now(),
      'emailStatus.deliveryStatus': 'sent'
    });

    console.log(`✅ Notification ${notificationId} marked as sent`);
  } catch (error) {
    console.error(`❌ Error marking notification ${notificationId} as sent:`, error);
    throw error;
  }
}

// Mark notification send as failed
export async function markNotificationSendFailed(
  notificationId: string, 
  error: Error
): Promise<void> {
  try {
    const notificationRef = doc(db, 'notifications', notificationId);
    
    await updateDoc(notificationRef, {
      'emailStatus.sent': false,
      'emailStatus.attempts': increment(1),
      'emailStatus.lastAttemptAt': Timestamp.now(),
      'emailStatus.deliveryStatus': 'failed',
      'emailStatus.errorMessage': error.message
    });

    console.log(`❌ Notification ${notificationId} marked as failed: ${error.message}`);
  } catch (updateError) {
    console.error(`❌ Error marking notification ${notificationId} as failed:`, updateError);
  }
}

// Get default email status for new notifications
export function getDefaultEmailStatus(): EmailStatus {
  return {
    sent: false,
    attempts: 0,
    deliveryStatus: 'pending'
  };
}

// Get default notification meta based on type
export function getDefaultNotificationMeta(type: string): NotificationMeta {
  if (type === 'milestone_reminder') {
    return {
      priority: 'medium',
      category: 'weekly_milestone',
      expiresAt: Timestamp.fromDate(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)) // 7 days
    };
  }
  
  // Daily nudge
  return {
    priority: 'low',
    category: 'daily_nudge',
    expiresAt: Timestamp.fromDate(new Date(Date.now() + 2 * 24 * 60 * 60 * 1000)) // 2 days
  };
}

// Check if notification has expired
export function isNotificationExpired(notification: EnhancedNotification): boolean {
  if (!notification.notificationMeta.expiresAt) {
    return false;
  }
  
  return Timestamp.now().toMillis() > notification.notificationMeta.expiresAt.toMillis();
}

// Get notification stats for analytics
export async function getNotificationStats(userId?: string) {
  try {
    let baseQuery = collection(db, 'notifications');
    
    if (userId) {
      baseQuery = query(baseQuery, where('userId', '==', userId)) as any;
    }

    const allNotifications = await getDocs(baseQuery);
    const stats = {
      total: 0,
      sent: 0,
      pending: 0,
      failed: 0,
      daily_nudges: 0,
      milestone_reminders: 0,
      read: 0,
      feedback_given: 0
    };

    allNotifications.forEach((doc) => {
      const data = doc.data();
      stats.total++;
      
      if (data.emailStatus?.sent) stats.sent++;
      else if (data.emailStatus?.deliveryStatus === 'failed') stats.failed++;
      else stats.pending++;
      
      if (data.type === 'milestone_reminder') stats.milestone_reminders++;
      else stats.daily_nudges++;
      
      if (data.read) stats.read++;
      if (data.feedback) stats.feedback_given++;
    });

    return stats;
  } catch (error) {
    console.error('Error getting notification stats:', error);
    return null;
  }
}