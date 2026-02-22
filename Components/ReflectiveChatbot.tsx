'use client';
import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import ChatMessage from './ChatMessage';
import Toast, { ToastType } from './Toast';
import styles from '../Styles/chatbot.module.css';

export interface ChatMessageData {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface ReflectiveChatbotProps {
  // Core props
  isOpen: boolean;
  onClose: () => void;
  onFinish: (transcript: ChatMessageData[], summary: string) => void;

  // Context props (generic)
  contextTitle: string;
  contextSubtitle?: string;
  assistantName?: string;
  assistantIcon?: string;
  apiEndpoint: string;

  // Context data (passed to API)
  contextData: Record<string, any>;

  // Customization
  initialGreeting?: string;
  placeholder?: string;
}

export default function ReflectiveChatbot({
  isOpen,
  onClose,
  onFinish,
  contextTitle,
  contextSubtitle,
  assistantName = "AI Reflection Coach",
  assistantIcon = "🤖",
  apiEndpoint,
  contextData,
  initialGreeting,
  placeholder = "Type your thoughts..."
}: ReflectiveChatbotProps) {
  const [messages, setMessages] = useState<ChatMessageData[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [showExitConfirm, setShowExitConfirm] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const chatStartTime = useRef<Date | null>(null);
  const [mounted, setMounted] = useState(false);
  const scrollPositionRef = useRef(0);

  // Ensure component is mounted before using portal
  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  // Initialize with greeting
  useEffect(() => {
    if (isOpen && messages.length === 0 && initialGreeting) {
      const greeting: ChatMessageData = {
        role: 'assistant',
        content: initialGreeting,
        timestamp: new Date()
      };
      setMessages([greeting]);
      chatStartTime.current = new Date();
    }
  }, [isOpen, initialGreeting]);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Focus input when opened & prevent body scroll
  useEffect(() => {
    if (isOpen) {
      // Save current scroll position
      scrollPositionRef.current = window.scrollY;

      // Prevent background scrolling - mobile-first approach
      const scrollY = window.scrollY;
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollY}px`;
      document.body.style.width = '100%';
      document.body.style.overflow = 'hidden';

      // Focus input after animation
      setTimeout(() => inputRef.current?.focus(), 350);

      return () => {
        // Restore scrolling
        const scrollY = document.body.style.top;
        document.body.style.position = '';
        document.body.style.top = '';
        document.body.style.width = '';
        document.body.style.overflow = '';
        window.scrollTo(0, parseInt(scrollY || '0') * -1);
      };
    }
  }, [isOpen]);

  const resetChat = () => {
    setMessages([]);
    setInputValue('');
    setHasUnsavedChanges(false);
    setShowExitConfirm(false);
    chatStartTime.current = null;
  };

  const showToast = (message: string, type: ToastType = 'info') => {
    setToast({ message, type });
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMessage: ChatMessageData = {
      role: 'user',
      content: inputValue.trim(),
      timestamp: new Date()
    };

    // Add user message immediately (optimistic UI)
    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);
    setHasUnsavedChanges(true);

    try {
      // Call API with conversation history (in parallel with delay)
      const [response] = await Promise.all([
        fetch(apiEndpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            messages: [...messages, userMessage].map(msg => ({
              role: msg.role,
              content: msg.content
            })),
            context: contextData
          })
        }),
        // Simulate natural typing delay (5 seconds)
        new Promise(resolve => setTimeout(resolve, 5000))
      ]);

      if (!response.ok) {
        throw new Error('Failed to get AI response');
      }

      const data = await response.json();

      const aiMessage: ChatMessageData = {
        role: 'assistant',
        content: data.response,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, aiMessage]);

      // Focus input after AI responds
      setTimeout(() => inputRef.current?.focus(), 100);
    } catch (error) {
      console.error('Error sending message:', error);
      showToast('Failed to send message. Please try again.', 'error');

      // Remove the user message that failed
      setMessages(prev => prev.slice(0, -1));
      setInputValue(userMessage.content); // Restore input
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Auto-resize textarea
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputValue(e.target.value);

    // Auto-resize textarea
    const textarea = e.target;
    textarea.style.height = 'auto';
    textarea.style.height = Math.min(textarea.scrollHeight, 120) + 'px';
  };

  const handleFinish = async () => {
    if (messages.length === 0) {
      onClose();
      return;
    }

    setIsSummarizing(true);

    try {
      // Generate summary
      const summaryEndpoint = apiEndpoint.replace('-reflect', '-summarize');
      const response = await fetch(summaryEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transcript: messages,
          ...contextData
        })
      });

      if (!response.ok) {
        throw new Error('Failed to generate summary');
      }

      const data = await response.json();

      // Call parent's onFinish with transcript and summary
      onFinish(messages, data.summary);
      resetChat();
    } catch (error) {
      console.error('Error finishing conversation:', error);
      showToast('Failed to save conversation. Please try again.', 'error');
    } finally {
      setIsSummarizing(false);
    }
  };

  const handleClose = () => {
    if (hasUnsavedChanges && messages.length > 1) {
      setShowExitConfirm(true);
      return;
    }
    onClose();
  };

  const handleDiscardAndClose = () => {
    setShowExitConfirm(false);
    setHasUnsavedChanges(false);
    onClose();
  };

  const handleSaveAndClose = async () => {
    setShowExitConfirm(false);
    await handleFinish();
  };

  if (!isOpen || !mounted) {
    return null;
  }

  const chatbotContent = (
    <div className={styles.chatbotOverlay} role="dialog" aria-modal="true" aria-labelledby="chatbot-title">
      <div className={styles.chatbotContainer}>
        {/* Simplified Header - Centered Content */}
        <div className={styles.chatbotHeader}>
          <div className={styles.chatbotHeaderContent}>
            <div className={styles.chatbotHeaderText}>
              <h2 id="chatbot-title" className={styles.chatbotTitle}>
                {contextTitle}
              </h2>
              {contextSubtitle && (
                <p className={styles.chatbotSubtitle}>{contextSubtitle}</p>
              )}
            </div>
            <div className={styles.chatbotHeaderActions}>
              {hasUnsavedChanges && messages.length > 1 && (
                <button
                  onClick={resetChat}
                  className={styles.chatbotClearButton}
                  aria-label="New conversation"
                  title="Start a new conversation"
                >
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M13.5 3H11V2.5C11 1.67 10.33 1 9.5 1H6.5C5.67 1 5 1.67 5 2.5V3H2.5C2.22 3 2 3.22 2 3.5C2 3.78 2.22 4 2.5 4H3V13C3 13.55 3.45 14 4 14H12C12.55 14 13 13.55 13 13V4H13.5C13.78 4 14 3.78 14 3.5C14 3.22 13.78 3 13.5 3ZM6 2.5C6 2.22 6.22 2 6.5 2H9.5C9.78 2 10 2.22 10 2.5V3H6V2.5ZM12 13H4V4H12V13Z" fill="currentColor"/>
                  </svg>
                </button>
              )}
              <button
                onClick={handleClose}
                className={styles.chatbotCloseButton}
                aria-label="Close"
              >
                ×
              </button>
            </div>
          </div>
        </div>

        {/* Messages Area */}
        <div className={styles.chatbotMessages} aria-live="polite">
          <div className={styles.chatbotMessagesContent}>
            {messages.map((msg, index) => (
              <ChatMessage
                key={index}
                message={msg.content}
                isUser={msg.role === 'user'}
                timestamp={msg.timestamp}
                assistantIcon={assistantIcon}
              />
            ))}
            {isLoading && (
              <div className={styles.chatbotTypingIndicator}>
                <div className={styles.chatbotTypingDot}></div>
                <div className={styles.chatbotTypingDot}></div>
                <div className={styles.chatbotTypingDot}></div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Input Area */}
        <div className={styles.chatbotInputArea}>
          <div className={styles.chatbotInputContent}>
            {/* Text Input - Full Width */}
            <div className={styles.chatbotInputWrapper}>
              <textarea
                ref={inputRef}
                value={inputValue}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                placeholder={placeholder}
                className={styles.chatbotInput}
                disabled={isLoading || isSummarizing}
                aria-label="Type your message"
                rows={1}
              />
            </div>

            {/* Action Buttons - Stacked */}
            <div className={styles.chatbotActions}>
              {/* Send Button - Primary Action */}
              <button
                onClick={handleSendMessage}
                disabled={!inputValue.trim() || isLoading || isSummarizing}
                className={`${styles.chatbotActionButton} ${styles.chatbotActionButtonPrimary}`}
                aria-label="Send message"
              >
                {isLoading ? 'Sending...' : 'Send'}
              </button>

              {/* Finish & Save Button - Secondary/Exit Action */}
              <button
                onClick={handleFinish}
                disabled={isSummarizing}
                className={`${styles.chatbotActionButton} ${styles.chatbotActionButtonDanger}`}
              >
                {isSummarizing ? 'Saving...' : 'Finish & Save'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {showExitConfirm && (
        <div className={styles.exitConfirmOverlay}>
          <div className={styles.exitConfirmDialog}>
            <div className={styles.exitConfirmIcon}>&#x1f4dd;</div>
            <h3 className={styles.exitConfirmTitle}>Save your reflection?</h3>
            <p className={styles.exitConfirmMessage}>
              You&apos;ve shared some great thoughts. Saving helps you track your growth over time.
            </p>
            <div className={styles.exitConfirmActions}>
              <button
                onClick={handleSaveAndClose}
                className={styles.exitConfirmSave}
                disabled={isSummarizing}
              >
                {isSummarizing ? 'Saving...' : 'Save & close'}
              </button>
              <button
                onClick={handleDiscardAndClose}
                className={styles.exitConfirmDiscard}
                disabled={isSummarizing}
              >
                Close without saving
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );

  // Use portal to render at document root, bypassing any parent container constraints
  return createPortal(chatbotContent, document.body);
}
