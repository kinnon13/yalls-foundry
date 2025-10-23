-- Create helper function (idempotent)
create or replace function public.set_tenant_id_if_null()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.tenant_id is null then
    new.tenant_id := auth.uid();
  end if;
  return new;
end;
$$;

-- Indexes and triggers (idempotent)
create index if not exists idx_ai_action_ledger_tenant on ai_action_ledger(tenant_id);
create index if not exists idx_ai_user_consent_tenant on ai_user_consent(tenant_id);
create index if not exists idx_ai_feedback_tenant on ai_feedback(tenant_id);
create index if not exists idx_ai_ethics_policy_tenant on ai_ethics_policy(tenant_id);
create index if not exists idx_ai_events_tenant on ai_events(tenant_id);
create index if not exists idx_ai_incidents_tenant on ai_incidents(tenant_id);
create index if not exists idx_ai_job_dlq_tenant on ai_job_dlq(tenant_id);
create index if not exists idx_ai_change_proposals_tenant on ai_change_proposals(tenant_id);
create index if not exists idx_ai_self_improve_log_tenant on ai_self_improve_log(tenant_id);

-- Triggers (create if not exists via pg_trigger check)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_ai_action_ledger_tenant') THEN
    CREATE TRIGGER trg_ai_action_ledger_tenant BEFORE INSERT ON ai_action_ledger FOR EACH ROW EXECUTE FUNCTION public.set_tenant_id_if_null();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_ai_user_consent_tenant') THEN
    CREATE TRIGGER trg_ai_user_consent_tenant BEFORE INSERT ON ai_user_consent FOR EACH ROW EXECUTE FUNCTION public.set_tenant_id_if_null();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_ai_feedback_tenant') THEN
    CREATE TRIGGER trg_ai_feedback_tenant BEFORE INSERT ON ai_feedback FOR EACH ROW EXECUTE FUNCTION public.set_tenant_id_if_null();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_ai_ethics_policy_tenant') THEN
    CREATE TRIGGER trg_ai_ethics_policy_tenant BEFORE INSERT ON ai_ethics_policy FOR EACH ROW EXECUTE FUNCTION public.set_tenant_id_if_null();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_ai_events_tenant') THEN
    CREATE TRIGGER trg_ai_events_tenant BEFORE INSERT ON ai_events FOR EACH ROW EXECUTE FUNCTION public.set_tenant_id_if_null();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_ai_incidents_tenant') THEN
    CREATE TRIGGER trg_ai_incidents_tenant BEFORE INSERT ON ai_incidents FOR EACH ROW EXECUTE FUNCTION public.set_tenant_id_if_null();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_ai_job_dlq_tenant') THEN
    CREATE TRIGGER trg_ai_job_dlq_tenant BEFORE INSERT ON ai_job_dlq FOR EACH ROW EXECUTE FUNCTION public.set_tenant_id_if_null();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_ai_change_proposals_tenant') THEN
    CREATE TRIGGER trg_ai_change_proposals_tenant BEFORE INSERT ON ai_change_proposals FOR EACH ROW EXECUTE FUNCTION public.set_tenant_id_if_null();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_ai_self_improve_log_tenant') THEN
    CREATE TRIGGER trg_ai_self_improve_log_tenant BEFORE INSERT ON ai_self_improve_log FOR EACH ROW EXECUTE FUNCTION public.set_tenant_id_if_null();
  END IF;
END $$;

-- Policies: create only if missing
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='ai_action_ledger' AND policyname='tenant_isolation_ledger_update') THEN
    CREATE POLICY "tenant_isolation_ledger_update" ON ai_action_ledger FOR UPDATE USING (tenant_id = auth.uid()) WITH CHECK (tenant_id = auth.uid());
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='ai_action_ledger' AND policyname='tenant_isolation_ledger_delete') THEN
    CREATE POLICY "tenant_isolation_ledger_delete" ON ai_action_ledger FOR DELETE USING (tenant_id = auth.uid());
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='ai_user_consent' AND policyname='tenant_isolation_consent_delete') THEN
    CREATE POLICY "tenant_isolation_consent_delete" ON ai_user_consent FOR DELETE USING (tenant_id = auth.uid());
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='ai_feedback' AND policyname='tenant_isolation_feedback_update') THEN
    CREATE POLICY "tenant_isolation_feedback_update" ON ai_feedback FOR UPDATE USING (tenant_id = auth.uid()) WITH CHECK (tenant_id = auth.uid());
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='ai_feedback' AND policyname='tenant_isolation_feedback_delete') THEN
    CREATE POLICY "tenant_isolation_feedback_delete" ON ai_feedback FOR DELETE USING (tenant_id = auth.uid());
  END IF;

  -- ensure events select matches tenant
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='ai_events' AND policyname='tenant_isolation_events_select') THEN
    CREATE POLICY "tenant_isolation_events_select" ON ai_events FOR SELECT USING (tenant_id = auth.uid());
  END IF;
END $$;

-- Backfill
UPDATE ai_action_ledger SET tenant_id = user_id WHERE tenant_id IS NULL AND user_id IS NOT NULL;
UPDATE ai_user_consent SET tenant_id = user_id WHERE tenant_id IS NULL AND user_id IS NOT NULL;
DO $$ BEGIN
  IF EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='ai_feedback' AND column_name='user_id') THEN
    UPDATE ai_feedback SET tenant_id = user_id WHERE tenant_id IS NULL AND user_id IS NOT NULL;
  END IF;
END $$;