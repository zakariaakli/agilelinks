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
  await updateDoc(ref, { read: true });
  return data;
};

export async function generateStaticParams() {
  const querySnapshot = await getDocs(collection(db, 'notifications'));
  return querySnapshot.docs.map((doc) => ({ id: doc.id }));
}

export async function generateMetadata({ params }: { params: { id: string } }) {
  const nudge = await fetchNudge(params.id);

  const title = nudge?.prompt?.slice(0, 40) || 'Nudge';
  const description = 'Personal reflection powered by your Enneagram type.';

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
        <h1 className={styles.title}>Today’s Reflection</h1>
        <p className={styles.type}>{nudge.type}</p>
        <p className={styles.prompt}>{nudge.prompt}</p>

        <FeedbackForm notifId={params.id} />
      </div>
    </>
  );
};

export default NudgePage;
