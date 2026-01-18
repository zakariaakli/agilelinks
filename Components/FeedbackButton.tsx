"use client";

import { useState, useEffect } from "react";
import { auth } from "../firebase";
import { onAuthStateChanged } from "firebase/auth";
import QuickFeedbackModal from "./QuickFeedbackModal";
import styles from "../Styles/feedbackButton.module.css";

export default function FeedbackButton() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setIsAuthenticated(!!user);
    });
    return () => unsubscribe();
  }, []);

  // Only show for authenticated users
  if (!isAuthenticated) {
    return null;
  }

  return (
    <>
      <button
        className={styles.feedbackButton}
        onClick={() => setIsModalOpen(true)}
        aria-label="Give feedback"
        title="Share your feedback"
      >
        <span className={styles.feedbackIcon}>💬</span>
        <span className={styles.feedbackText}>Feedback</span>
      </button>

      <QuickFeedbackModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </>
  );
}
