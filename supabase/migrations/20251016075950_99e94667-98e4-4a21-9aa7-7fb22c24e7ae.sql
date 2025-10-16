-- Drop the overly restrictive CHECK constraint on ai_feedback.kind
-- This was blocking 'telemetry' and 'dom_action' values from being inserted
ALTER TABLE ai_feedback DROP CONSTRAINT IF EXISTS ai_feedback_kind_check;