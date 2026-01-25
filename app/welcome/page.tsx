"use client";

import { useState } from "react";
import styles from "./welcome.module.css";

export default function WelcomePage() {
  const [currentStep, setCurrentStep] = useState(0);

  const steps = [
    {
      title: "Welcome to Stepiva! 🎯",
      subtitle: "Your AI Companion for Personal Growth",
      content: (
        <div className={styles.welcomeContent}>
          <div className={styles.hero}>
            <h2>Know yourself. Grow every day.</h2>
            <p className={styles.tagline}>
              Thank you for being an early tester! This guide will help you get
              the most out of Stepiva.
            </p>
          </div>
          <div className={styles.features}>
            <div className={styles.feature}>
              <span className={styles.icon}>🎯</span>
              <h3>AI-Powered Goal Planning</h3>
              <p>Set meaningful goals with personalized guidance</p>
            </div>
            <div className={styles.feature}>
              <span className={styles.icon}>🧠</span>
              <h3>Personality Insights</h3>
              <p>Understand yourself through Enneagram analysis</p>
            </div>
            <div className={styles.feature}>
              <span className={styles.icon}>🔔</span>
              <h3>Smart Reminders</h3>
              <p>Stay on track with AI-personalized nudges</p>
            </div>
          </div>
        </div>
      ),
    },
    {
      title: "Getting Started on Desktop 💻",
      subtitle: "Setup takes just 2 minutes",
      content: (
        <div className={styles.stepContent}>
          <div className={styles.stepList}>
            <div className={styles.stepItem}>
              <span className={styles.stepNumber}>1</span>
              <div className={styles.stepText}>
                <h3>Create Your Account</h3>
                <p>
                  Sign up with your Google account. Your data is private and
                  secure.
                </p>
              </div>
            </div>
            <div className={styles.stepItem}>
              <span className={styles.stepNumber}>2</span>
              <div className={styles.stepText}>
                <h3>Complete Your Personality Assessment</h3>
                <p>
                  Fill out our quick Enneagram-based personality form to unlock
                  personalized insights. This helps Stepiva understand your
                  motivations, strengths, and growth areas.
                </p>
              </div>
            </div>
            <div className={styles.stepItem}>
              <span className={styles.stepNumber}>3</span>
              <div className={styles.stepText}>
                <h3>Create Your First Goal</h3>
                <p>
                  Use the Goal Wizard to break down your ambitions into
                  achievable milestones. Our AI will guide you through the
                  process.
                </p>
              </div>
            </div>
            <div className={styles.stepItem}>
              <span className={styles.stepNumber}>4</span>
              <div className={styles.stepText}>
                <h3>Enable Notifications</h3>
                <p>
                  When prompted, click "Enable Notifications" to receive
                  personalized milestone reminders at your chosen frequency
                  (daily or weekly).
                </p>
                <div className={styles.notificationDemo}>
                  <img
                    src="/stepiva-favicon.svg"
                    alt="notification"
                    className={styles.notifIcon}
                  />
                  <span>Look for this banner in the bottom-right corner</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      ),
    },
    {
      title: "Getting Started on iPhone 📱",
      subtitle: "Install Stepiva as an app for the best experience",
      content: (
        <div className={styles.stepContent}>
          <div className={styles.iosInstructions}>
            <div className={styles.alert}>
              <span className={styles.alertIcon}>💡</span>
              <p>
                <strong>Important:</strong> Push notifications on iPhone require
                installing Stepiva to your home screen.
              </p>
            </div>

            <div className={styles.stepList}>
              <div className={styles.stepItem}>
                <span className={styles.stepNumber}>1</span>
                <div className={styles.stepText}>
                  <h3>Open Safari</h3>
                  <p>
                    Open <strong>Safari browser</strong> (not Chrome) and go to{" "}
                    <code>stepiva.vercel.app</code>
                  </p>
                </div>
              </div>

              <div className={styles.stepItem}>
                <span className={styles.stepNumber}>2</span>
                <div className={styles.stepText}>
                  <h3>Tap the Share Button</h3>
                  <p>
                    Tap the <strong>Share button</strong> (square with arrow
                    pointing up) at the bottom of Safari
                  </p>
                  <div className={styles.iosScreenshot}>
                    <div className={styles.shareButton}>
                      <svg
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        fill="none"
                      >
                        <path
                          d="M8 12L12 8M12 8L16 12M12 8V20M20 12V18C20 19.1046 19.1046 20 18 20H6C4.89543 20 4 19.1046 4 18V12"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                        />
                      </svg>
                    </div>
                    <p>This button is at the bottom of your screen</p>
                  </div>
                </div>
              </div>

              <div className={styles.stepItem}>
                <span className={styles.stepNumber}>3</span>
                <div className={styles.stepText}>
                  <h3>Add to Home Screen</h3>
                  <p>
                    Scroll down and tap <strong>"Add to Home Screen"</strong>
                  </p>
                  <p className={styles.hint}>
                    Then tap "Add" in the top-right corner
                  </p>
                </div>
              </div>

              <div className={styles.stepItem}>
                <span className={styles.stepNumber}>4</span>
                <div className={styles.stepText}>
                  <h3>Open from Home Screen</h3>
                  <p>
                    Close Safari and find the <strong>Stepiva icon</strong> on
                    your home screen. Tap it to launch the app.
                  </p>
                </div>
              </div>

              <div className={styles.stepItem}>
                <span className={styles.stepNumber}>5</span>
                <div className={styles.stepText}>
                  <h3>Enable Notifications</h3>
                  <p>
                    When prompted, tap <strong>"Allow"</strong> to enable push
                    notifications. You'll receive personalized reminders based
                    on your preference!
                  </p>
                </div>
              </div>
            </div>

            <div className={styles.alert} style={{ marginTop: "20px" }}>
              <span className={styles.alertIcon}>⚙️</span>
              <div>
                <p>
                  <strong>Check System Settings:</strong>
                </p>
                <p style={{ fontSize: "14px", marginTop: "8px" }}>
                  Go to iPhone Settings → Notifications → Stepiva
                  <br />
                  Make sure "Allow Notifications" is turned ON
                </p>
              </div>
            </div>
          </div>
        </div>
      ),
    },
    {
      title: "Getting Started on Android 🤖",
      subtitle: "Chrome browser works perfectly",
      content: (
        <div className={styles.stepContent}>
          <div className={styles.stepList}>
            <div className={styles.stepItem}>
              <span className={styles.stepNumber}>1</span>
              <div className={styles.stepText}>
                <h3>Open Chrome</h3>
                <p>
                  Open <strong>Chrome browser</strong> and go to{" "}
                  <code>stepiva.com</code>
                </p>
              </div>
            </div>

            <div className={styles.stepItem}>
              <span className={styles.stepNumber}>2</span>
              <div className={styles.stepText}>
                <h3>Create Your Account</h3>
                <p>Sign up and complete the onboarding process</p>
              </div>
            </div>

            <div className={styles.stepItem}>
              <span className={styles.stepNumber}>3</span>
              <div className={styles.stepText}>
                <h3>Enable Notifications</h3>
                <p>
                  When the notification banner appears, tap{" "}
                  <strong>"Enable Notifications"</strong> and then{" "}
                  <strong>"Allow"</strong> in the browser prompt.
                </p>
              </div>
            </div>

            <div className={styles.stepItem}>
              <span className={styles.stepNumber}>4</span>
              <div className={styles.stepText}>
                <h3>Optional: Install to Home Screen</h3>
                <p>
                  For a native app experience, tap the menu (⋮) →{" "}
                  <strong>"Install app"</strong> or{" "}
                  <strong>"Add to Home screen"</strong>
                </p>
              </div>
            </div>
          </div>

          <div className={styles.alert} style={{ marginTop: "20px" }}>
            <span className={styles.alertIcon}>⚙️</span>
            <div>
              <p>
                <strong>Notifications not working?</strong>
              </p>
              <p style={{ fontSize: "14px", marginTop: "8px" }}>
                Check: Settings → Apps → Chrome → Notifications
                <br />
                Make sure notifications are enabled for Chrome
              </p>
            </div>
          </div>
        </div>
      ),
    },
    {
      title: "Understanding Your Daily Nudges 🎯",
      subtitle: "AI-personalized reminders to keep you on track",
      content: (
        <div className={styles.stepContent}>
          <div className={styles.nudgeExplainer}>
            <div className={styles.timelineBox}>
              <h3>How It Works</h3>
              <div className={styles.timeline}>
                <div className={styles.timelineItem}>
                  <span className={styles.timelineDot}>1</span>
                  <div>
                    <h4>Choose Your Frequency</h4>
                    <p>
                      Set your preference: daily or weekly reminders at 7 AM UTC
                    </p>
                  </div>
                </div>
                <div className={styles.timelineItem}>
                  <span className={styles.timelineDot}>2</span>
                  <div>
                    <h4>AI Personalization</h4>
                    <p>
                      Your nudge is crafted based on your Enneagram type,
                      progress, and feedback
                    </p>
                  </div>
                </div>
                <div className={styles.timelineItem}>
                  <span className={styles.timelineDot}>3</span>
                  <div>
                    <h4>Multi-Channel Delivery</h4>
                    <p>
                      Receive via browser notification + email (coming soon:
                      WhatsApp)
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className={styles.nudgeExample}>
              <h3>Example Nudge</h3>
              <div className={styles.mockNotification}>
                <div className={styles.notifHeader}>
                  <img src="/stepiva-favicon.svg" alt="Stepiva" />
                  <span>Stepiva</span>
                  <span className={styles.time}>now</span>
                </div>
                <div className={styles.notifBody}>
                  <strong>🎯 Day 5/94 - Keep the momentum!</strong>
                  <p>
                    You're preparing for your manager lunch. Use your idealism
                    to set clear goals for the conversation...
                  </p>
                </div>
              </div>
              <p className={styles.nudgeNote}>
                Each nudge is uniquely crafted for you, considering your
                personality, timeline, and recent progress.
              </p>
            </div>
          </div>
        </div>
      ),
    },
    {
      title: "Tips for Early Testers 🚀",
      subtitle: "Help us make Stepiva better",
      content: (
        <div className={styles.stepContent}>
          <div className={styles.tipsGrid}>
            <div className={styles.tip}>
              <span className={styles.tipIcon}>💬</span>
              <h3>Share Feedback</h3>
              <p>
                After each nudge, rate it and leave comments. Your feedback
                directly improves the AI!
              </p>
            </div>

            <div className={styles.tip}>
              <span className={styles.tipIcon}>🔔</span>
              <h3>Check Your Notifications</h3>
              <p>
                Review your personalized nudges based on your chosen frequency
                (daily or weekly)
              </p>
            </div>

            <div className={styles.tip}>
              <span className={styles.tipIcon}>✍️</span>
              <h3>Update Your Progress</h3>
              <p>
                Mark milestones as complete when you achieve them. This helps
                the AI understand your pace.
              </p>
            </div>

            <div className={styles.tip}>
              <span className={styles.tipIcon}>🐛</span>
              <h3>Report Issues</h3>
              <p>
                Found a bug? Let us know! We're actively improving the
                experience.
              </p>
            </div>
          </div>

          <div className={styles.ctaBox}>
            <h3>Ready to Start Your Growth Journey?</h3>
            <p>Head to the dashboard and create your first goal!</p>
            <div className={styles.ctaButtons}>
              <a href="/dashboard" className={styles.primaryBtn}>
                Go to Dashboard
              </a>
              <a href="/goal-wizard" className={styles.secondaryBtn}>
                Create a Goal
              </a>
            </div>
          </div>
        </div>
      ),
    },
  ];

  return (
    <div className={styles.container}>
      <div className={styles.progressBar}>
        <div
          className={styles.progressFill}
          style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
        />
      </div>

      <div className={styles.content}>
        <div className={styles.header}>
          <span className={styles.stepIndicator}>
            Step {currentStep + 1} of {steps.length}
          </span>
          <h1>{steps[currentStep].title}</h1>
          <p className={styles.subtitle}>{steps[currentStep].subtitle}</p>
        </div>

        <div className={styles.mainContent}>{steps[currentStep].content}</div>

        <div className={styles.navigation}>
          {currentStep > 0 && (
            <button
              onClick={() => setCurrentStep(currentStep - 1)}
              className={styles.navBtn}
            >
              ← Previous
            </button>
          )}

          <div className={styles.dots}>
            {steps.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentStep(index)}
                className={`${styles.dot} ${index === currentStep ? styles.activeDot : ""}`}
                aria-label={`Go to step ${index + 1}`}
              />
            ))}
          </div>

          {currentStep < steps.length - 1 ? (
            <button
              onClick={() => setCurrentStep(currentStep + 1)}
              className={`${styles.navBtn} ${styles.primary}`}
            >
              Next →
            </button>
          ) : (
            <a
              href="/dashboard"
              className={`${styles.navBtn} ${styles.primary}`}
            >
              Get Started →
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
