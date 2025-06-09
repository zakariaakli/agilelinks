import React from 'react';
import { db } from '../../../firebase';
import { doc, getDoc, getDocs, collection, updateDoc, Timestamp } from 'firebase/firestore';
import Script from 'next/script';
import styles from '../../../Styles/nudge.module.css';
import FeedbackForm from '../../../Components/FeedbackForm';
import { EnhancedNotification } from '../../../lib/notificationTracking';

interface NotificationData {
  id: string;
  userId: string;
  type: string;
  prompt: string;
  createdAt: Date | Timestamp | string;
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
  emailStatus?: {
    sent: boolean;
    sentAt?: Date | Timestamp;
    attempts: number;
    deliveryStatus?: string;
  };
  notificationMeta?: {
    priority: string;
    category: string;
    expiresAt?: Date | Timestamp;
  };
}

interface PlanData {
  id: string;
  goalType: string;
  goal: string;
  targetDate: string;
  milestones: Array<{
    id: string;
    title: string;
    completed: boolean;
    startDate: string;
    dueDate: string;
  }>;
}

const fetchNudge = async (id: string): Promise<NotificationData | null> => {
  try {
    const ref = doc(collection(db, 'notifications'), id);
    const snap = await getDoc(ref);
    if (!snap.exists()) return null;

    const data = snap.data() as EnhancedNotification;

    // Clean and normalize the data to avoid serialization issues
    const notificationData: NotificationData = {
      id,
      userId: data.userId || '',
      type: typeof data.type === 'string' ? data.type : String(data.type || ''),
      prompt: typeof data.prompt === 'string' ? data.prompt : String(data.prompt || ''),
      createdAt: data.createdAt?.toDate?.() || data.createdAt || new Date(),
      read: Boolean(data.read),
      feedback: data.feedback || null,

      // Milestone-specific fields (only if they exist)
      ...(data.planId && { planId: data.planId }),
      ...(data.milestoneId && { milestoneId: data.milestoneId }),
      ...(data.milestoneTitle && { milestoneTitle: String(data.milestoneTitle) }),
      ...(data.blindSpotTip && { blindSpotTip: String(data.blindSpotTip) }),
      ...(data.strengthHook && { strengthHook: String(data.strengthHook) }),
      ...(data.startDate && { startDate: String(data.startDate) }),
      ...(data.dueDate && { dueDate: String(data.dueDate) }),

      // Enhanced tracking fields (if they exist)
      ...(data.emailStatus && {
        emailStatus: {
          sent: Boolean(data.emailStatus.sent),
          sentAt: data.emailStatus.sentAt?.toDate?.() || data.emailStatus.sentAt,
          attempts: Number(data.emailStatus.attempts || 0),
          deliveryStatus: data.emailStatus.deliveryStatus || 'unknown'
        }
      }),
      ...(data.notificationMeta && {
        notificationMeta: {
          priority: data.notificationMeta.priority || 'low',
          category: data.notificationMeta.category || 'daily_nudge',
          expiresAt: data.notificationMeta.expiresAt?.toDate?.() || data.notificationMeta.expiresAt
        }
      })
    };

    // Mark notification as read
    await updateDoc(ref, { read: true });

    return notificationData;
  } catch (error) {
    console.error('Error fetching nudge:', error);
    return null;
  }
};

const fetchPlanData = async (planId: string): Promise<PlanData | null> => {
  try {
    const planRef = doc(collection(db, 'plans'), planId);
    const planSnap = await getDoc(planRef);
    if (!planSnap.exists()) return null;

    const planData = planSnap.data();
    return {
      id: planId,
      goalType: planData.goalType || '',
      goal: planData.goal || '',
      targetDate: planData.targetDate || '',
      milestones: planData.milestones || []
    };
  } catch (error) {
    console.error('Error fetching plan data:', error);
    return null;
  }
};

export async function generateStaticParams() {
  try {
    const querySnapshot = await getDocs(collection(db, 'notifications'));
    return querySnapshot.docs.map((doc) => ({ id: doc.id }));
  } catch (error) {
    console.error('Error generating static params:', error);
    return []; // Return empty array if there's an error
  }
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const nudge = await fetchNudge(id);

  if (!nudge) {
    return {
      title: 'Nudge Not Found',
      description: 'The requested nudge could not be found.'
    };
  }

  const isMilestoneReminder = nudge.type === 'milestone_reminder';
  const title = isMilestoneReminder
    ? `🎯 ${nudge.milestoneTitle || 'Milestone Reminder'}`
    : `✨ ${nudge.prompt?.slice(0, 40) || 'Daily Reflection'}`;

  const description = isMilestoneReminder
    ? `Milestone check-in: ${nudge.milestoneTitle || 'Keep progressing toward your goals'} - Due ${nudge.dueDate ? new Date(nudge.dueDate).toLocaleDateString() : 'soon'}`
    : `Personal Enneagram reflection: ${nudge.prompt?.slice(0, 100) || 'Discover insights about your personality'}`;

  return {
    title: `${title} - AgileLinks`,
    description,
    alternates: {
      canonical: `https://agilelinks.vercel.app/nudge/${id}`,
    },
    openGraph: {
      title,
      description,
      url: `https://agilelinks.vercel.app/nudge/${id}`,
      type: 'article',
      siteName: 'AgileLinks'
    },
    twitter: {
      card: 'summary',
      title,
      description,
    }
  };
}

const feedbackOptions = [
  'I like this nudge',
  'You can do better next time',
  'I really do not relate to that'
];

