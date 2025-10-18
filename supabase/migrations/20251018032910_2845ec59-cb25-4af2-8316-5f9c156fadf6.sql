-- Add event_kind enum to distinguish race vs incentive events
-- Producer businesses put on both barrel races and incentive events

-- Create event_kind enum
CREATE TYPE public.event_kind AS ENUM ('race', 'incentive', 'clinic', 'sale', 'other');

-- Add kind column to events table
ALTER TABLE public.events 
ADD COLUMN IF NOT EXISTS kind public.event_kind DEFAULT 'race';

-- Add optional incentive_id link (for events that are tied to an incentive program)
ALTER TABLE public.events 
ADD COLUMN IF NOT EXISTS incentive_id UUID NULL REFERENCES public.incentives(id);

-- Add index for filtering by kind
CREATE INDEX IF NOT EXISTS idx_events_kind ON public.events(kind);

-- Add index for incentive lookups
CREATE INDEX IF NOT EXISTS idx_events_incentive_id ON public.events(incentive_id) WHERE incentive_id IS NOT NULL;

-- Backfill existing events
-- If you have logic to determine which events are incentive events, add it here
-- For now, we'll leave them as 'race' (the default)

COMMENT ON COLUMN public.events.kind IS 'Type of event: race (standard competition), incentive (incentive program event), clinic, sale, or other';
COMMENT ON COLUMN public.events.incentive_id IS 'Optional link to incentive program if this event is part of an incentive';
