// ✅ FILE: /app/nudge/[id]/page.tsx
import React from 'react';
import { db } from '../../../firebase';
import { doc, getDoc, getDocs, collection, updateDoc } from 'firebase/firestore';
import Script from 'next/script';
import styles from '../../../Styles/nudge.module.css';
import FeedbackForm from '../../../Components/FeedbackForm';

const fetchNudge = async (id: string) => {
  const ref = doc(collection(db, 'notifications'), id);
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  const data = snap.data();
  
  // Clean and normalize the data to avoid serialization issues
  const cleanData = {
    ...data,
    // Convert Firestore timestamps to strings if they exist
    createdAt: data?.createdAt?.toDate?.() || data?.createdAt,
    // Ensure all string fields are actually strings
    prompt: typeof data?.prompt === 'string' ? data.prompt : String(data?.prompt || ''),
    type: typeof data?.type === 'string' ? data.type : String(data?.type || ''),
    milestoneTitle: typeof data?.milestoneTitle === 'string' ? data.milestoneTitle : String(data?.milestoneTitle || ''),
    blindSpotTip: data?.blindSpotTip ? String(data.blindSpotTip) : null,
    strengthHook: data?.strengthHook ? String(data.strengthHook) : null,
  };
  
  await updateDoc(ref, { read: true });
  return cleanData;
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

export async function generateMetadata({ params }: { params: { id: string } }) {
  const nudge = await fetchNudge(params.id);

  const title = nudge?.prompt?.slice(0, 40) || 'Nudge';
  const description = nudge?.type === 'milestone_reminder' 
    ? 'Milestone reminder to keep you on track with your goals.'
    : 'Personal reflection powered by your Enneagram type.';

  return {
    title: `${title} - Nudge Reflection`,
    description,
    alternates: {
      canonical: `https://agilelinks.vercel.app/nudge/${params.id}`,
    },
    openGraph: {
      title,
      description,
      url: `https://agilelinks.vercel.app/nudge/${params.id}`,
      type: 'article',
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

const NudgePage = async ({ params }: { params: { id: string } }) => {
  const nudge = await fetchNudge(params.id);
  if (!nudge) return <p className={styles.notFound}>Nudge not found</p>;

  const isMilestoneReminder = nudge.type === 'milestone_reminder';
  
  // Safely handle potentially undefined properties
  const safePrompt = nudge.prompt || 'No message available';
  const safeMilestoneTitle = nudge.milestoneTitle || 'Untitled Milestone';
  const safeBlindSpotTip = nudge.blindSpotTip || null;
  const safeStrengthHook = nudge.strengthHook || null;

  return (
    <>
      <Script type="application/ld+json" id="nudge-jsonld">
        {JSON.stringify({
          "@context": "https://schema.org",
          "@type": "CreativeWork",
          "headline": nudge.prompt,
          "datePublished": new Date(nudge.createdAt?.toDate?.() ?? Date.now()).toISOString(),
          "mainEntityOfPage": {
            "@type": "WebPage",
            "@id": `https://agilelinks.vercel.app/nudge/${params.id}`,
          }
        })}
      </Script>

      <div className={styles.container}>
        {isMilestoneReminder ? (
          <>
            <h1 className={styles.title}>🎯 Milestone Check-in</h1>
            <h2 className={styles.milestoneTitle}>{safeMilestoneTitle}</h2>
            {nudge.dueDate && (
              <p className={styles.dueDate}>
                Due: {(() => {
                  try {
                    return new Date(nudge.dueDate).toLocaleDateString('en-US', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    });
                  } catch (error) {
                    return nudge.dueDate; // Fallback to raw value if date parsing fails
                  }
                })()}
              </p>
            )}
            <div className={styles.promptSection}>
              <p className={styles.prompt}>{safePrompt}</p>
            </div>

            {/* Blind Spot Alert */}
            {safeBlindSpotTip && (
              <div className={styles.blindSpotAlert}>
                <div className={styles.alertHeader}>
                  <span className={styles.alertIcon}>⚠️</span>
                  <strong>Blind Spot Alert</strong>
                </div>
                <p className={styles.alertText}>{safeBlindSpotTip}</p>
              </div>
            )}

            {/* Strength Hook */}
            {safeStrengthHook && (
              <div className={styles.strengthHook}>
                <div className={styles.hookHeader}>
                  <span className={styles.hookIcon}>💪</span>
                  <strong>Leverage Your Strength</strong>
                </div>
                <p className={styles.hookText}>{safeStrengthHook}</p>
              </div>
            )}
          </>
        ) : (
          <>
            <h1 className={styles.title}>Today's Reflection</h1>
            <p className={styles.type}>{nudge.type || 'Reflection'}</p>
            <p className={styles.prompt}>{safePrompt}</p>
          </>
        )}

        <FeedbackForm notifId={params.id} />
      </div>
    </>
  );
};

export default NudgePage;