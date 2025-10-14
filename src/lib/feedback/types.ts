/**
 * Feedback Types
 * 
 * Types for user feedback collection system.
 */

export type FeedbackSeverity = 'bug' | 'confusing' | 'idea' | 'other';
export type FeedbackStatus = 'new' | 'triaged' | 'closed';

export type FeedbackItem = {
  id: string;
  ts: string;                // ISO timestamp
  path: string;
  message: string;
  email?: string;
  role?: string;
  userAgent?: string;
  severity: FeedbackSeverity;
  status: FeedbackStatus;
};

export type NewFeedback = Omit<FeedbackItem, 'id' | 'ts' | 'status'> & {
  status?: FeedbackStatus;
};
