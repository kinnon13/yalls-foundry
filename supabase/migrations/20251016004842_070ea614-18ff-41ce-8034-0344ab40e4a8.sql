-- Critical Performance Indexes for 1M Users
-- Only for tables that exist in current schema

-- Profile lookups
CREATE INDEX IF NOT EXISTS idx_profiles_user ON profiles(user_id);

-- Business queries
CREATE INDEX IF NOT EXISTS idx_businesses_owner ON businesses(owner_id);
CREATE INDEX IF NOT EXISTS idx_businesses_slug ON businesses(slug);
CREATE INDEX IF NOT EXISTS idx_business_team_user ON business_team(user_id);
CREATE INDEX IF NOT EXISTS idx_business_team_biz ON business_team(business_id);

-- CRM events (partitioned table - critical for scale)
CREATE INDEX IF NOT EXISTS idx_crm_events_tenant_ts ON crm_events(tenant_id, ts DESC);
CREATE INDEX IF NOT EXISTS idx_crm_events_contact ON crm_events(contact_id);
CREATE INDEX IF NOT EXISTS idx_crm_events_type ON crm_events(type);

-- Posts (heavy read traffic)
CREATE INDEX IF NOT EXISTS idx_posts_author_created ON posts(author_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_posts_tenant_created ON posts(tenant_id, created_at DESC);

-- Calendar (time-range queries)
CREATE INDEX IF NOT EXISTS idx_calendar_events_calendar_starts ON calendar_events(calendar_id, starts_at);
CREATE INDEX IF NOT EXISTS idx_calendar_events_creator ON calendar_events(created_by);

-- AI/Memory (user-specific frequent access)
CREATE INDEX IF NOT EXISTS idx_ai_memory_user_used ON ai_user_memory(user_id, last_used_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_sessions_user_started ON ai_sessions(user_id, started_at DESC);
CREATE INDEX IF NOT EXISTS idx_conversation_sessions_user_updated ON conversation_sessions(user_id, updated_at DESC);