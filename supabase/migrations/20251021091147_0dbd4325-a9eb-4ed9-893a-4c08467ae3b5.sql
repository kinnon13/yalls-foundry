-- Enable realtime for proactive features (Phase 3)
-- This allows frontend to receive live updates for gap signals and auto-created tasks

-- Enable realtime for gap signals
ALTER PUBLICATION supabase_realtime ADD TABLE rocker_gap_signals;

-- Enable realtime for tasks (for auto-created task notifications)
ALTER PUBLICATION supabase_realtime ADD TABLE rocker_tasks;

-- Add index for faster realtime filtering
CREATE INDEX IF NOT EXISTS idx_rocker_gap_signals_user_created 
ON rocker_gap_signals(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_rocker_tasks_user_created 
ON rocker_tasks(user_id, created_at DESC);