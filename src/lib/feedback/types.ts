/**
 * Feedback Types
 * 
 * Types for user feedback collection system.
 */

export type FeedbackSeverity = 'bug' | 'idea' | 'confusing' | 'other';

export type FeedbackItem = {
  id: string;
  ts: string;           // ISO timestamp
  path: string;         // window.location.pathname
  message: string;
  email?: string;
  role?: string;        // session.role if present
  userAgent?: string;
  severity: FeedbackSeverity;
  status: 'new' | 'triaged' | 'closed';
};

export type NewFeedback = {
  path: string;
  message: string;
  email?: string;
  role?: string;
  userAgent?: string;
  severity: FeedbackSeverity;
  status?: FeedbackItem['status'];
};
