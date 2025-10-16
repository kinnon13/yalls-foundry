-- Expand memory_type enum to include all types used by the learning system
ALTER TYPE public.memory_type ADD VALUE IF NOT EXISTS 'family';
ALTER TYPE public.memory_type ADD VALUE IF NOT EXISTS 'family_member';
ALTER TYPE public.memory_type ADD VALUE IF NOT EXISTS 'personal_info';
ALTER TYPE public.memory_type ADD VALUE IF NOT EXISTS 'interest';
ALTER TYPE public.memory_type ADD VALUE IF NOT EXISTS 'hobby';
ALTER TYPE public.memory_type ADD VALUE IF NOT EXISTS 'skill';
ALTER TYPE public.memory_type ADD VALUE IF NOT EXISTS 'project';
ALTER TYPE public.memory_type ADD VALUE IF NOT EXISTS 'project_context';
ALTER TYPE public.memory_type ADD VALUE IF NOT EXISTS 'relationship';
ALTER TYPE public.memory_type ADD VALUE IF NOT EXISTS 'notification_preference';