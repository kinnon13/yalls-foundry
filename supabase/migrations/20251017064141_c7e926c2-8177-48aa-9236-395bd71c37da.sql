-- PR2: Feeds - Personal vs Combined + Cross-post & Auto-propagate

-- entity_edges: relationships between entities (e.g., offspring→sire, horse→trainer)
CREATE TABLE IF NOT EXISTS public.entity_edges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subject_entity_id UUID NOT NULL REFERENCES public.entities(id) ON DELETE CASCADE,
  relation_type TEXT NOT NULL, -- 'offspring_of', 'trained_by', 'owned_by', etc.
  object_entity_id UUID NOT NULL REFERENCES public.entities(id) ON DELETE CASCADE,
  allow_crosspost BOOLEAN DEFAULT false,
  auto_propagate BOOLEAN DEFAULT false,
  status TEXT DEFAULT 'active',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(subject_entity_id, relation_type, object_entity_id)
);

CREATE INDEX idx_entity_edges_subject ON public.entity_edges(subject_entity_id);
CREATE INDEX idx_entity_edges_object ON public.entity_edges(object_entity_id);
CREATE INDEX idx_entity_edges_relation ON public.entity_edges(relation_type);

-- entity_members: users who can post on behalf of an entity
CREATE TABLE IF NOT EXISTS public.entity_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_id UUID NOT NULL REFERENCES public.entities(id) ON DELETE CASCADE,
  member_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member', -- 'owner', 'admin', 'member', 'contributor'
  permissions JSONB DEFAULT '{"can_post": true, "can_moderate": false, "can_manage": false}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(entity_id, member_user_id)
);

CREATE INDEX idx_entity_members_entity ON public.entity_members(entity_id);
CREATE INDEX idx_entity_members_user ON public.entity_members(member_user_id);

-- post_targets: where a post appears (author entity + cross-posted entities)
CREATE TABLE IF NOT EXISTS public.post_targets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  target_entity_id UUID NOT NULL REFERENCES public.entities(id) ON DELETE CASCADE,
  source_post_id UUID REFERENCES public.posts(id) ON DELETE CASCADE, -- for reposts
  reason TEXT DEFAULT 'original', -- 'original', 'cross_post', 'auto_propagate', 'repost'
  approved BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(post_id, target_entity_id)
);

CREATE INDEX idx_post_targets_post ON public.post_targets(post_id);
CREATE INDEX idx_post_targets_entity ON public.post_targets(target_entity_id);
CREATE INDEX idx_post_targets_approved ON public.post_targets(approved);

-- post_tags: entities tagged in a post (triggers auto-propagate if edge exists)
CREATE TABLE IF NOT EXISTS public.post_tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  entity_id UUID NOT NULL REFERENCES public.entities(id) ON DELETE CASCADE,
  tag_type TEXT DEFAULT 'mention', -- 'mention', 'feature', 'lineage'
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(post_id, entity_id)
);

CREATE INDEX idx_post_tags_post ON public.post_tags(post_id);
CREATE INDEX idx_post_tags_entity ON public.post_tags(entity_id);

-- feed_hides: entity owner hides a post from their page
CREATE TABLE IF NOT EXISTS public.feed_hides (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_id UUID NOT NULL REFERENCES public.entities(id) ON DELETE CASCADE,
  post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  hidden_by_user UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reason TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(entity_id, post_id)
);

CREATE INDEX idx_feed_hides_entity ON public.feed_hides(entity_id);
CREATE INDEX idx_feed_hides_post ON public.feed_hides(post_id);

-- RLS policies
ALTER TABLE public.entity_edges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.entity_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_targets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feed_hides ENABLE ROW LEVEL SECURITY;

-- entity_edges: public read, owner/admin write
CREATE POLICY "Anyone can view entity edges"
  ON public.entity_edges FOR SELECT
  USING (true);

CREATE POLICY "Entity owners can manage edges"
  ON public.entity_edges FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.entities
      WHERE id = entity_edges.subject_entity_id
      AND owner_user_id = auth.uid()
    )
  );

