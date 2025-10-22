-- Add Pathway preferences to user profiles (non-destructive)
ALTER TABLE public.ai_user_profiles
  ADD COLUMN IF NOT EXISTS pathway_mode text CHECK (pathway_mode IN ('auto','heavy','light')) DEFAULT 'auto',
  ADD COLUMN IF NOT EXISTS visual_pref text;

-- Add global Pathway default toggle
ALTER TABLE public.ai_control_flags
  ADD COLUMN IF NOT EXISTS pathway_heavy_default boolean DEFAULT false;

COMMENT ON COLUMN ai_user_profiles.pathway_mode IS 'User preference for action plan formatting: auto (use global default), heavy (structured pathways), light (free-form)';
COMMENT ON COLUMN ai_user_profiles.visual_pref IS 'Visual formatting preferences for plans';
COMMENT ON COLUMN ai_control_flags.pathway_heavy_default IS 'Global default for pathway_mode=auto users';