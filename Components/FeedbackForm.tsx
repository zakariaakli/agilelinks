"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { db, auth } from "../firebase";
import { doc, updateDoc } from "firebase/firestore";
import {
  Form,
  FormGroup,
  RadioGroup,
  RadioOption,
  Textarea,
  FormButton,
  Field,
} from "./Form";
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

const feedbackOptions = [
  "I like this nudge",
  "You can do better next time",
  "I really do not relate to that",
];

export default function FeedbackForm({
  notifId,
  existingFeedback,
  planId,
  milestoneContext,
  nudgeText,
  goalType,
  enneagramData,
}: Props) {
  const [feedback, setFeedback] = useState("");
  const [note, setNote] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [toast, setToast] = useState<{
    message: string;
    type: ToastType;
  } | null>(null);
  const [showChatEntry, setShowChatEntry] = useState(false);
  const [chatbotOpen, setChatbotOpen] = useState(false);
  const [aiSummary, setAiSummary] = useState<string | null>(null);
  const router = useRouter();

  const showToast = (message: string, type: ToastType = "info") => {
    setToast({ message, type });
  };

  // Handle radio selection - show chatbot entry
  const handleFeedbackChange = (value: string) => {
    setFeedback(value);
    setShowChatEntry(true);
  };

  // Handle chatbot finish
  const handleChatbotFinish = async (
    transcript: ChatMessageData[],
    summary: string
  ) => {
    setChatbotOpen(false);
    setAiSummary(summary);
    setSubmitted(true);

    // Redirect after showing success message (5 seconds to allow viewing link)
    setTimeout(() => {
      if (planId) {
        router.push(`/profile?plan=${planId}`);
      } else {
        router.push("/profile");
      }
    }, 5000);
  };

  // Handle old-style text feedback submit (fallback)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!feedback) {
      showToast("Please select a feedback option first", "warning");
      return;
    }

    setIsLoading(true);

    try {
      console.log("Submitting feedback:", { feedback, note, notifId });

      const notificationRef = doc(db, "notifications", notifId);
      const feedbackText = note ? `${feedback} | Note: ${note}` : feedback;

      await updateDoc(notificationRef, {
        feedback: feedbackText,
        read: true,
      });

      console.log("Feedback saved successfully");
      setSubmitted(true);
    } catch (error) {
      console.error("Error submitting feedback:", error);
      showToast("An error occurred. Please try again.", "error");
    } finally {
      setIsLoading(false);
    }
  };

  // Redirect to profile after showing thank you message
  useEffect(() => {
    if (submitted) {
      const timer = setTimeout(() => {
        // Redirect with planId to auto-expand and scroll to plan
        if (planId) {
          router.push(`/profile?plan=${planId}`);
        } else {
          router.push("/profile");
        }
      }, 5000); // Wait 5 seconds before redirecting (allows time to click summary link)

      return () => clearTimeout(timer);
    }
  }, [submitted, router, planId]);

  // If feedback already exists, don't show anything (feedback will be shown in page as reflection summary)
  if (existingFeedback) {
    return null;
  }

  if (submitted) {
    return (
      <div className={styles.thankYou}>
        <div style={{ textAlign: "center", marginBottom: "1rem" }}>
          <CheckCircleIcon size={48} color="var(--color-success-500)" />
        </div>
        <h2>Thank you for your feedback!</h2>
        <p>Your response helps us improve your experience.</p>

        {aiSummary && (
          <a
            href={`/nudge/${notifId}`}
            style={{
              display: "inline-block",
              marginTop: "1.5rem",
              padding: "0.75rem 1.5rem",
              background: "var(--color-primary-500)",
              color: "white",
              borderRadius: "var(--border-radius-xl)",
              textDecoration: "none",
              fontWeight: "var(--font-weight-semibold)",
              fontSize: "var(--font-size-base)",
              transition: "var(--transition-all)",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "var(--color-primary-600)";
              e.currentTarget.style.transform = "translateY(-2px)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "var(--color-primary-500)";
              e.currentTarget.style.transform = "translateY(0)";
            }}
          >
            📝 View your reflection summary
          </a>
        )}

        <p
          style={{
            fontSize: "var(--font-size-sm)",
            color: "var(--text-secondary)",
            marginTop: "1.5rem",
          }}
        >
          {aiSummary
            ? "Redirecting to your profile in 5 seconds... or view your summary above"
            : "Redirecting to your profile in 5 seconds..."}
        </p>
      </div>
    );
  }

  // Get initial greeting based on feedback choice
  const getInitialGreeting = () => {
    if (feedback === "I like this nudge") {
      return "Hi! I'm here to help you reflect on this nudge. What about it resonated with you?";
    } else if (feedback === "You can do better next time") {
      return "Thanks for your feedback. I'd love to understand what could have been better. What didn't work for you?";
    } else {
      return "I appreciate your honesty. Let's explore why this nudge didn't connect with you. What felt off?";
    }
  };

  return (
    <div className={styles.feedbackBox}>
      <Form onSubmit={handleSubmit}>
        <Field label="How was this nudge for you?">
          <RadioGroup
            name="feedback"
            value={feedback}
            onChange={handleFeedbackChange}
          >
            {feedbackOptions.map((label) => (
              <RadioOption key={label} value={label}>
                {label}
              </RadioOption>
            ))}
          </RadioGroup>
        </Field>

        {/* Show chatbot entry instead of text field when feedback selected */}
        {feedback && !showChatEntry && (
          <Field
            label="Want to tell us more? (Optional)"
            helperText="Share any additional thoughts or suggestions..."
          >
            <Textarea
              placeholder="Your additional feedback..."
              rows={3}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              name="note"
            />
          </Field>
        )}

        {/* Chatbot Entry */}
        <ChatbotEntry
          icon="💭"
          promptText="Want to reflect on this nudge with an AI coach?"
          visible={showChatEntry}
          onExpand={() => setChatbotOpen(true)}
        />

        {/* Old-style submit button (only if not using chatbot) */}
        {feedback && !showChatEntry && (
          <FormButton
            type="button"
            onClick={handleSubmit}
            loading={isLoading}
            variant="primary"
            fullWidth
          >
            {isLoading ? "Sending..." : "Send Feedback"}
          </FormButton>
        )}
      </Form>

      {/* Reflective Chatbot */}
      <ReflectiveChatbot
        isOpen={chatbotOpen}
        onClose={() => setChatbotOpen(false)}
        onFinish={handleChatbotFinish}
        contextTitle={`Reflecting on: "${milestoneContext?.title || "Your milestone"}"`}
        contextSubtitle={`You selected: ${feedback}`}
        assistantName="AI Reflection Coach"
        assistantIcon="🤖"
        apiEndpoint="/api/chatbot/nudge-reflect"
        contextData={{
          nudgeText,
          feedbackChoice: feedback,
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
          notifId,
          planId,
        }}
        initialGreeting={getInitialGreeting()}
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
