-- Add sharing and safety fields to ai_user_memory
ALTER TABLE ai_user_memory 
  ADD COLUMN IF NOT EXISTS visibility text CHECK (visibility IN ('private', 'linked')) DEFAULT 'private',
  ADD COLUMN IF NOT EXISTS shared_with uuid[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS originator_profile_id uuid REFERENCES profiles(id),
  ADD COLUMN IF NOT EXISTS tone text,
  ADD COLUMN IF NOT EXISTS toxicity real,
  ADD COLUMN IF NOT EXISTS safety_category text;

-- Memory share requests table
CREATE TABLE IF NOT EXISTS memory_share_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  memory_id uuid NOT NULL REFERENCES ai_user_memory(id) ON DELETE CASCADE,
  from_profile_id uuid NOT NULL,
  to_profile_id uuid NOT NULL,
  status text CHECK (status IN ('pending', 'accepted', 'declined', 'expired', 'cancelled')) DEFAULT 'pending',
  created_at timestamptz DEFAULT now(),
  decided_at timestamptz,
  expires_at timestamptz DEFAULT (now() + interval '7 days'),
  UNIQUE(memory_id, to_profile_id)
);

-- Memory links for shared access
CREATE TABLE IF NOT EXISTS memory_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source_memory_id uuid NOT NULL REFERENCES ai_user_memory(id) ON DELETE CASCADE,
  visible_to_profile_id uuid NOT NULL,
  can_edit boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  UNIQUE(source_memory_id, visible_to_profile_id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_share_requests_to_pending ON memory_share_requests(to_profile_id, status) WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS idx_memory_links_visible_to ON memory_links(visible_to_profile_id);

-- RLS policies for share requests
ALTER TABLE memory_share_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their share requests"
ON memory_share_requests FOR SELECT
TO authenticated
USING (auth.uid() = from_profile_id OR auth.uid() = to_profile_id);

CREATE POLICY "Users can create share requests"
ON memory_share_requests FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = from_profile_id);

CREATE POLICY "Recipients can update share requests"
ON memory_share_requests FOR UPDATE
TO authenticated
USING (auth.uid() = to_profile_id);

-- RLS policies for memory links
ALTER TABLE memory_links ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their memory links"
ON memory_links FOR SELECT
TO authenticated
USING (
  auth.uid() = visible_to_profile_id OR 
  EXISTS (
    SELECT 1 FROM ai_user_memory 
    WHERE id = source_memory_id AND user_id = auth.uid()
  )
);

CREATE POLICY "System can manage memory links"
ON memory_links FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);