"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { auth } from "../firebase";
import { onAuthStateChanged } from "firebase/auth";
import ArticlesPage from "./articles/page";
import GlobalTest from "../Components/GlobalTest";
import '../Styles/homepage.css';

export default function Home() {
  const router = useRouter();
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        // User is signed in, redirect to profile
        router.push('/profile');
      } else {
        // User is not signed in, allow them to see the homepage
        setIsCheckingAuth(false);
      }
    });

    return () => unsubscribe();
  }, [router]);

  const handleStartJourney = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    setShowOnboarding(true);
    // Smooth scroll to the test section
    setTimeout(() => {
      document.getElementById('test')?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  // Show loading or nothing while checking auth
  if (isCheckingAuth) {
    return null;
  }

  return (
    <div className="containerFluid">
      {/* Hero Section with Coaching Image */}
      <section className="hero-coaching-section">
        <div className="hero-coaching-overlay"></div>
        <div className="hero-coaching-content">
          <div className="hero-text-container">
            <h1 className="hero-title fadeIn staggerDelay1">
              Master Your Mind.<br />
              <span className="hero-title-accent">Master Your Goals.</span>
            </h1>
            <p className="hero-subtitle fadeIn staggerDelay2">
              Just like a coach guides players to focus on what matters, Stepiva helps you understand yourself better through intelligent coaching and personalized growth plans to achieve your goals
            </p>
            <div className="hero-cta-container fadeIn staggerDelay3">
              <a href="#test" onClick={handleStartJourney} className="hero-cta-button">
                Start Your Journey
                <span className="hero-cta-arrow">→</span>
              </a>
              <div className="hero-trust-indicator">
                <div className="trust-stars">★★★★★</div>
                <span className="trust-text">Trusted by goal achievers</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Chat + Result Panel - Only shown when Start Your Journey is clicked */}
      {showOnboarding && (
        <section id="test" className="section slideInUp">
          <div className="container">
            <div className="flex justifyCenter">
              <div className="chatbox-area w100" style={{ maxWidth: '800px' }}>
                <GlobalTest />
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Articles Section */}
      {/* <section className="section slideInUp staggerDelay1" style={{ backgroundColor: 'var(--bg-muted)' }}>
        <div className="container">
          <h2 className="mb8 textCenter sectionTitle">Insights & Articles</h2>
          <ArticlesPage />
        </div>
      </section> */}

    </div>
  );
}