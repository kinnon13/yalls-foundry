-- Update role constraints to include 'knower'

-- Drop old constraints
ALTER TABLE public.rocker_conversations
  DROP CONSTRAINT IF EXISTS rocker_conversations_actor_role_check;

ALTER TABLE public.ai_user_memory
  DROP CONSTRAINT IF EXISTS ai_user_memory_scope_check;

-- Add new constraints with 'knower'
ALTER TABLE public.rocker_conversations
  ADD CONSTRAINT rocker_conversations_actor_role_check
  CHECK (actor_role IN ('user','admin','knower'));

ALTER TABLE public.ai_user_memory
  ADD CONSTRAINT ai_user_memory_scope_check
  CHECK (scope IN ('user','admin','knower'));