-- Circuit Breakers: API/Vendor & Topic/Pool error spike protection

-- ====== API/Vendor Circuit Breakers ======
create table if not exists public.api_circuit_breakers (
  id uuid primary key default gen_random_uuid(),
  service text unique not null,
  window_sec int not null default 60,
  error_threshold_pct int not null default 50,
  state text not null default 'closed' check (state in ('closed','open','half_open')),
  error_count int not null default 0,
  total_count int not null default 0,
  opened_at timestamptz,
  cooloff_sec int not null default 120,
  last_reset_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- RLS for api_circuit_breakers
alter table public.api_circuit_breakers enable row level security;

create policy "Service role full access to api_circuit_breakers"
  on public.api_circuit_breakers
  for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

-- Record outcomes
create or replace function public.record_api_outcome(p_service text, p_success boolean)
returns void language plpgsql security definer as $$
declare
  v_row record;
begin
  update public.api_circuit_breakers
  set total_count = total_count + 1,
      error_count = error_count + (case when p_success then 0 else 1 end),
      updated_at = now()
  where service = p_service;

  if not found then
    insert into public.api_circuit_breakers(service, total_count, error_count)
    values (p_service, 1, case when p_success then 0 else 1 end);
  end if;
end $$;

-- Evaluate breakers
create or replace function public.evaluate_api_breakers()
returns table(service text, state text, error_pct numeric) language plpgsql security definer as $$
declare
  r record;
  v_error_pct numeric;
begin
  for r in select * from public.api_circuit_breakers loop
    -- reset the window if time elapsed
    if extract(epoch from (now() - r.last_reset_at)) > r.window_sec then
      update public.api_circuit_breakers
      set total_count=0, error_count=0, last_reset_at=now(), updated_at=now()
      where id=r.id;
      continue;
    end if;

    if r.total_count = 0 then
      v_error_pct := 0;
    else
      v_error_pct := (r.error_count::numeric / r.total_count::numeric) * 100.0;
    end if;

    if r.state = 'closed' and v_error_pct >= r.error_threshold_pct then
      update public.api_circuit_breakers
      set state='open', opened_at=now(), updated_at=now()
      where id=r.id;
    elsif r.state = 'open' and extract(epoch from (now() - coalesce(r.opened_at, now()))) > r.cooloff_sec then
      update public.api_circuit_breakers
      set state='half_open', updated_at=now()
      where id=r.id;
    elsif r.state = 'half_open' then
      if v_error_pct < (r.error_threshold_pct/2) then
        update public.api_circuit_breakers
        set state='closed', total_count=0, error_count=0, last_reset_at=now(), updated_at=now()
        where id=r.id;
      end if;
    end if;

    service := r.service;
    state := (select cb.state from public.api_circuit_breakers cb where cb.id=r.id);
    error_pct := v_error_pct;
    return next;
  end loop;
end $$;

-- ====== Topic/Pool Circuit Breakers ======
create table if not exists public.topic_circuit_breakers (
  id uuid primary key default gen_random_uuid(),
  topic text unique not null,
  pool text,
  window_sec int not null default 60,
  error_threshold_pct int not null default 40,
  state text not null default 'closed' check (state in ('closed','open','half_open')),
  error_count int not null default 0,
  total_count int not null default 0,
  opened_at timestamptz,
  cooloff_sec int not null default 90,
  last_reset_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- RLS for topic_circuit_breakers
alter table public.topic_circuit_breakers enable row level security;

create policy "Service role full access to topic_circuit_breakers"
  on public.topic_circuit_breakers
  for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

-- Record topic outcomes
create or replace function public.record_topic_outcome(p_topic text, p_success boolean)
returns void language plpgsql security definer as $$
begin
  update public.topic_circuit_breakers
  set total_count = total_count + 1,
      error_count = error_count + (case when p_success then 0 else 1 end),
      updated_at=now()
  where topic=p_topic;

  if not found then
    insert into public.topic_circuit_breakers(topic, total_count, error_count)
    values (p_topic, 1, case when p_success then 0 else 1 end);
  end if;
end $$;

-- Evaluate topic breakers
create or replace function public.evaluate_topic_breakers()
returns table(topic text, state text, error_pct numeric) language plpgsql security definer as $$
declare
  r record;
  v_error_pct numeric;
begin
  for r in select * from public.topic_circuit_breakers loop
    if extract(epoch from (now() - r.last_reset_at)) > r.window_sec then
      update public.topic_circuit_breakers
      set total_count=0, error_count=0, last_reset_at=now(), updated_at=now()
      where id=r.id;
      continue;
    end if;

    if r.total_count=0 then v_error_pct:=0;
    else v_error_pct := (r.error_count::numeric / r.total_count::numeric) * 100.0;
    end if;

    if r.state='closed' and v_error_pct >= r.error_threshold_pct then
      update public.topic_circuit_breakers set state='open', opened_at=now(), updated_at=now() where id=r.id;
    elsif r.state='open' and extract(epoch from (now()-coalesce(r.opened_at,now()))) > r.cooloff_sec then
      update public.topic_circuit_breakers set state='half_open', updated_at=now() where id=r.id;
    elsif r.state='half_open' and v_error_pct < (r.error_threshold_pct/2) then
      update public.topic_circuit_breakers
      set state='closed', total_count=0, error_count=0, last_reset_at=now(), updated_at=now() where id=r.id;
    end if;

    topic := r.topic;
    state := (select cb.state from public.topic_circuit_breakers cb where cb.id=r.id);
    error_pct := v_error_pct;
    return next;
  end loop;
end $$;