const NudgePage = async ({ params }: { params: Promise<{ id: string }> }) => {
  const { id } = await params;
  const nudge = await fetchNudge(id);

  // Fetch plan data if this is a milestone reminder
  let planData: PlanData | null = null;
  if (nudge?.planId) {
    planData = await fetchPlanData(nudge.planId);
  }

  if (!nudge) {
    return (
      <div className={styles.container}>
        <div className={styles.notFound}>
          <h1>Nudge Not Found</h1>
          <p>The requested nudge could not be found or may have expired.</p>
          <a href="/profile" className={styles.backLink}>← Back to Profile</a>
        </div>
      </div>
    );
  }

  const isMilestoneReminder = nudge.type === 'milestone_reminder';
  const isExpired = nudge.notificationMeta?.expiresAt
    ? (() => {
        const expiresAt = nudge.notificationMeta.expiresAt;
        const expirationDate = expiresAt instanceof Date
          ? expiresAt
          : typeof expiresAt === 'string'
            ? new Date(expiresAt)
            : (expiresAt as any)?.toDate?.() || new Date(expiresAt as any);
        return expirationDate < new Date();
      })()
    : false;

  // Helper function to format dates consistently
  const formatDate = (dateString: string | Date | Timestamp) => {
    try {
      let date: Date;
      if (typeof dateString === 'string') {
        date = new Date(dateString);
      } else if (dateString instanceof Date) {
        date = dateString;
      } else {
        // Handle Firestore Timestamp
        date = (dateString as any)?.toDate?.() || new Date(dateString as any);
      }

      return date.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch {
      return String(dateString);
    }
  };

  // Get time since creation for context
  const getTimeAgo = (createdAt: Date | string | Timestamp) => {
    try {
      let date: Date;
      if (typeof createdAt === 'string') {
        date = new Date(createdAt);
      } else if (createdAt instanceof Date) {
        date = createdAt;
      } else {
        // Handle Firestore Timestamp
        date = (createdAt as any)?.toDate?.() || new Date(createdAt as any);
      }

      const now = new Date();
      const diffHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));

      if (diffHours < 1) return 'Just now';
      if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
      const diffDays = Math.floor(diffHours / 24);
      return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    } catch {
      return '';
    }
  };

  return (
    <>
      <Script type="application/ld+json" id="nudge-jsonld">
        {JSON.stringify({
          "@context": "https://schema.org",
          "@type": isMilestoneReminder ? "GoalProgress" : "CreativeWork",
          "headline": isMilestoneReminder ? nudge.milestoneTitle : nudge.prompt,
          "description": nudge.prompt,
          "datePublished": new Date(nudge.createdAt instanceof Date ? nudge.createdAt : Date.now()).toISOString(),
          "mainEntityOfPage": {
            "@type": "WebPage",
            "@id": `https://agilelinks.vercel.app/nudge/${id}`,
          },
          ...(isMilestoneReminder && nudge.dueDate && {
            "targetDate": new Date(nudge.dueDate).toISOString()
          })
        })}
      </Script>

      <div className={styles.container}>
        {/* Notification metadata */}
        <div className={styles.metadata}>
          <span className={styles.timeAgo}>{getTimeAgo(nudge.createdAt)}</span>
          {nudge.notificationMeta && (
            <span className={`${styles.priority} ${styles[`priority-${nudge.notificationMeta.priority}`]}`}>
              {nudge.notificationMeta.priority.toUpperCase()}
            </span>
          )}
          {isExpired && (
            <span className={styles.expired}>EXPIRED</span>
          )}
        </div>

        {isMilestoneReminder ? (
          <>
            <h1 className={styles.title}>🎯 Milestone Check-in</h1>
            <h2 className={styles.milestoneTitle}>{nudge.milestoneTitle || 'Untitled Milestone'}</h2>

            {/* Timeline information */}
            <div className={styles.timelineInfo}>
              {nudge.startDate && (
                <div className={styles.dateInfo}>
                  <span className={styles.dateLabel}>Started:</span>
                  <span className={styles.dateValue}>{formatDate(nudge.startDate)}</span>
                </div>
              )}
              {nudge.dueDate && (
                <div className={styles.dateInfo}>
                  <span className={styles.dateLabel}>Due:</span>
                  <span className={styles.dateValue}>{formatDate(nudge.dueDate)}</span>
                </div>
              )}
            </div>

            <div className={styles.promptSection}>
              <p className={styles.prompt}>{nudge.prompt}</p>
            </div>

            {/* Personality-based insights */}
            <div className={styles.personalityInsights}>
              {nudge.blindSpotTip && (
                <div className={styles.blindSpotAlert}>
                  <div className={styles.alertHeader}>
                    <span className={styles.alertIcon}>⚠️</span>
                    <strong>Blind Spot Alert</strong>
                  </div>
                  <p className={styles.alertText}>{nudge.blindSpotTip}</p>
                </div>
              )}

              {nudge.strengthHook && (
                <div className={styles.strengthHook}>
                  <div className={styles.hookHeader}>
                    <span className={styles.hookIcon}>💪</span>
                    <strong>Leverage Your Strength</strong>
                  </div>
                  <p className={styles.hookText}>{nudge.strengthHook}</p>
                </div>
              )}
            </div>
          </>
        ) : (
          <>
            <h1 className={styles.title}>✨ Daily Reflection</h1>
            <p className={styles.enneagramType}>
              <span className={styles.typeLabel}>For:</span> {nudge.type || 'Your Personality Type'}
            </p>
            <div className={styles.promptSection}>
              <p className={styles.prompt}>{nudge.prompt}</p>
            </div>
          </>
        )}

        <FeedbackForm notifId={id} existingFeedback={nudge.feedback} />
      </div>
    </>
  );
};

export default NudgePage;