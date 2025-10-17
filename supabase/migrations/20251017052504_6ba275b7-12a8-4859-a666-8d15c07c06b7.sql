-- Phase 3.1: Rodeo & Barrel Racing Producer Suite

-- Event classes (barrel, roping, rodeo disciplines)
CREATE TABLE IF NOT EXISTS public.event_classes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  key TEXT NOT NULL,
  title TEXT NOT NULL,
  discipline TEXT NOT NULL CHECK (discipline IN ('barrel', 'team_roping', 'breakaway', 'tie_down', 'steer_wrestling', 'bull_riding', 'bronc')),
  fees_jsonb JSONB NOT NULL DEFAULT '{"entry_cents":0,"office_cents":0,"jackpot_cents":0,"exhibition_cents":0}'::jsonb,
  schedule_block TEXT,
  max_entries INT,
  added_money_cents INT NOT NULL DEFAULT 0,
  rules_md TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(event_id, key)
);

-- Entries (rider/horse registrations)
CREATE TABLE IF NOT EXISTS public.entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id UUID NOT NULL REFERENCES public.event_classes(id) ON DELETE CASCADE,
  rider_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  horse_entity_id UUID REFERENCES public.entities(id) ON DELETE SET NULL,
  back_number INT,
  fees_cents INT NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'scratched', 'no_show', 'completed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Draws (run order)
CREATE TABLE IF NOT EXISTS public.draws (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id UUID NOT NULL REFERENCES public.event_classes(id) ON DELETE CASCADE,
  round INT NOT NULL DEFAULT 1,
  position INT NOT NULL,
  entry_id UUID NOT NULL REFERENCES public.entries(id) ON DELETE CASCADE,
  perf_label TEXT,
  is_slack BOOLEAN NOT NULL DEFAULT FALSE,
  go_time TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(class_id, round, position)
);

-- Results (times/scores)
CREATE TABLE IF NOT EXISTS public.results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entry_id UUID NOT NULL REFERENCES public.entries(id) ON DELETE CASCADE,
  round INT NOT NULL DEFAULT 1,
  time_ms INT,
  penalties_ms INT NOT NULL DEFAULT 0,
  score NUMERIC,
  dnf BOOLEAN NOT NULL DEFAULT FALSE,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(entry_id, round)
);

-- Payout rules
CREATE TABLE IF NOT EXISTS public.payout_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id UUID NOT NULL REFERENCES public.event_classes(id) ON DELETE CASCADE,
  schema JSONB NOT NULL DEFAULT '{"places":[]}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Payouts (computed)
CREATE TABLE IF NOT EXISTS public.payouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id UUID NOT NULL REFERENCES public.event_classes(id) ON DELETE CASCADE,
  entry_id UUID NOT NULL REFERENCES public.entries(id) ON DELETE CASCADE,
  place INT NOT NULL,
  amount_cents INT NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accrued', 'paid', 'void')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.event_classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.draws ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payout_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payouts ENABLE ROW LEVEL SECURITY;

-- RLS Policies: event_classes
CREATE POLICY "event_classes_public_read" ON public.event_classes FOR SELECT USING (true);
CREATE POLICY "event_classes_producer_write" ON public.event_classes FOR ALL USING (
  EXISTS (SELECT 1 FROM public.events WHERE events.id = event_classes.event_id AND events.created_by = auth.uid())
);

-- RLS Policies: entries
CREATE POLICY "entries_public_read" ON public.entries FOR SELECT USING (true);
CREATE POLICY "entries_rider_write" ON public.entries FOR INSERT WITH CHECK (rider_user_id = auth.uid());
CREATE POLICY "entries_producer_write" ON public.entries FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.event_classes ec
    JOIN public.events e ON e.id = ec.event_id
    WHERE ec.id = entries.class_id AND e.created_by = auth.uid()
  )
);

-- RLS Policies: draws
CREATE POLICY "draws_public_read" ON public.draws FOR SELECT USING (true);
CREATE POLICY "draws_producer_write" ON public.draws FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.event_classes ec
    JOIN public.events e ON e.id = ec.event_id
    WHERE ec.id = draws.class_id AND e.created_by = auth.uid()
  )
);

-- RLS Policies: results
CREATE POLICY "results_public_read" ON public.results FOR SELECT USING (true);
CREATE POLICY "results_producer_write" ON public.results FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.entries en
    JOIN public.event_classes ec ON ec.id = en.class_id
    JOIN public.events e ON e.id = ec.event_id
    WHERE en.id = results.entry_id AND e.created_by = auth.uid()
  )
);

-- RLS Policies: payout_rules
CREATE POLICY "payout_rules_public_read" ON public.payout_rules FOR SELECT USING (true);
CREATE POLICY "payout_rules_producer_write" ON public.payout_rules FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.event_classes ec
    JOIN public.events e ON e.id = ec.event_id
    WHERE ec.id = payout_rules.class_id AND e.created_by = auth.uid()
  )
);

-- RLS Policies: payouts
CREATE POLICY "payouts_public_read" ON public.payouts FOR SELECT USING (true);
CREATE POLICY "payouts_producer_write" ON public.payouts FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.event_classes ec
    JOIN public.events e ON e.id = ec.event_id
    WHERE ec.id = payouts.class_id AND e.created_by = auth.uid()
  )
);

