-- Ghost pin cleanup function (for weekly cron or manual cleanup)
create or replace function public.prune_ghost_entity_pins() 
returns int 
language plpgsql
security definer
set search_path = public
as $$
declare 
  v_count int; 
begin
  delete from user_pins p
  where p.pin_type = 'entity'
    and not exists (
      select 1 from entities e where e.id::text = p.ref_id
    );
  get diagnostics v_count = row_count; 
  return v_count;
end $$;