-- entity_members: members can view, owners can manage
CREATE POLICY "Members can view their memberships"
  ON public.entity_members FOR SELECT
  USING (member_user_id = auth.uid() OR EXISTS (
    SELECT 1 FROM public.entities
    WHERE id = entity_members.entity_id AND owner_user_id = auth.uid()
  ));

CREATE POLICY "Entity owners can manage members"
  ON public.entity_members FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.entities
      WHERE id = entity_members.entity_id AND owner_user_id = auth.uid()
    )
  );

-- post_targets: public read (approved), author can manage
CREATE POLICY "Anyone can view approved post targets"
  ON public.post_targets FOR SELECT
  USING (approved = true);

CREATE POLICY "Target owners can view unapproved"
  ON public.post_targets FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.entities
      WHERE id = post_targets.target_entity_id AND owner_user_id = auth.uid()
    )
  );

CREATE POLICY "System can insert post targets"
  ON public.post_targets FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Target owners can approve/delete"
  ON public.post_targets FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.entities
      WHERE id = post_targets.target_entity_id AND owner_user_id = auth.uid()
    )
  );

CREATE POLICY "Authors can delete own targets"
  ON public.post_targets FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.posts
      WHERE id = post_targets.post_id AND author_user_id = auth.uid()
    )
  );

-- post_tags: public read, author can manage
CREATE POLICY "Anyone can view post tags"
  ON public.post_tags FOR SELECT
  USING (true);

CREATE POLICY "Authors can manage post tags"
  ON public.post_tags FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.posts
      WHERE id = post_tags.post_id AND author_user_id = auth.uid()
    )
  );

-- feed_hides: owner can manage their hides
CREATE POLICY "Owners can manage feed hides"
  ON public.feed_hides FOR ALL
  USING (hidden_by_user = auth.uid());

