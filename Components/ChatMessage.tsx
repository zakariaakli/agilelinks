'use client';
import React from 'react';
import styles from '../Styles/chatbot.module.css';

interface ChatMessageProps {
  message: string;
  isUser: boolean;
  timestamp?: Date;
  assistantIcon?: string;
}

export default function ChatMessage({
  message,
  isUser
}: ChatMessageProps) {
  return (
    <div className={`${styles.chatMessage} ${isUser ? styles.chatMessageUser : styles.chatMessageAssistant}`}>
      <div className={styles.chatMessageBubble}>
        <div className={styles.chatMessageContent}>{message}</div>
      </div>
    </div>
  );
}
