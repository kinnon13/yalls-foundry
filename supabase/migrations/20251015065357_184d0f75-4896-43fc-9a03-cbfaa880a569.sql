-- Create calendar system tables
-- Enums
CREATE TYPE calendar_type AS ENUM ('personal', 'business', 'horse', 'event', 'custom');
CREATE TYPE calendar_role AS ENUM ('owner', 'writer', 'reader');
CREATE TYPE event_visibility AS ENUM ('public', 'private', 'busy');
CREATE TYPE recurrence_freq AS ENUM ('daily', 'weekly', 'monthly', 'yearly');

-- Calendars table
CREATE TABLE calendars (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_profile_id uuid NOT NULL,
  name text NOT NULL,
  calendar_type calendar_type NOT NULL DEFAULT 'personal',
  description text,
  color text,
  timezone text DEFAULT 'UTC',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_calendars_owner ON calendars(owner_profile_id);

-- Calendar sharing
CREATE TABLE calendar_shares (
  calendar_id uuid NOT NULL REFERENCES calendars(id) ON DELETE CASCADE,
  profile_id uuid NOT NULL,
  role calendar_role NOT NULL DEFAULT 'reader',
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (calendar_id, profile_id)
);

-- Calendar collections (master calendars)
CREATE TABLE calendar_collections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_profile_id uuid NOT NULL,
  name text NOT NULL,
  description text,
  color text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Collection members
CREATE TABLE calendar_collection_members (
  collection_id uuid NOT NULL REFERENCES calendar_collections(id) ON DELETE CASCADE,
  calendar_id uuid NOT NULL REFERENCES calendars(id) ON DELETE CASCADE,
  PRIMARY KEY (collection_id, calendar_id)
);

-- Collection sharing
CREATE TABLE calendar_collection_shares (
  collection_id uuid NOT NULL REFERENCES calendar_collections(id) ON DELETE CASCADE,
  profile_id uuid NOT NULL,
  role calendar_role NOT NULL DEFAULT 'reader',
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (collection_id, profile_id)
);

-- Calendar events
CREATE TABLE calendar_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  calendar_id uuid NOT NULL REFERENCES calendars(id) ON DELETE CASCADE,
  created_by uuid NOT NULL,
  title text NOT NULL,
  description text,
  location text,
  starts_at timestamptz NOT NULL,
  ends_at timestamptz NOT NULL,
  all_day boolean DEFAULT false,
  visibility event_visibility NOT NULL DEFAULT 'private',
  event_type text,
  recurrence_rule text,
  recurrence_freq recurrence_freq,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_events_calendar ON calendar_events(calendar_id);
CREATE INDEX idx_events_time_range ON calendar_events(starts_at, ends_at);

-- Event attendees
CREATE TABLE calendar_event_attendees (
  event_id uuid NOT NULL REFERENCES calendar_events(id) ON DELETE CASCADE,
  profile_id uuid NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  response_at timestamptz,
  PRIMARY KEY (event_id, profile_id)
);

-- Event reminders
CREATE TABLE calendar_event_reminders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES calendar_events(id) ON DELETE CASCADE,
  profile_id uuid NOT NULL,
  trigger_at timestamptz NOT NULL,
  sent_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_reminders_trigger ON calendar_event_reminders(trigger_at) WHERE sent_at IS NULL;

-- Helper function to check calendar access
CREATE OR REPLACE FUNCTION has_calendar_access(cal_id uuid, user_id uuid, min_role calendar_role DEFAULT 'reader')
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM calendars c
    WHERE c.id = cal_id
    AND (
      c.owner_profile_id = user_id
      OR EXISTS (
        SELECT 1 FROM calendar_shares cs
        WHERE cs.calendar_id = cal_id
        AND cs.profile_id = user_id
        AND (
          (min_role = 'reader') OR
          (min_role = 'writer' AND cs.role IN ('writer', 'owner')) OR
          (min_role = 'owner' AND cs.role = 'owner')
        )
      )
    )
  );
END;
$$;

-- Helper function to check collection access
CREATE OR REPLACE FUNCTION has_collection_access(coll_id uuid, user_id uuid, min_role calendar_role DEFAULT 'reader')
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM calendar_collections cc
    WHERE cc.id = coll_id
    AND (
      cc.owner_profile_id = user_id
      OR EXISTS (
        SELECT 1 FROM calendar_collection_shares ccs
        WHERE ccs.collection_id = coll_id
        AND ccs.profile_id = user_id
        AND (
          (min_role = 'reader') OR
          (min_role = 'writer' AND ccs.role IN ('writer', 'owner')) OR
          (min_role = 'owner' AND ccs.role = 'owner')
        )
      )
    )
  );
END;
$$;

-- Enable RLS
ALTER TABLE calendars ENABLE ROW LEVEL SECURITY;
ALTER TABLE calendar_shares ENABLE ROW LEVEL SECURITY;
ALTER TABLE calendar_collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE calendar_collection_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE calendar_collection_shares ENABLE ROW LEVEL SECURITY;
ALTER TABLE calendar_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE calendar_event_attendees ENABLE ROW LEVEL SECURITY;
ALTER TABLE calendar_event_reminders ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view calendars they have access to"
ON calendars FOR SELECT
USING (has_calendar_access(id, auth.uid(), 'reader'));

