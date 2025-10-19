-- Create rocker_suggestions table for AI predictions
CREATE TABLE IF NOT EXISTS public.rocker_suggestions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    profile_id uuid,
    suggestion_type text NOT NULL,
    title text NOT NULL,
    description text NOT NULL,
    priority text DEFAULT 'medium',
    action_data jsonb DEFAULT '{}',
    confidence real DEFAULT 0.8,
    status text DEFAULT 'pending',
    created_at timestamp with time zone DEFAULT now(),
    dismissed_at timestamp with time zone,
    acted_on_at timestamp with time zone
);

-- Enable RLS on rocker_suggestions
ALTER TABLE public.rocker_suggestions ENABLE ROW LEVEL SECURITY;

-- RLS policies for suggestions
CREATE POLICY "Users can view their suggestions"
ON public.rocker_suggestions
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "System can create suggestions"
ON public.rocker_suggestions
FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Users can update their suggestions"
ON public.rocker_suggestions
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

-- Create rocker_context table for profile-aware AI
CREATE TABLE IF NOT EXISTS public.rocker_context (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    profile_id uuid,
    context_type text NOT NULL,
    context_data jsonb NOT NULL,
    relevance_score real DEFAULT 1.0,
    created_at timestamp with time zone DEFAULT now(),
    expires_at timestamp with time zone
);

-- Enable RLS
ALTER TABLE public.rocker_context ENABLE ROW LEVEL SECURITY;

-- RLS policies for context
CREATE POLICY "Users can view their context"
ON public.rocker_context
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "System can manage context"
ON public.rocker_context
FOR ALL
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_rocker_suggestions_user_status ON public.rocker_suggestions(user_id, status);
CREATE INDEX IF NOT EXISTS idx_rocker_suggestions_profile ON public.rocker_suggestions(profile_id);
CREATE INDEX IF NOT EXISTS idx_rocker_context_user_profile ON public.rocker_context(user_id, profile_id);