-- Dynamic Memory & File System Enhancement
-- Allows AI to create categories, nested folders, and link everything together

-- Add dynamic category management
CREATE TABLE IF NOT EXISTS public.rocker_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  parent_id uuid REFERENCES public.rocker_categories(id) ON DELETE CASCADE,
  category_type text NOT NULL, -- 'identity', 'family', 'business', 'ai_dev', 'goal', 'project', 'calendar', 'contact', 'financial', 'vault', 'custom'
  icon text,
  color text,
  meta jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, name, parent_id)
);

-- Enhanced rocker_files with dynamic relationships
ALTER TABLE public.rocker_files 
  ADD COLUMN IF NOT EXISTS parent_file_id uuid REFERENCES public.rocker_files(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS category_id uuid REFERENCES public.rocker_categories(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS file_type text DEFAULT 'document', -- 'document', 'chat_export', 'note', 'memory', 'contact', 'financial', etc
  ADD COLUMN IF NOT EXISTS related_files uuid[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS related_messages uuid[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS visibility text DEFAULT 'personal' CHECK (visibility IN ('personal', 'team', 'public', 'ai_only')),
  ADD COLUMN IF NOT EXISTS priority text DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'critical')),
  ADD COLUMN IF NOT EXISTS meta jsonb DEFAULT '{}';

-- Link messages to files and knowledge
ALTER TABLE public.rocker_messages
  ADD COLUMN IF NOT EXISTS linked_files uuid[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS linked_knowledge uuid[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS exported_to_file_id uuid REFERENCES public.rocker_files(id) ON DELETE SET NULL;

-- Enhanced rocker_knowledge with better linking
ALTER TABLE public.rocker_knowledge
  ADD COLUMN IF NOT EXISTS file_id uuid REFERENCES public.rocker_files(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS message_id bigint REFERENCES public.rocker_messages(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS category_id uuid REFERENCES public.rocker_categories(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS chunk_summary text,
  ADD COLUMN IF NOT EXISTS keywords text[] DEFAULT '{}';

-- Enhanced rocker_long_memory with comprehensive layers
ALTER TABLE public.rocker_long_memory
  ADD COLUMN IF NOT EXISTS memory_layer text, -- 'identity', 'family', 'business', 'ai_dev', 'goal', 'project', 'calendar', 'contact', 'financial', 'vault'
  ADD COLUMN IF NOT EXISTS category_id uuid REFERENCES public.rocker_categories(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS related_memories uuid[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS related_files uuid[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS visibility text DEFAULT 'personal' CHECK (visibility IN ('personal', 'team', 'public', 'ai_only')),
  ADD COLUMN IF NOT EXISTS last_accessed timestamptz DEFAULT now();

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_rocker_categories_user ON public.rocker_categories(user_id, category_type);
CREATE INDEX IF NOT EXISTS idx_rocker_categories_parent ON public.rocker_categories(parent_id);
CREATE INDEX IF NOT EXISTS idx_rocker_files_parent ON public.rocker_files(parent_file_id);
CREATE INDEX IF NOT EXISTS idx_rocker_files_category ON public.rocker_files(category_id);
CREATE INDEX IF NOT EXISTS idx_rocker_knowledge_file ON public.rocker_knowledge(file_id);
CREATE INDEX IF NOT EXISTS idx_rocker_knowledge_message ON public.rocker_knowledge(message_id);
CREATE INDEX IF NOT EXISTS idx_rocker_memory_layer ON public.rocker_long_memory(memory_layer);
CREATE INDEX IF NOT EXISTS idx_rocker_memory_category ON public.rocker_long_memory(category_id);

-- Enable RLS on new table
ALTER TABLE public.rocker_categories ENABLE ROW LEVEL SECURITY;

-- RLS Policies for categories
CREATE POLICY "Users can manage their own categories"
  ON public.rocker_categories
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Super admins can manage all categories"
  ON public.rocker_categories
  FOR ALL
  USING (public.is_super_admin())
  WITH CHECK (public.is_super_admin());

-- Function for AI to create dynamic categories
CREATE OR REPLACE FUNCTION public.rocker_create_category(
  p_name text,
  p_category_type text,
  p_parent_id uuid DEFAULT NULL,
  p_icon text DEFAULT NULL,
  p_color text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_category_id uuid;
BEGIN
  INSERT INTO public.rocker_categories (user_id, name, parent_id, category_type, icon, color)
  VALUES (auth.uid(), p_name, p_parent_id, p_category_type, p_icon, p_color)
  ON CONFLICT (user_id, name, parent_id) DO UPDATE
    SET updated_at = now()
  RETURNING id INTO v_category_id;
  
  RETURN v_category_id;
END;
$$;

-- Function to get full category path
CREATE OR REPLACE FUNCTION public.rocker_get_category_path(p_category_id uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_path text := '';
  v_current_id uuid := p_category_id;
  v_current_name text;
  v_parent_id uuid;
BEGIN
  WHILE v_current_id IS NOT NULL LOOP
    SELECT name, parent_id INTO v_current_name, v_parent_id
    FROM public.rocker_categories
    WHERE id = v_current_id;
    
    IF v_path = '' THEN
      v_path := v_current_name;
    ELSE
      v_path := v_current_name || ' > ' || v_path;
    END IF;
    
    v_current_id := v_parent_id;
  END LOOP;
  
  RETURN v_path;
END;
$$;

-- Insert default memory layer categories for super admins
DO $$
DECLARE
  v_user_id uuid;
BEGIN
  FOR v_user_id IN 
    SELECT id FROM auth.users WHERE raw_user_meta_data->>'is_super_admin' = 'true'
  LOOP
    -- Identity Memory
    INSERT INTO public.rocker_categories (user_id, name, category_type, icon, color)
    VALUES (v_user_id, 'Identity', 'identity', '👤', '#3B82F6')
    ON CONFLICT (user_id, name, parent_id) DO NOTHING;
    
    -- Family Memory
    INSERT INTO public.rocker_categories (user_id, name, category_type, icon, color)
    VALUES (v_user_id, 'Family', 'family', '👨‍👩‍👧‍👦', '#EC4899')
    ON CONFLICT (user_id, name, parent_id) DO NOTHING;
    
    -- Business Memory
    INSERT INTO public.rocker_categories (user_id, name, category_type, icon, color)
    VALUES (v_user_id, 'Business', 'business', '💼', '#10B981')
    ON CONFLICT (user_id, name, parent_id) DO NOTHING;
    
    -- AI & Dev Memory
    INSERT INTO public.rocker_categories (user_id, name, category_type, icon, color)
    VALUES (v_user_id, 'AI & Development', 'ai_dev', '🤖', '#8B5CF6')
    ON CONFLICT (user_id, name, parent_id) DO NOTHING;
    
    -- Goals
    INSERT INTO public.rocker_categories (user_id, name, category_type, icon, color)
    VALUES (v_user_id, 'Goals', 'goal', '🎯', '#F59E0B')
    ON CONFLICT (user_id, name, parent_id) DO NOTHING;
    
    -- Projects
    INSERT INTO public.rocker_categories (user_id, name, category_type, icon, color)
    VALUES (v_user_id, 'Projects', 'project', '📋', '#06B6D4')
    ON CONFLICT (user_id, name, parent_id) DO NOTHING;
    
    -- Calendar
    INSERT INTO public.rocker_categories (user_id, name, category_type, icon, color)
    VALUES (v_user_id, 'Calendar', 'calendar', '📅', '#EF4444')
    ON CONFLICT (user_id, name, parent_id) DO NOTHING;
    
    -- Contacts
    INSERT INTO public.rocker_categories (user_id, name, category_type, icon, color)
    VALUES (v_user_id, 'Contacts', 'contact', '📇', '#14B8A6')
    ON CONFLICT (user_id, name, parent_id) DO NOTHING;
    
    -- Financial
    INSERT INTO public.rocker_categories (user_id, name, category_type, icon, color)
    VALUES (v_user_id, 'Financial', 'financial', '💰', '#22C55E')
    ON CONFLICT (user_id, name, parent_id) DO NOTHING;
    
    -- Personal Vault
    INSERT INTO public.rocker_categories (user_id, name, category_type, icon, color)
    VALUES (v_user_id, 'Personal Vault', 'vault', '🔐', '#DC2626')
    ON CONFLICT (user_id, name, parent_id) DO NOTHING;
  END LOOP;
END $$;