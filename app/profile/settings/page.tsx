"use client";
import React, { useState, useEffect } from "react";
import { onAuthStateChanged, User as FirebaseUser } from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { auth, db } from "../../../firebase";
import { useRouter } from "next/navigation";
import Toast, { ToastType } from "../../../Components/Toast";
import styles from "../../../Styles/settings.module.css";

interface CompanionSettings {
  email: string;
  emailNudgesOptIn: boolean;
}

type SettingsTab = "notifications" | "account" | "privacy";

const SettingsPage: React.FC = () => {
  const router = useRouter();
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [activeTab, setActiveTab] = useState<SettingsTab>("notifications");
  const [email, setEmail] = useState<string>("");
  const [emailNudgesOptIn, setEmailNudgesOptIn] = useState<boolean>(true);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [toast, setToast] = useState<{
    message: string;
    type: ToastType;
  } | null>(null);

  const showToast = (message: string, type: ToastType = "info") => {
    setToast({ message, type });
  };

  // Firebase auth listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setUser(user);
        await loadSettings(user.uid);
      } else {
        setUser(null);
        router.push("/login");
      }
      setIsLoading(false);
    });
    return () => unsubscribe();
  }, [router]);

  const loadSettings = async (userId: string) => {
    try {
      const settingsRef = doc(db, "companionSettings", userId);
      const settingsDoc = await getDoc(settingsRef);

      if (settingsDoc.exists()) {
        const data = settingsDoc.data() as CompanionSettings;
        setEmail(data.email || "");
        setEmailNudgesOptIn(data.emailNudgesOptIn ?? true); // Default to true
      } else {
        // If no settings exist, pre-fill email from user account and default to opt-in
        const userDoc = await getDoc(doc(db, "users", userId));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          setEmail(userData.email || userData.userEmail || "");
        }
        // Default emailNudgesOptIn to true for new users
        setEmailNudgesOptIn(true);
      }
    } catch (error) {
      console.error("Error loading settings:", error);
      showToast("Failed to load settings. Please try again.", "error");
    }
  };

  const handleSaveSettings = async () => {
    if (!user) {
      showToast("Please log in to save settings.", "error");
      return;
    }

    if (emailNudgesOptIn && !email.trim()) {
      showToast("Please provide an email address to receive notifications.", "error");
      return;
    }

    if (emailNudgesOptIn && !isValidEmail(email)) {
      showToast("Please provide a valid email address.", "error");
      return;
    }

    setIsSaving(true);

    try {
      const settingsRef = doc(db, "companionSettings", user.uid);
      await setDoc(
        settingsRef,
        {
          email: email.trim(),
          emailNudgesOptIn,
          updatedAt: new Date(),
        },
        { merge: true }
      );

      showToast("Settings saved successfully!", "success");
    } catch (error) {
      console.error("Error saving settings:", error);
      showToast("Failed to save settings. Please try again.", "error");
    } finally {
      setIsSaving(false);
    }
  };

  const isValidEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  if (isLoading) {
    return (
      <div className={styles.container}>
        <div className={styles.loadingContainer}>
          <div className={styles.spinner}></div>
          <p>Loading settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.settingsWrapper}>
        {/* Left Sidebar */}
        <aside className={styles.sidebar}>
          <div className={styles.sidebarHeader}>
            <h2>Settings</h2>
          </div>
          <nav className={styles.sidebarNav}>
            <button
              className={`${styles.navItem} ${activeTab === "notifications" ? styles.active : ""}`}
              onClick={() => setActiveTab("notifications")}
            >
              <span className={styles.navIcon}>🔔</span>
              <span>Notifications</span>
            </button>
            <button
              className={`${styles.navItem} ${styles.disabled}`}
              disabled
              title="Coming soon"
            >
              <span className={styles.navIcon}>👤</span>
              <span>Account</span>
              <span className={styles.comingSoon}>Soon</span>
            </button>
            <button
              className={`${styles.navItem} ${styles.disabled}`}
              disabled
              title="Coming soon"
            >
              <span className={styles.navIcon}>🔒</span>
              <span>Privacy</span>
              <span className={styles.comingSoon}>Soon</span>
            </button>
          </nav>
          <div className={styles.sidebarFooter}>
            <button
              onClick={() => router.push("/profile")}
              className={styles.backButton}
            >
              ← Back to Dashboard
            </button>
          </div>
        </aside>

        {/* Main Content */}
        <main className={styles.mainContent}>
          {activeTab === "notifications" && (
            <div className={styles.settingsSection}>
              <div className={styles.sectionHeader}>
                <h1 className={styles.sectionTitle}>Notification Preferences</h1>
                <p className={styles.sectionDescription}>
                  Manage how you receive milestone reminders and updates
                </p>
              </div>

              <div className={styles.settingsCard}>
                <div className={styles.settingItem}>
                  <div className={styles.settingInfo}>
                    <h3 className={styles.settingLabel}>Email Notifications</h3>
                    <p className={styles.settingHelp}>
                      Receive personalized milestone reminders via email based on your active plans
                    </p>
                  </div>
                  <label className={styles.toggle}>
                    <input
                      type="checkbox"
                      checked={emailNudgesOptIn}
                      onChange={(e) => setEmailNudgesOptIn(e.target.checked)}
                    />
                    <span className={styles.toggleSlider}></span>
                  </label>
                </div>

                {emailNudgesOptIn && (
                  <div className={styles.emailSection}>
                    <label className={styles.inputLabel}>Email Address</label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="your.email@example.com"
                      className={styles.emailInput}
                    />
                    <p className={styles.inputHelper}>
                      We'll send milestone reminders to this email address. Emails are sent
                      daily at 9:00 AM UTC based on your plan's reminder frequency.
                    </p>
                  </div>
                )}
              </div>

              <div className={styles.infoCard}>
                <h3 className={styles.infoTitle}>📧 How Email Notifications Work</h3>
                <ul className={styles.featureList}>
                  <li>
                    <strong>Personalized Reminders:</strong> Get AI-generated nudges tailored to
                    your Enneagram type and current milestones
                  </li>
                  <li>
                    <strong>Smart Timing:</strong> Emails are sent based on your plan's reminder
                    frequency (daily or weekly)
                  </li>
                  <li>
                    <strong>Blind Spot Alerts:</strong> Receive insights about potential
                    challenges specific to your personality type
                  </li>
                  <li>
                    <strong>Strength Hooks:</strong> Leverage your natural strengths to stay
                    motivated
                  </li>
                </ul>
              </div>

              <div className={styles.actionBar}>
                <button
                  onClick={handleSaveSettings}
                  disabled={isSaving}
                  className={styles.saveButton}
                >
                  {isSaving ? (
                    <>
                      <span className={styles.spinner}></span>
                      Saving...
                    </>
                  ) : (
                    "Save Changes"
                  )}
                </button>
              </div>
            </div>
          )}
        </main>
      </div>

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
};

export default SettingsPage;
