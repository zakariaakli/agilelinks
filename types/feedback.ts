export type FeedbackSentiment = 'love' | 'good' | 'okay' | 'frustrated';

export interface AppFeedback {
  id?: string;
  userId: string;
  userName?: string;
  userEmail?: string;
  page: string;
  sentiment: FeedbackSentiment;
  comment?: string;
  userAgent: string;
  deviceType: 'mobile' | 'desktop';
  timestamp: Date;
  resolved?: boolean;
  adminNotes?: string;
}

export interface FeedbackFormData {
  sentiment: FeedbackSentiment;
  comment: string;
}