-- RPC: post_publish with auto-propagate
CREATE OR REPLACE FUNCTION public.post_publish(
  p_author_entity_id UUID,
  p_body TEXT,
  p_media JSONB DEFAULT '[]',
  p_target_entity_ids UUID[] DEFAULT '{}',
  p_tag_entity_ids UUID[] DEFAULT '{}'
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_post_id UUID;
  v_author_user_id UUID;
  v_target_id UUID;
  v_tag_id UUID;
  v_edge RECORD;
  v_can_crosspost BOOLEAN;
BEGIN
  -- Verify author owns or is member of author_entity
  SELECT owner_user_id INTO v_author_user_id
  FROM entities WHERE id = p_author_entity_id;
  
  IF v_author_user_id IS NULL THEN
    RAISE EXCEPTION 'Entity not found';
  END IF;
  
  IF v_author_user_id != auth.uid() AND NOT EXISTS (
    SELECT 1 FROM entity_members
    WHERE entity_id = p_author_entity_id
    AND member_user_id = auth.uid()
    AND (permissions->>'can_post')::boolean = true
  ) THEN
    RAISE EXCEPTION 'Not authorized to post for this entity';
  END IF;

  -- Create post
  INSERT INTO posts (author_user_id, body, media, entity_id, tenant_id)
  VALUES (auth.uid(), p_body, COALESCE(p_media, '[]'::jsonb), p_author_entity_id, auth.uid())
  RETURNING id INTO v_post_id;

  -- Always add author entity as target
  INSERT INTO post_targets (post_id, target_entity_id, reason, approved)
  VALUES (v_post_id, p_author_entity_id, 'original', true);

  -- Add explicit targets (if user owns them or allow_crosspost)
  FOREACH v_target_id IN ARRAY p_target_entity_ids
  LOOP
    IF v_target_id != p_author_entity_id THEN
      -- Check if user owns target or crosspost allowed
      SELECT EXISTS (
        SELECT 1 FROM entities WHERE id = v_target_id AND owner_user_id = auth.uid()
      ) OR EXISTS (
        SELECT 1 FROM entity_edges
        WHERE subject_entity_id = p_author_entity_id
        AND object_entity_id = v_target_id
        AND allow_crosspost = true
      ) INTO v_can_crosspost;

      IF v_can_crosspost THEN
        INSERT INTO post_targets (post_id, target_entity_id, reason, approved)
        VALUES (v_post_id, v_target_id, 'cross_post', true)
        ON CONFLICT (post_id, target_entity_id) DO NOTHING;
      ELSE
        -- Request approval
        INSERT INTO post_targets (post_id, target_entity_id, reason, approved)
        VALUES (v_post_id, v_target_id, 'cross_post', false)
        ON CONFLICT (post_id, target_entity_id) DO NOTHING;
      END IF;
    END IF;
  END LOOP;

  -- Add tags
  FOREACH v_tag_id IN ARRAY p_tag_entity_ids
  LOOP
    INSERT INTO post_tags (post_id, entity_id)
    VALUES (v_post_id, v_tag_id)
    ON CONFLICT (post_id, entity_id) DO NOTHING;

    -- Auto-propagate if edge exists with auto_propagate=true
    FOR v_edge IN
      SELECT object_entity_id
      FROM entity_edges
      WHERE subject_entity_id = v_tag_id
      AND auto_propagate = true
      AND status = 'active'
    LOOP
      INSERT INTO post_targets (post_id, target_entity_id, reason, approved)
      VALUES (v_post_id, v_edge.object_entity_id, 'auto_propagate', true)
      ON CONFLICT (post_id, target_entity_id) DO NOTHING;
    END LOOP;
  END LOOP;

  -- Log to Rocker
  INSERT INTO ai_action_ledger (user_id, agent, action, input, output, result)
  VALUES (
    auth.uid(),
    'user',
    'post_publish',
    jsonb_build_object(
      'author_entity_id', p_author_entity_id,
      'targets', p_target_entity_ids,
      'tags', p_tag_entity_ids
    ),
    jsonb_build_object('post_id', v_post_id),
    'success'
  );

  RETURN v_post_id;
END;
$$;

-- RPC: post_repost
CREATE OR REPLACE FUNCTION public.post_repost(
  p_original_post_id UUID,
  p_by_entity_id UUID,
  p_target_entity_ids UUID[] DEFAULT '{}'
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_new_post_id UUID;
  v_original_body TEXT;
  v_original_media JSONB;
  v_target_id UUID;
BEGIN
  -- Verify user owns/is member of by_entity
  IF NOT EXISTS (
    SELECT 1 FROM entities WHERE id = p_by_entity_id AND owner_user_id = auth.uid()
  ) AND NOT EXISTS (
    SELECT 1 FROM entity_members
    WHERE entity_id = p_by_entity_id
    AND member_user_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  -- Get original post
  SELECT body, media INTO v_original_body, v_original_media
  FROM posts WHERE id = p_original_post_id;

  IF v_original_body IS NULL THEN
    RAISE EXCEPTION 'Original post not found';
  END IF;

  -- Create repost
  INSERT INTO posts (author_user_id, body, media, entity_id, tenant_id)
  VALUES (auth.uid(), v_original_body, v_original_media, p_by_entity_id, auth.uid())
  RETURNING id INTO v_new_post_id;

  -- Add by_entity as target
  INSERT INTO post_targets (post_id, target_entity_id, source_post_id, reason, approved)
  VALUES (v_new_post_id, p_by_entity_id, p_original_post_id, 'repost', true);

  -- Add additional targets
  FOREACH v_target_id IN ARRAY p_target_entity_ids
  LOOP
    IF v_target_id != p_by_entity_id THEN
      INSERT INTO post_targets (post_id, target_entity_id, source_post_id, reason, approved)
      VALUES (v_new_post_id, v_target_id, p_original_post_id, 'repost', true)
      ON CONFLICT (post_id, target_entity_id) DO NOTHING;
    END IF;
  END LOOP;

  -- Log
  INSERT INTO ai_action_ledger (user_id, agent, action, input, output, result)
  VALUES (
    auth.uid(),
    'user',
    'post_repost',
    jsonb_build_object('original_post_id', p_original_post_id, 'by_entity_id', p_by_entity_id),
    jsonb_build_object('new_post_id', v_new_post_id),
    'success'
  );

  RETURN v_new_post_id;
END;
$$;

-- Triggers for updated_at
CREATE OR REPLACE FUNCTION trigger_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_entity_edges_updated_at BEFORE UPDATE ON public.entity_edges
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

CREATE TRIGGER set_entity_members_updated_at BEFORE UPDATE ON public.entity_members
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();