CREATE POLICY "Users can create their own calendars"
ON calendars FOR INSERT
WITH CHECK (owner_profile_id = auth.uid());

CREATE POLICY "Calendar owners can update"
ON calendars FOR UPDATE
USING (has_calendar_access(id, auth.uid(), 'owner'));

CREATE POLICY "Calendar owners can delete"
ON calendars FOR DELETE
USING (has_calendar_access(id, auth.uid(), 'owner'));

CREATE POLICY "Users can view shares for their calendars"
ON calendar_shares FOR SELECT
USING (EXISTS (SELECT 1 FROM calendars c WHERE c.id = calendar_id AND has_calendar_access(c.id, auth.uid(), 'reader')));

CREATE POLICY "Calendar owners can manage shares"
ON calendar_shares FOR ALL
USING (EXISTS (SELECT 1 FROM calendars c WHERE c.id = calendar_id AND has_calendar_access(c.id, auth.uid(), 'owner')));

CREATE POLICY "Users can view their collections"
ON calendar_collections FOR SELECT
USING (has_collection_access(id, auth.uid(), 'reader'));

CREATE POLICY "Users can create collections"
ON calendar_collections FOR INSERT
WITH CHECK (owner_profile_id = auth.uid());

CREATE POLICY "Collection owners can update"
ON calendar_collections FOR UPDATE
USING (has_collection_access(id, auth.uid(), 'owner'));

CREATE POLICY "Collection owners can delete"
ON calendar_collections FOR DELETE
USING (has_collection_access(id, auth.uid(), 'owner'));

CREATE POLICY "Users can view collection members"
ON calendar_collection_members FOR SELECT
USING (EXISTS (SELECT 1 FROM calendar_collections cc WHERE cc.id = collection_id AND has_collection_access(cc.id, auth.uid(), 'reader')));

CREATE POLICY "Collection owners can manage members"
ON calendar_collection_members FOR ALL
USING (EXISTS (SELECT 1 FROM calendar_collections cc WHERE cc.id = collection_id AND has_collection_access(cc.id, auth.uid(), 'owner')));

CREATE POLICY "Users can view collection shares"
ON calendar_collection_shares FOR SELECT
USING (EXISTS (SELECT 1 FROM calendar_collections cc WHERE cc.id = collection_id AND has_collection_access(cc.id, auth.uid(), 'reader')));

CREATE POLICY "Collection owners can manage shares"
ON calendar_collection_shares FOR ALL
USING (EXISTS (SELECT 1 FROM calendar_collections cc WHERE cc.id = collection_id AND has_collection_access(cc.id, auth.uid(), 'owner')));

CREATE POLICY "Users can view events they have access to"
ON calendar_events FOR SELECT
USING (has_calendar_access(calendar_id, auth.uid(), 'reader'));

CREATE POLICY "Users can create events in calendars they can write to"
ON calendar_events FOR INSERT
WITH CHECK (has_calendar_access(calendar_id, auth.uid(), 'writer') AND created_by = auth.uid());

CREATE POLICY "Users can update events in calendars they can write to"
ON calendar_events FOR UPDATE
USING (has_calendar_access(calendar_id, auth.uid(), 'writer'));

CREATE POLICY "Users can delete events they created"
ON calendar_events FOR DELETE
USING (created_by = auth.uid() OR has_calendar_access(calendar_id, auth.uid(), 'owner'));

CREATE POLICY "Users can view attendees for events they can see"
ON calendar_event_attendees FOR SELECT
USING (EXISTS (SELECT 1 FROM calendar_events ce WHERE ce.id = event_id AND has_calendar_access(ce.calendar_id, auth.uid(), 'reader')));

CREATE POLICY "Users can manage their own attendance"
ON calendar_event_attendees FOR ALL
USING (profile_id = auth.uid());

CREATE POLICY "Users can view their reminders"
ON calendar_event_reminders FOR SELECT
USING (profile_id = auth.uid());

CREATE POLICY "Users can create reminders for events they can see"
ON calendar_event_reminders FOR INSERT
WITH CHECK (
  profile_id = auth.uid()
  AND EXISTS (SELECT 1 FROM calendar_events ce WHERE ce.id = event_id AND has_calendar_access(ce.calendar_id, auth.uid(), 'reader'))
);

-- Triggers for updated_at
CREATE OR REPLACE FUNCTION update_calendar_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER calendar_updated_at
BEFORE UPDATE ON calendars
FOR EACH ROW EXECUTE FUNCTION update_calendar_updated_at();

CREATE TRIGGER collection_updated_at
BEFORE UPDATE ON calendar_collections
FOR EACH ROW EXECUTE FUNCTION update_calendar_updated_at();

CREATE TRIGGER event_updated_at
BEFORE UPDATE ON calendar_events
FOR EACH ROW EXECUTE FUNCTION update_calendar_updated_at();