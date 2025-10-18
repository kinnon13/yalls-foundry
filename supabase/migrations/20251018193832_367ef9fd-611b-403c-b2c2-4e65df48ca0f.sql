-- Ensure per-pin public flag exists
ALTER TABLE public.user_pins
  ADD COLUMN IF NOT EXISTS is_public boolean NOT NULL DEFAULT true;

-- Deduplicate any existing rows that would block the unique constraint
WITH ranked AS (
  SELECT ctid,
         ROW_NUMBER() OVER (
           PARTITION BY user_id, pin_type, ref_id, section
           ORDER BY sort_index NULLS LAST
         ) AS rn
  FROM public.user_pins
)
DELETE FROM public.user_pins p
USING ranked r
WHERE p.ctid = r.ctid
  AND r.rn > 1;

-- Add a unique constraint to support ON CONFLICT (user_id,pin_type,ref_id,section)
ALTER TABLE public.user_pins
  ADD CONSTRAINT user_pins_unique_user_pin UNIQUE (user_id, pin_type, ref_id, section);

-- Helpful index for reads (owner rail + public profiles)
CREATE INDEX IF NOT EXISTS idx_user_pins_public
  ON public.user_pins (user_id, pin_type, section, is_public, sort_index);
