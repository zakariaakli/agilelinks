"use client";

import React, { useState, useEffect } from 'react';
import { auth, db } from '../../firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import styles from '../../Styles/profile.module.css';
import { EnneagramResult } from '../../Models/EnneagramResult';

const enneagramLabels = {
  enneagramType1: 'Type 1 – The Reformer',
  enneagramType2: 'Type 2 – The Helper',
  enneagramType3: 'Type 3 – The Achiever',
  enneagramType4: 'Type 4 – The Individualist',
  enneagramType5: 'Type 5 – The Investigator',
  enneagramType6: 'Type 6 – The Loyalist',
  enneagramType7: 'Type 7 – The Enthusiast',
  enneagramType8: 'Type 8 – The Challenger',
  enneagramType9: 'Type 9 – The Peacemaker',
};

const ProfilePage = () => {
  const [user, setUser] = useState<any>(null);
  const [enneagramResult, setEnneagramResult] = useState<EnneagramResult | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setUser(user);
        const userDocRef = doc(db, 'users', user.uid);
        const userDoc = await getDoc(userDocRef);
        if (userDoc.exists()) {
          const data = userDoc.data();
          setEnneagramResult(data.enneagramResult as EnneagramResult);
        }
      }
    });
    return () => unsubscribe();
  }, []);

  if (!user) return <div className={styles.loading}>Authenticating...</div>;

  return (
    <div className={styles.profileContainer}>
      <h1 className={styles.profileTitle}>Welcome back, {user.displayName}</h1>
      <p className={styles.email}>{user.email}</p>

      {enneagramResult ? (
        <div className={styles.enneagramResultContainer}>
          <h2 className={styles.sectionTitle}>Your Enneagram Scores</h2>
          <div className={styles.enneagramGrid}>
            {Object.entries(enneagramResult)
              .filter(([key]) => key.startsWith("enneagramType"))
              .map(([key, value]) => (
                <div className={styles.enneagramItem} key={key}>
                  <div className={styles.enneagramType}>
                    {enneagramLabels[key as keyof typeof enneagramLabels] || key}
                </div>

                  <div className={styles.enneagramValue}>Score: {value}</div>
                  <div className={styles.enneagramDescription}>📝 Explanation coming soon</div>
                </div>
              ))}
          </div>
          <div className={styles.summary}>
            <h3>Summary</h3>
            <p>{enneagramResult.summary}</p>
          </div>
        </div>
      ) : (
        <div className={styles.noData}>No Enneagram results found yet.</div>
      )}
    </div>
  );
};

export default ProfilePage;
