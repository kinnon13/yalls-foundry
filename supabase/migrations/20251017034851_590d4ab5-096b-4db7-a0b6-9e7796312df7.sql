-- ─────────────────────────────────────────────────────────────────────────────
-- STORAGE: private bucket for claim evidence (per-user folders)
-- ─────────────────────────────────────────────────────────────────────────────
insert into storage.buckets (id, name, public)
values ('entity-claims', 'entity-claims', false)
on conflict (id) do nothing;

-- Authenticated users can upload into their own folder:  <userId>/<claimId>/<file>
create policy "entity-claims: users can upload to own folder"
on storage.objects for insert to authenticated
with check (
  bucket_id = 'entity-claims'
  and (storage.foldername(name))[1] = auth.uid()::text
);

-- Authenticated users can read their own evidence
create policy "entity-claims: users can read own"
on storage.objects for select to authenticated
using (
  bucket_id = 'entity-claims'
  and (storage.foldername(name))[1] = auth.uid()::text
);

-- Admins can read all evidence
create policy "entity-claims: admins can read"
on storage.objects for select to authenticated
using (
  bucket_id = 'entity-claims'
  and has_role(auth.uid(), 'admin'::app_role)
);

-- Admins can delete (abuse/spam cleanup)
create policy "entity-claims: admins can delete"
on storage.objects for delete to authenticated
using (
  bucket_id = 'entity-claims'
  and has_role(auth.uid(), 'admin'::app_role)
);

-- Optional: only admins may update objects (rename/metadata)
create policy "entity-claims: admins can update"
on storage.objects for update to authenticated
using (
  bucket_id = 'entity-claims'
  and has_role(auth.uid(), 'admin'::app_role)
)
with check (
  bucket_id = 'entity-claims'
  and has_role(auth.uid(), 'admin'::app_role)
);

-- ─────────────────────────────────────────────────────────────────────────────
-- SEED: a few unclaimed entities so the banner, wizard, and admin queue work
-- ─────────────────────────────────────────────────────────────────────────────
do $$
declare
  v_contributor uuid;
begin
  select user_id into v_contributor
  from public.profiles
  order by created_at asc
  limit 1;

  perform public.entity_create_unclaimed(
    p_kind := 'business',
    p_display_name := 'Wild River Stables',
    p_handle := 'wild-river-stables',
    p_provenance := jsonb_build_object('source','seed','import_batch_id','phase1-demo'),
    p_contributor_user_id := v_contributor,
    p_window_key := 'contributor.60'
  );

  perform public.entity_create_unclaimed(
    p_kind := 'horse',
    p_display_name := 'Starfire',
    p_handle := 'starfire',
    p_provenance := jsonb_build_object('source','seed','import_batch_id','phase1-demo'),
    p_contributor_user_id := v_contributor,
    p_window_key := 'contributor.30'
  );

  perform public.entity_create_unclaimed(
    p_kind := 'person',
    p_display_name := 'Casey Morales',
    p_handle := 'casey-morales',
    p_provenance := jsonb_build_object('source','seed','import_batch_id','phase1-demo'),
    p_contributor_user_id := v_contributor,
    p_window_key := 'contributor.90'
  );

  perform public.entity_create_unclaimed(
    p_kind := 'event',
    p_display_name := 'Spring Classic Show 2025',
    p_handle := 'spring-classic-2025',
    p_provenance := jsonb_build_object('source','seed','import_batch_id','phase1-demo'),
    p_contributor_user_id := v_contributor,
    p_window_key := 'contributor.60'
  );
end$$;

-- ─────────────────────────────────────────────────────────────────────────────
-- TRIGGER: Log to AI ledger when a claim is approved (automatic audit)
-- ─────────────────────────────────────────────────────────────────────────────
create or replace function public._after_entity_claim_approve()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_entity public.entities%rowtype;
begin
  if NEW.status = 'approved' and OLD.status <> 'approved' then
    select * into v_entity from public.entities where id = NEW.entity_id;

    -- Write to ledger (as admin_rocker system event)
    insert into public.ai_action_ledger(
      user_id, agent, action, input, output, result, correlation_id
    ) values (
      NEW.claimant_user_id,
      'admin_rocker',
      'claim_approved',
      jsonb_build_object('entity_id', NEW.entity_id, 'claim_id', NEW.id),
      jsonb_build_object('owner_user_id', NEW.claimant_user_id, 'entity_status', v_entity.status),
      'success',
      gen_random_uuid()
    );
  end if;
  return NEW;
end$$;

drop trigger if exists trg_after_entity_claim_approve on public.entity_claims;
create trigger trg_after_entity_claim_approve
after update on public.entity_claims
for each row
when (NEW.status = 'approved' and OLD.status is distinct from NEW.status)
execute function public._after_entity_claim_approve();