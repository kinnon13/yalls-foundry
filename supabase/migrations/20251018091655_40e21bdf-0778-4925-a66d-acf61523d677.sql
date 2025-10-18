-- Security hardening for appearance_settings + folders + PWA-ready indexes

-- 1) Fix appearance_settings RLS policies
drop policy if exists "owner can manage appearance" on public.appearance_settings;

create policy "appearance_select_user"
on public.appearance_settings for select
using (
  (subject_type = 'user' and subject_id = auth.uid()) or
  (subject_type = 'entity' and subject_id in (
     select e.id from public.entities e where e.owner_user_id = auth.uid()
  ))
);

create policy "appearance_upsert_user"
on public.appearance_settings for insert with check (
  (subject_type = 'user' and subject_id = auth.uid()) or
  (subject_type = 'entity' and subject_id in (
     select e.id from public.entities e where e.owner_user_id = auth.uid()
  ))
);

create policy "appearance_update_user"
on public.appearance_settings for update using (
  (subject_type = 'user' and subject_id = auth.uid()) or
  (subject_type = 'entity' and subject_id in (
     select e.id from public.entities e where e.owner_user_id = auth.uid()
  ))
);

-- 2) Fix set_appearance with ownership checks
create or replace function public.set_appearance(
  p_subject_type text,
  p_subject_id uuid,
  p_wallpaper text,
  p_screensaver jsonb
) returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Guard: caller must own the subject
  if p_subject_type = 'user' and p_subject_id <> auth.uid() then
    raise exception 'not owner';
  elsif p_subject_type = 'entity' and not exists (
    select 1 from public.entities e
    where e.id = p_subject_id and e.owner_user_id = auth.uid()
  ) then
    raise exception 'not owner';
  end if;

  insert into public.appearance_settings (subject_type, subject_id, wallpaper_url, screensaver_payload)
  values (p_subject_type, p_subject_id, p_wallpaper, coalesce(p_screensaver, '{}'::jsonb))
  on conflict (subject_type, subject_id)
  do update set
    wallpaper_url = excluded.wallpaper_url,
    screensaver_payload = excluded.screensaver_payload,
    updated_at = now();
end$$;

-- 3) Add indexes for performance
create index if not exists idx_folders_user_section_order
on public.user_pin_folders (user_id, section, sort_index);

create index if not exists idx_user_pins_bucket
on public.user_pins (user_id, section, folder_id, sort_index);

-- 4) Add feed query index for /social
create index if not exists idx_post_targets_target_approved_created
on public.post_targets (target_entity_id, approved, created_at desc);

-- 5) Storage policies for wallpapers bucket (if not exists)
do $$
begin
  -- Insert bucket if not exists
  insert into storage.buckets (id, name, public)
  values ('wallpapers', 'wallpapers', true)
  on conflict (id) do nothing;
end$$;

-- Restrict uploads to own paths
drop policy if exists "wallpapers_write_own" on storage.objects;
create policy "wallpapers_write_own"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'wallpapers'
  and (
    -- user wallpaper path
    (storage.foldername(name))[1] = 'user'
    and (storage.foldername(name))[2] = auth.uid()::text
    or
    -- entity wallpaper path (must own the entity)
    (
      (storage.foldername(name))[1] = 'entity'
      and exists (
        select 1 from public.entities e
        where e.id::text = (storage.foldername(name))[2]
          and e.owner_user_id = auth.uid()
      )
    )
  )
);

drop policy if exists "wallpapers_read_all" on storage.objects;
create policy "wallpapers_read_all"
on storage.objects for select
using (bucket_id = 'wallpapers');