-- RPCs
CREATE OR REPLACE FUNCTION public.class_upsert(p_event_id UUID, p_payload JSONB)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_id UUID;
BEGIN
  INSERT INTO public.event_classes (
    event_id, key, title, discipline, fees_jsonb, schedule_block, max_entries, added_money_cents, rules_md
  ) VALUES (
    p_event_id,
    p_payload->>'key',
    p_payload->>'title',
    p_payload->>'discipline',
    COALESCE(p_payload->'fees_jsonb', '{}'::jsonb),
    p_payload->>'schedule_block',
    (p_payload->>'max_entries')::int,
    COALESCE((p_payload->>'added_money_cents')::int, 0),
    p_payload->>'rules_md'
  )
  ON CONFLICT (event_id, key) DO UPDATE SET
    title = EXCLUDED.title,
    discipline = EXCLUDED.discipline,
    fees_jsonb = EXCLUDED.fees_jsonb,
    schedule_block = EXCLUDED.schedule_block,
    max_entries = EXCLUDED.max_entries,
    added_money_cents = EXCLUDED.added_money_cents,
    rules_md = EXCLUDED.rules_md,
    updated_at = NOW()
  RETURNING id INTO v_id;
  
  RETURN v_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.entry_submit(
  p_class_id UUID,
  p_rider_user_id UUID,
  p_horse_entity_id UUID,
  p_opts JSONB DEFAULT '{}'::jsonb
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_id UUID;
  v_fees INT := 0;
BEGIN
  -- Calculate fees from class
  SELECT COALESCE(
    (fees_jsonb->>'entry_cents')::int + 
    (fees_jsonb->>'office_cents')::int + 
    (fees_jsonb->>'jackpot_cents')::int, 
    0
  ) INTO v_fees
  FROM public.event_classes
  WHERE id = p_class_id;
  
  INSERT INTO public.entries (class_id, rider_user_id, horse_entity_id, fees_cents, status)
  VALUES (p_class_id, p_rider_user_id, p_horse_entity_id, v_fees, 'pending')
  RETURNING id INTO v_id;
  
  RETURN v_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.draw_generate(p_event_id UUID, p_opts JSONB DEFAULT '{}'::jsonb)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_class RECORD;
  v_entry RECORD;
  v_position INT;
BEGIN
  FOR v_class IN 
    SELECT id FROM public.event_classes WHERE event_id = p_event_id
  LOOP
    v_position := 1;
    
    FOR v_entry IN 
      SELECT id FROM public.entries 
      WHERE class_id = v_class.id AND status = 'accepted'
      ORDER BY RANDOM()
    LOOP
      INSERT INTO public.draws (class_id, round, position, entry_id)
      VALUES (v_class.id, 1, v_position, v_entry.id)
      ON CONFLICT (class_id, round, position) DO NOTHING;
      
      v_position := v_position + 1;
    END LOOP;
  END LOOP;
  
  RETURN jsonb_build_object('success', true, 'event_id', p_event_id);
END;
$$;

CREATE OR REPLACE FUNCTION public.result_record(
  p_entry_id UUID,
  p_round INT,
  p_payload JSONB
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.results (
    entry_id, round, time_ms, penalties_ms, score, dnf, notes
  ) VALUES (
    p_entry_id,
    p_round,
    (p_payload->>'time_ms')::int,
    COALESCE((p_payload->>'penalties_ms')::int, 0),
    (p_payload->>'score')::numeric,
    COALESCE((p_payload->>'dnf')::boolean, false),
    p_payload->>'notes'
  )
  ON CONFLICT (entry_id, round) DO UPDATE SET
    time_ms = EXCLUDED.time_ms,
    penalties_ms = EXCLUDED.penalties_ms,
    score = EXCLUDED.score,
    dnf = EXCLUDED.dnf,
    notes = EXCLUDED.notes;
END;
$$;

CREATE OR REPLACE FUNCTION public.payout_compute(p_class_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_total_pot INT := 0;
  v_place INT := 1;
  v_entry RECORD;
  v_payout_pct NUMERIC;
BEGIN
  -- Calculate total pot
  SELECT COALESCE(SUM(fees_cents), 0) + COALESCE(MAX(ec.added_money_cents), 0)
  INTO v_total_pot
  FROM public.entries e
  JOIN public.event_classes ec ON ec.id = e.class_id
  WHERE e.class_id = p_class_id AND e.status IN ('accepted', 'completed');
  
  -- Simple split: top 4 places get 40%, 30%, 20%, 10%
  FOR v_entry IN
    SELECT e.id, r.time_ms + r.penalties_ms as total_time
    FROM public.entries e
    JOIN public.results r ON r.entry_id = e.id
    WHERE e.class_id = p_class_id AND e.status = 'completed' AND NOT r.dnf
    ORDER BY total_time ASC
    LIMIT 4
  LOOP
    v_payout_pct := CASE v_place
      WHEN 1 THEN 0.40
      WHEN 2 THEN 0.30
      WHEN 3 THEN 0.20
      WHEN 4 THEN 0.10
      ELSE 0
    END;
    
    INSERT INTO public.payouts (class_id, entry_id, place, amount_cents, status)
    VALUES (p_class_id, v_entry.id, v_place, (v_total_pot * v_payout_pct)::int, 'pending')
    ON CONFLICT DO NOTHING;
    
    v_place := v_place + 1;
  END LOOP;
  
  RETURN jsonb_build_object('success', true, 'total_pot', v_total_pot);
END;
$$;