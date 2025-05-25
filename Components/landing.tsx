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
        <h1 className={styles.title}>Meet your AI Growth Companion</h1>
        <p className={styles.subtitle}>
        Turn deep personality insight into daily progress with tailored tips, reflections, and goal-nudges.
        </p>
        <button onClick={onStart} className={styles.ctaButton}>
          Get Started
        </button>
      </div>
    </section>
  );
};

export default LandingHero;