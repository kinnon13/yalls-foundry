-- PART 3: Fix tables WITH RLS but NO policies (7 tables)
-- These tables have RLS enabled but are completely locked because they have no policies

-- contacts
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS tenant_id UUID;
CREATE INDEX IF NOT EXISTS idx_contacts_tenant ON contacts(tenant_id);
DROP TRIGGER IF EXISTS trg_contacts_tenant ON contacts;
CREATE TRIGGER trg_contacts_tenant BEFORE INSERT ON contacts FOR EACH ROW EXECUTE FUNCTION public.set_tenant_id_if_null();
CREATE POLICY "tenant_access_contacts" ON contacts FOR ALL USING (tenant_id = auth.uid()) WITH CHECK (tenant_id = auth.uid());

-- conversation_members
ALTER TABLE conversation_members ADD COLUMN IF NOT EXISTS tenant_id UUID;
CREATE INDEX IF NOT EXISTS idx_conversation_members_tenant ON conversation_members(tenant_id);
DROP TRIGGER IF EXISTS trg_conversation_members_tenant ON conversation_members;
CREATE TRIGGER trg_conversation_members_tenant BEFORE INSERT ON conversation_members FOR EACH ROW EXECUTE FUNCTION public.set_tenant_id_if_null();
CREATE POLICY "tenant_access_conversation_members" ON conversation_members FOR ALL USING (tenant_id = auth.uid()) WITH CHECK (tenant_id = auth.uid());

-- conversations
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS tenant_id UUID;
CREATE INDEX IF NOT EXISTS idx_conversations_tenant ON conversations(tenant_id);
DROP TRIGGER IF EXISTS trg_conversations_tenant ON conversations;
CREATE TRIGGER trg_conversations_tenant BEFORE INSERT ON conversations FOR EACH ROW EXECUTE FUNCTION public.set_tenant_id_if_null();
CREATE POLICY "tenant_access_conversations" ON conversations FOR ALL USING (tenant_id = auth.uid()) WITH CHECK (tenant_id = auth.uid());

-- events_queue
ALTER TABLE events_queue ADD COLUMN IF NOT EXISTS tenant_id UUID;
CREATE INDEX IF NOT EXISTS idx_events_queue_tenant ON events_queue(tenant_id);
DROP TRIGGER IF EXISTS trg_events_queue_tenant ON events_queue;
CREATE TRIGGER trg_events_queue_tenant BEFORE INSERT ON events_queue FOR EACH ROW EXECUTE FUNCTION public.set_tenant_id_if_null();
CREATE POLICY "service_role_events_queue" ON events_queue FOR ALL USING (auth.jwt()->>'role' = 'service_role');

-- message_reads
ALTER TABLE message_reads ADD COLUMN IF NOT EXISTS tenant_id UUID;
CREATE INDEX IF NOT EXISTS idx_message_reads_tenant ON message_reads(tenant_id);
DROP TRIGGER IF EXISTS trg_message_reads_tenant ON message_reads;
CREATE TRIGGER trg_message_reads_tenant BEFORE INSERT ON message_reads FOR EACH ROW EXECUTE FUNCTION public.set_tenant_id_if_null();
CREATE POLICY "tenant_access_message_reads" ON message_reads FOR ALL USING (tenant_id = auth.uid()) WITH CHECK (tenant_id = auth.uid());

-- rate_limits
ALTER TABLE rate_limits ADD COLUMN IF NOT EXISTS tenant_id UUID;
CREATE INDEX IF NOT EXISTS idx_rate_limits_tenant ON rate_limits(tenant_id);
DROP TRIGGER IF EXISTS trg_rate_limits_tenant ON rate_limits;
CREATE TRIGGER trg_rate_limits_tenant BEFORE INSERT ON rate_limits FOR EACH ROW EXECUTE FUNCTION public.set_tenant_id_if_null();
CREATE POLICY "tenant_access_rate_limits" ON rate_limits FOR ALL USING (tenant_id = auth.uid()) WITH CHECK (tenant_id = auth.uid());

-- voice_post_rate_limits
ALTER TABLE voice_post_rate_limits ADD COLUMN IF NOT EXISTS tenant_id UUID;
CREATE INDEX IF NOT EXISTS idx_voice_post_rate_limits_tenant ON voice_post_rate_limits(tenant_id);
DROP TRIGGER IF EXISTS trg_voice_post_rate_limits_tenant ON voice_post_rate_limits;
CREATE TRIGGER trg_voice_post_rate_limits_tenant BEFORE INSERT ON voice_post_rate_limits FOR EACH ROW EXECUTE FUNCTION public.set_tenant_id_if_null();
CREATE POLICY "tenant_access_voice_post_rate_limits" ON voice_post_rate_limits FOR ALL USING (tenant_id = auth.uid()) WITH CHECK (tenant_id = auth.uid());