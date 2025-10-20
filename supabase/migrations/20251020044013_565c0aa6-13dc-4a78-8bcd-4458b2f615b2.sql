-- Add missing index for knowledge_id lookups
create index if not exists idx_embed_jobs_kid on public.embedding_jobs(knowledge_id);

-- Auto-enqueue trigger: automatically creates embedding jobs for new knowledge rows
create or replace function public.tg_enqueue_embedding_job()
returns trigger language plpgsql security definer as $$
begin
  if NEW.embedding is null then
    insert into public.embedding_jobs(knowledge_id, priority)
    values (NEW.id, coalesce(((NEW.meta->>'priority')::int), 5))
    on conflict do nothing;
  end if;
  return NEW;
end; $$;

drop trigger if exists tr_enqueue_embedding_job on public.rocker_knowledge;
create trigger tr_enqueue_embedding_job
after insert on public.rocker_knowledge
for each row execute function public.tg_enqueue_embedding_job();