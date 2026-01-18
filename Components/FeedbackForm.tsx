"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { auth } from "../firebase";
import { CheckCircleIcon } from "./Icons";
import Toast, { ToastType } from "./Toast";
import ChatbotEntry from "./ChatbotEntry";
import ReflectiveChatbot, { ChatMessageData } from "./ReflectiveChatbot";
import styles from "../Styles/nudge.module.css";

interface MilestoneContext {
  title: string;
  description: string;
  startDate: string;
  dueDate: string;
}

interface EnneagramData {
  type?: string;
  summary?: string;
  blindSpots?: string[];
  strengths?: string[];
}

interface Props {
  notifId: string;
  existingFeedback?: string | null;
  planId?: string;

  // Context props
  milestoneContext?: MilestoneContext;
  nudgeText: string;
  goalType?: string;

  // Enneagram props
  enneagramData?: EnneagramData;
}

export default function FeedbackForm({
  notifId,
  existingFeedback,
  planId,
  milestoneContext,
  nudgeText,
  goalType,
  enneagramData,
}: Props) {
  const [submitted, setSubmitted] = useState(false);
  const [toast, setToast] = useState<{
    message: string;
    type: ToastType;
  } | null>(null);
  const [chatbotOpen, setChatbotOpen] = useState(false);
  const [aiSummary, setAiSummary] = useState<string | null>(null);
  const [fadeOut, setFadeOut] = useState(false);
  const router = useRouter();

  // Handle chatbot finish
  const handleChatbotFinish = async (
    transcript: ChatMessageData[],
    summary: string
  ) => {
    setChatbotOpen(false);
    setAiSummary(summary);
    setSubmitted(true);
  };

  // Redirect to profile after showing thank you message with fade out
  useEffect(() => {
    if (submitted) {
      // Start fade out after 2 seconds
      const fadeTimer = setTimeout(() => {
        setFadeOut(true);
      }, 2000);

      // Redirect after fade out completes
      const redirectTimer = setTimeout(() => {
        if (planId) {
          router.push(`/profile?plan=${planId}`);
        } else {
          router.push("/profile");
        }
      }, 2800); // 2s display + 0.8s fade = 2.8s total

      return () => {
        clearTimeout(fadeTimer);
        clearTimeout(redirectTimer);
      };
    }
  }, [submitted, router, planId, setFadeOut]);

  // If feedback already exists, don't show anything (feedback will be shown in page as reflection summary)
  if (existingFeedback) {
    return null;
  }

  if (submitted) {
    return (
      <div
        className={styles.thankYou}
        style={{
          opacity: fadeOut ? 0 : 1,
          maxHeight: fadeOut ? '0' : '500px',
          overflow: 'hidden',
          transition: 'opacity 0.8s ease-out, max-height 0.8s ease-out',
        }}
      >
        <div style={{ textAlign: "center", marginBottom: "1rem" }}>
          <CheckCircleIcon size={48} color="var(--color-success-500)" />
        </div>
        <h2>Thank you for your reflection!</h2>
        <p>Your insights help you grow on your journey.</p>
      </div>
    );
  }

  return (
    <div className={styles.feedbackBox}>
      {/* Chatbot Entry - Always visible */}
      <ChatbotEntry
        icon="💭"
        promptText="Want to reflect on this nudge with an AI coach?"
        visible={true}
        onExpand={() => setChatbotOpen(true)}
        variant="inline"
      />

      {/* Reflective Chatbot */}
      <ReflectiveChatbot
        isOpen={chatbotOpen}
        onClose={() => setChatbotOpen(false)}
        onFinish={handleChatbotFinish}
        contextTitle={`Reflecting on: "${milestoneContext?.title || "Your milestone"}"`}
        contextSubtitle="Share your thoughts about this nudge"
        assistantName="AI Reflection Coach"
        assistantIcon="🤖"
        apiEndpoint="/api/chatbot/nudge-reflect"
        contextData={{
          nudgeText,
          feedbackChoice: "",
          milestoneTitle: milestoneContext?.title || "",
          milestoneDescription: milestoneContext?.description || "",
          milestoneDueDate: milestoneContext?.dueDate || "",
          milestoneStartDate: milestoneContext?.startDate || "",
          goalType: goalType || "",
          enneagramType: enneagramData?.type || "",
          enneagramSummary: enneagramData?.summary || "",
          enneagramBlindSpots: enneagramData?.blindSpots || [],
          enneagramStrengths: enneagramData?.strengths || [],
          userId: auth.currentUser?.uid || "",
          userEmail: auth.currentUser?.email || "",
          userName: auth.currentUser?.displayName || "",
          notifId,
          planId,
        }}
        initialGreeting="Hi! I'm here to help you reflect on this nudge. What are your thoughts about it?"
        placeholder="Share your thoughts..."
      />

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}
