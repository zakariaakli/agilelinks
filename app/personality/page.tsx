"use client";

import React, { useState, useEffect } from "react";
import { auth, db } from "../../firebase";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { useRouter } from "next/navigation";
import Header from "../../Components/Header";
import MobileBottomNav from "../../Components/MobileBottomNav";
import GamifiedEnneagram from "../../Components/GamifiedEnneagram";
import { EnneagramResult } from "../../Models/EnneagramResult";
import styles from "../../Styles/personality.module.css";

const PersonalityPage = () => {
  const [user, setUser] = useState<any>(null);
  const [enneagramResult, setEnneagramResult] = useState<EnneagramResult | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (!currentUser) {
        router.push("/login");
      } else {
        setUser(currentUser);
        loadEnneagramData(currentUser.uid);
      }
    });

    return () => unsubscribe();
  }, [router]);

  const loadEnneagramData = async (userId: string) => {
    try {
      setLoading(true);
      const userDocRef = doc(db, "users", userId);
      const userDoc = await getDoc(userDocRef);

      if (userDoc.exists()) {
        const data = userDoc.data();
        setEnneagramResult(data?.enneagramResult as EnneagramResult);
      }
    } catch (error) {
      console.error("Error loading enneagram data:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <>
        <Header />
        <div className={styles.container}>
          <div className={styles.loadingContainer}>
            <div className={styles.loader}></div>
            <p>Loading your personality insights...</p>
          </div>
        </div>
        <MobileBottomNav />
      </>
    );
  }

  return (
    <>
      <Header />
      <div className={styles.container}>
        <div className={styles.header}>
          <h1 className={styles.title}>Your Personality Insights</h1>
          <p className={styles.subtitle}>
            Discover your strengths, blind spots, and growth opportunities
          </p>
        </div>

        {enneagramResult ? (
          <section className={`${styles.enneagramSection} section slideInUp`}>
            <GamifiedEnneagram enneagramResult={enneagramResult} />
          </section>
        ) : (
          <section className={`${styles.noData} section textCenter fadeIn`}>
            <div className={styles.emptyState}>
              <span className={styles.emptyIcon}>🧠</span>
              <h2>No Personality Results Yet</h2>
              <p>
                Complete the Enneagram assessment during goal creation to unlock
                your personalized personality insights.
              </p>
            </div>
          </section>
        )}
      </div>
      <MobileBottomNav />
    </>
  );
};

export default PersonalityPage;
