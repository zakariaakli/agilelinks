import { Timestamp } from 'firebase/firestore';

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date | Timestamp;
}

export interface FeedbackDetails {
  chatTranscript?: ChatMessage[];
  aiSummary?: string;
  chatStartTime?: Date | Timestamp;
  chatEndTime?: Date | Timestamp;
  chatDuration?: number; // seconds
  messageCount?: number;
  wentDeeper?: boolean; // Did user click "Go Deeper"?
  contextUsed?: {
    enneagramType?: string | null;
    milestoneTitle?: string | null;
    goalType?: string | null;
  };
}

export interface Notification {
  id: string;
  prompt: string; // The nudge text
  createdAt: any;
  feedback?: string | null; // Radio button selection
  feedbackDetails?: FeedbackDetails;
  type: string;
  planId?: string;
  milestoneId?: string;
  userId: string;
  read?: boolean;
}
