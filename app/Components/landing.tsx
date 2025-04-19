"use client";

import React from "react";
import styles from "../Styles/landing.module.css";

interface LandingHeroProps {
  onStart: () => void;
}

const LandingHero: React.FC<LandingHeroProps> = ({ onStart }) => {
  return (
    <section className={styles.landingWrapper}>
      <div className={styles.innerContainer}>
        <h1 className={styles.title}>Discover your Enneagram type</h1>
        <p className={styles.subtitle}>
          Understand yourself better through intelligent coaching.
        </p>
        <button onClick={onStart} className={styles.ctaButton}>
          Get Started
        </button>
      </div>
    </section>
  );
};

export default LandingHero;