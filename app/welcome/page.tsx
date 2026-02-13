"use client";

import { useState } from "react";
import styles from "./welcome.module.css";

export default function WelcomePage() {
  const [showSetup, setShowSetup] = useState(false);

  return (
    <div className={styles.container}>
      <div className={styles.content}>
        {/* HEADER */}
        <div className={styles.header}>
          <span className={styles.badge}>Early Tester Access</span>
          <h1>This takes 5 minutes.</h1>
          <p className={styles.subtitle}>
            Create 1 goal. Enable notifications. Receive your first nudge.
          </p>
          <p className={styles.notice}>
            We’re testing Stepiva with a small group this week. Your feedback
            directly shapes the product.
          </p>
        </div>

        {/* ACTIVATION CARD */}
        <div className={styles.card}>
          <h2>What you’ll do now:</h2>

          <div className={styles.step}>
            <span className={styles.stepNumber}>1</span>
            <div>
              <h3>Complete your personality profile</h3>
              <p>Unlock tailored insights based on your Enneagram type.</p>
            </div>
          </div>

          <div className={styles.step}>
            <span className={styles.stepNumber}>2</span>
            <div>
              <h3>Create one real goal</h3>
              <p>Choose something that truly matters this month.</p>
            </div>
          </div>

          <div className={styles.step}>
            <span className={styles.stepNumber}>3</span>
            <div>
              <h3>Enable notifications</h3>
              <p>
                This is essential. Stepiva works through personalized nudges.
              </p>
            </div>
          </div>

          <a href="/#test" className={styles.primaryBtn}>
            Start Now →
          </a>
        </div>

        {/* SETUP TOGGLE */}
        <div className={styles.setupToggle}>
          <button
            onClick={() => setShowSetup(!showSetup)}
            className={styles.setupButton}
          >
            {showSetup
              ? "Hide Setup Guide"
              : "Need help enabling notifications? View Setup Guide"}
          </button>
        </div>

        {/* FULL SETUP GUIDE */}
        {showSetup && (
          <div className={styles.setupCard}>
            <h2>Notification Setup Guide</h2>

            {/* DESKTOP */}
            <div className={styles.setupSection}>
              <h3>💻 Desktop</h3>
              <p>
                When prompted, click <strong>"Enable Notifications"</strong> and
                then click <strong>"Allow"</strong> in your browser.
              </p>
              <p className={styles.smallNote}>
                If blocked, check your browser address bar → Notifications →
                Allow.
              </p>
            </div>

            {/* IPHONE */}
            <div className={styles.setupSection}>
              <h3>📱 iPhone (Important)</h3>
              <p>
                iPhone requires installing Stepiva as an app to enable push
                notifications.
              </p>

              <ol>
                <li>
                  Open <strong>Safari</strong> (not Chrome).
                </li>
                <li>Go to stepiva.vercel.app</li>
                <li>
                  Tap the <strong>Share button</strong> (square with arrow up).
                </li>
                <li>
                  Scroll and tap <strong>"Add to Home Screen"</strong>.
                </li>
                <li>Open Stepiva from your home screen.</li>
                <li>
                  When prompted, tap <strong>"Allow"</strong> for notifications.
                </li>
              </ol>

              <div className={styles.highlightBox}>
                Installing as an app improves reliability and gives a native
                experience.
              </div>

              <p className={styles.smallNote}>
                If notifications do not work:
                <br />
                iPhone Settings → Notifications → Stepiva → Enable "Allow
                Notifications".
              </p>
            </div>

            {/* ANDROID */}
            <div className={styles.setupSection}>
              <h3>🤖 Android</h3>
              <ol>
                <li>Open Chrome and go to stepiva.vercel.app</li>
                <li>Sign in and complete onboarding</li>
                <li>
                  Tap <strong>"Enable Notifications"</strong> → then{" "}
                  <strong>"Allow"</strong>
                </li>
              </ol>

              <p className={styles.smallNote}>
                Optional: Chrome menu (⋮) → "Install App" for a better mobile
                experience.
              </p>
            </div>
          </div>
        )}

        {/* FEEDBACK */}
        <div className={styles.feedbackBox}>
          <h3>After testing</h3>
          <p>
            Please send me 3 short voice notes:
            <br />
            • What felt useful
            <br />
            • What felt confusing
            <br />• What you would remove
          </p>
        </div>
      </div>
    </div>
  );
}
