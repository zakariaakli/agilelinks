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
import { getMBTITypeInfo } from "../../Data/mbtiTypeData";
import styles from "../../Styles/personality.module.css";

const PersonalityPage = () => {
  const [user, setUser] = useState<any>(null);
  const [enneagramResult, setEnneagramResult] = useState<EnneagramResult | null>(null);
  const [mbtiType, setMbtiType] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (!currentUser) {
        router.push("/login");
      } else {
        setUser(currentUser);
        loadPersonalityData(currentUser.uid);
      }
    });

    return () => unsubscribe();
  }, [router]);

  const loadPersonalityData = async (userId: string) => {
    try {
      setLoading(true);
      const userDocRef = doc(db, "users", userId);
      const userDoc = await getDoc(userDocRef);

      if (userDoc.exists()) {
        const data = userDoc.data();
        setEnneagramResult(data?.enneagramResult as EnneagramResult);
        setMbtiType(data?.mbtiType ?? null);
      }
    } catch (error) {
      console.error("Error loading personality data:", error);
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

  const mbtiInfo = mbtiType ? getMBTITypeInfo(mbtiType) : null;
  const hasAnyPersonality = enneagramResult || mbtiType;

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

        {!hasAnyPersonality && (
          <section className={`${styles.noData} section textCenter fadeIn`}>
            <div className={styles.emptyState}>
              <span className={styles.emptyIcon}>🧠</span>
              <h2>No Personality Results Yet</h2>
              <p>
                Complete your personality profile during onboarding or from your
                dashboard to unlock personalized insights.
              </p>
            </div>
          </section>
        )}

        {enneagramResult && (
          <section className={`${styles.enneagramSection} section slideInUp`}>
            <GamifiedEnneagram enneagramResult={enneagramResult} />
          </section>
        )}

        {mbtiInfo && mbtiType && (
          <section className={`section slideInUp`} style={{ marginTop: enneagramResult ? "2rem" : 0 }}>
            <div style={{
              background: "linear-gradient(135deg, #3D7A4A 0%, #274F30 100%)",
              borderRadius: "16px",
              padding: "2rem",
              color: "white",
              boxShadow: "0 10px 25px rgba(61, 122, 74, 0.3)",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "1.25rem", flexWrap: "wrap" }}>
                <span style={{
                  background: "rgba(255,255,255,0.25)",
                  padding: "0.5rem 1.25rem",
                  borderRadius: "50px",
                  fontSize: "1.25rem",
                  fontWeight: 700,
                  backdropFilter: "blur(10px)",
                }}>
                  {mbtiType}
                </span>
                <span style={{ fontSize: "1rem", fontWeight: 600, opacity: 0.9 }}>
                  {mbtiInfo.nickname}
                </span>
              </div>

              <p style={{ fontSize: "1.05rem", lineHeight: 1.6, marginBottom: "1.5rem" }}>
                {mbtiInfo.summary}
              </p>

              <p style={{
                fontSize: "0.85rem",
                fontStyle: "italic",
                opacity: 0.85,
                background: "rgba(255,255,255,0.15)",
                padding: "0.75rem 1rem",
                borderRadius: "8px",
                marginBottom: "1.5rem",
              }}>
                {mbtiInfo.cognitiveStyle}
              </p>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem" }}>
                <div>
                  <h4 style={{
                    fontSize: "0.8rem",
                    fontWeight: 700,
                    textTransform: "uppercase",
                    letterSpacing: "0.5px",
                    marginBottom: "0.75rem",
                    background: "rgba(255, 255, 255, 0.15)",
                    padding: "0.4rem 0.75rem",
                    borderRadius: "6px",
                    borderLeft: "4px solid rgba(255, 255, 255, 0.5)",
                  }}>
                    Strengths
                  </h4>
                  <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                    {mbtiInfo.strengths.map((s, i) => (
                      <li key={i} style={{ fontSize: "0.9rem", lineHeight: 1.5, marginBottom: "0.4rem", paddingLeft: "1rem", position: "relative" }}>
                        <span style={{ position: "absolute", left: 0 }}>•</span>
                        {s}
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h4 style={{
                    fontSize: "0.8rem",
                    fontWeight: 700,
                    textTransform: "uppercase",
                    letterSpacing: "0.5px",
                    marginBottom: "0.75rem",
                    background: "rgba(255, 255, 255, 0.1)",
                    padding: "0.4rem 0.75rem",
                    borderRadius: "6px",
                    borderLeft: "4px solid rgba(255, 255, 255, 0.4)",
                  }}>
                    Growth Areas
                  </h4>
                  <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                    {mbtiInfo.growthAreas.map((g, i) => (
                      <li key={i} style={{ fontSize: "0.9rem", lineHeight: 1.5, marginBottom: "0.4rem", paddingLeft: "1rem", position: "relative" }}>
                        <span style={{ position: "absolute", left: 0 }}>•</span>
                        {g}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </section>
        )}
      </div>
      <MobileBottomNav />
    </>
  );
};

export default PersonalityPage;
