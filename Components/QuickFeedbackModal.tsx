"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { auth } from "../firebase";
import { FeedbackSentiment } from "../types/feedback";
import Toast, { ToastType } from "./Toast";
import styles from "../Styles/quickFeedbackModal.module.css";

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

interface SentimentOption {
  value: FeedbackSentiment;
  emoji: string;
  label: string;
  color: string;
}

const sentimentOptions: SentimentOption[] = [
  { value: 'love', emoji: '😍', label: 'Love it', color: '#10B981' },
  { value: 'good', emoji: '😊', label: 'Good', color: '#3B82F6' },
  { value: 'okay', emoji: '😐', label: 'Okay', color: '#F59E0B' },
  { value: 'frustrated', emoji: '😞', label: 'Frustrated', color: '#EF4444' },
];

export default function QuickFeedbackModal({ isOpen, onClose }: Props) {
  const [selectedSentiment, setSelectedSentiment] = useState<FeedbackSentiment | null>(null);
  const [comment, setComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);
  const pathname = usePathname();

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedSentiment) {
      setToast({ message: "Please select how you're feeling", type: "warning" });
      return;
    }

    if (!auth.currentUser) {
      setToast({ message: "You must be logged in to submit feedback", type: "error" });
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/feedback", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          sentiment: selectedSentiment,
          comment: comment.trim(),
          page: pathname || "/",
          userId: auth.currentUser.uid,
          userName: auth.currentUser.displayName || null,
          userEmail: auth.currentUser.email || null,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to submit feedback");
      }

      setToast({ message: "Thank you for your feedback! 🙏", type: "success" });

      // Reset and close after short delay
      setTimeout(() => {
        setSelectedSentiment(null);
        setComment("");
        onClose();
      }, 1500);
    } catch (error) {
      console.error("Error submitting feedback:", error);
      setToast({ message: "Failed to submit feedback. Please try again.", type: "error" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      setSelectedSentiment(null);
      setComment("");
      onClose();
    }
  };

  return (
    <>
      <div className={styles.overlay} onClick={handleClose} />

      <div className={styles.modal}>
        <div className={styles.modalHeader}>
          <h3 className={styles.modalTitle}>How's your experience?</h3>
          <button
            className={styles.closeButton}
            onClick={handleClose}
            aria-label="Close"
            disabled={isSubmitting}
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className={styles.modalContent}>
          <div className={styles.sentimentGrid}>
            {sentimentOptions.map((option) => (
              <button
                key={option.value}
                type="button"
                className={`${styles.sentimentButton} ${
                  selectedSentiment === option.value ? styles.selected : ''
                }`}
                onClick={() => setSelectedSentiment(option.value)}
                disabled={isSubmitting}
                style={{
                  borderColor: selectedSentiment === option.value ? option.color : 'transparent',
                }}
              >
                <span className={styles.sentimentEmoji}>{option.emoji}</span>
                <span className={styles.sentimentLabel}>{option.label}</span>
              </button>
            ))}
          </div>

          <div className={styles.commentSection}>
            <label htmlFor="feedback-comment" className={styles.commentLabel}>
              Tell us more... (optional)
            </label>
            <textarea
              id="feedback-comment"
              className={styles.commentTextarea}
              placeholder="What's on your mind?"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={4}
              maxLength={500}
              disabled={isSubmitting}
            />
            <div className={styles.charCount}>
              {comment.length}/500
            </div>
          </div>

          <button
            type="submit"
            className={styles.submitButton}
            disabled={!selectedSentiment || isSubmitting}
          >
            {isSubmitting ? (
              <>
                <span className={styles.spinner} />
                Sending...
              </>
            ) : (
              'Send Feedback'
            )}
          </button>
        </form>
      </div>

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </>
  );
}
