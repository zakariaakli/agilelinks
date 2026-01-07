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
      setHasUnsavedChanges(false);
    } catch (error) {
      console.error('Error finishing conversation:', error);
      showToast('Failed to save conversation. Please try again.', 'error');
    } finally {
      setIsSummarizing(false);
    }
  };

  const handleClose = () => {
    if (hasUnsavedChanges && messages.length > 1) {
      const confirmed = window.confirm(
        "Your reflection isn't saved yet. Close anyway?"
      );
      if (!confirmed) return;
    }
    onClose();
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
            <button
              onClick={handleClose}
              className={styles.chatbotCloseButton}
              aria-label="Close"
            >
              ×
            </button>
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
              <button
                onClick={handleSendMessage}
                disabled={!inputValue.trim() || isLoading || isSummarizing}
                className={styles.chatbotSendButton}
                aria-label="Send message"
              >
                {isLoading ? 'Sending...' : 'Send'}
              </button>
            </div>

            {/* Action Buttons */}
            <div className={styles.chatbotActions}>
              <button
                onClick={handleFinish}
                disabled={isSummarizing}
                className={`${styles.chatbotActionButton} ${styles.chatbotActionButtonPrimary}`}
              >
                {isSummarizing ? 'Saving...' : 'Finish & Save'}
              </button>
            </div>
          </div>
        </div>
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

  // Use portal to render at document root, bypassing any parent container constraints
  return createPortal(chatbotContent, document.body);
}
