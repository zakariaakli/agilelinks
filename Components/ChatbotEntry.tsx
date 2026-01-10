"use client";
import React from "react";
import styles from "../Styles/chatbot.module.css";

interface ChatbotEntryProps {
  // Customization props
  icon?: string;
  promptText?: string;
  actionText?: string;

  // Behavior props
  visible: boolean;
  onExpand: () => void;

  // Styling props
  className?: string;
  variant?: "default" | "compact" | "prominent" | "inline";
}

export default function ChatbotEntry({
  icon = "💭",
  promptText = "Want to reflect on this nudge with an AI coach?",
  actionText = "",
  visible,
  onExpand,
  className = "",
  variant = "default",
}: ChatbotEntryProps) {
  if (!visible) return null;

  return (
    <button
      onClick={onExpand}
      className={`${styles.chatbotEntry} ${styles[`chatbotEntry--${variant}`]} ${className}`}
      type="button"
      aria-label={promptText}
    >
      <div className={styles.chatbotEntryContent}>
        <span className={styles.chatbotEntryIcon}>{icon}</span>
        <span className={styles.chatbotEntryText}>{promptText}</span>
      </div>
      <span className={styles.chatbotEntryAction}>{actionText}</span>
    </button>
  );
}
