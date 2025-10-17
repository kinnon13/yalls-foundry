/**
 * Domain Types (Task 22)
 * Production-grade type safety for billion-user scale
 */

export type ReelKind = 'post' | 'listing' | 'event';

export interface FeedRow {
  item_type: ReelKind;
  item_id: string;
  entity_id: string;
  created_at: string;
  rank: number;
  payload: Record<string, unknown>;
  next_cursor_ts: string | null;
  next_cursor_id: string | null;
}

export interface Notification {
  id: string;
  user_id: string;
  channel: 'inapp' | 'email' | 'push' | 'sms';
  kind: string;
  title: string;
  body: string | null;
  data: Record<string, unknown> | null;
  status: 'queued' | 'sent';
  created_at: string;
  read_at: string | null;
}

export interface EarningsEvent {
  id: string;
  user_id: string;
  entity_id: string | null;
  kind: 'commission' | 'referral' | 'membership' | 'tip' | 'adjustment';
  amount_cents: number;
  occurred_at: string;
  captured: boolean;
  metadata: Record<string, unknown>;
}

export interface EarningsLedger {
  user_id: string;
  total_earned_cents: number;
  total_captured_cents: number;
  pending_cents: number;
  missed_cents: number;
  updated_at: string;
}

export interface WorkerJob {
  id: string;
  job_type: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'dlq';
  attempts: number;
  max_attempts: number;
  next_run_at: string;
  payload: Record<string, unknown>;
  error: string | null;
  created_at: string;
  updated_at: string;
}

export interface DLQEntry {
  id: string;
  job_id: string;
  job_type: string;
  payload: Record<string, unknown>;
  reason: string;
  attempts: number;
  created_at: string;
}
