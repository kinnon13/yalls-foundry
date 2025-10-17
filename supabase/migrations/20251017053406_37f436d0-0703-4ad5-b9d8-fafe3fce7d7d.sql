-- PR B1: Stalls & RV Inventory Schema

-- Stalls/RV inventory for events
CREATE TABLE IF NOT EXISTS public.stalls_rv_inventory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('stall', 'rv', 'camper', 'paddock')),
  label TEXT NOT NULL,
  price_cents INT NOT NULL DEFAULT 0,
  available_quantity INT NOT NULL DEFAULT 1,
  reserved_quantity INT NOT NULL DEFAULT 0,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Reservations for stalls/RV
CREATE TABLE IF NOT EXISTS public.stalls_rv_reservations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  inventory_id UUID NOT NULL REFERENCES public.stalls_rv_inventory(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  quantity INT NOT NULL DEFAULT 1,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled')),
  total_cents INT NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_stalls_rv_inventory_event ON public.stalls_rv_inventory(event_id);
CREATE INDEX IF NOT EXISTS idx_stalls_rv_reservations_inventory ON public.stalls_rv_reservations(inventory_id);
CREATE INDEX IF NOT EXISTS idx_stalls_rv_reservations_user ON public.stalls_rv_reservations(user_id);

-- RLS Policies
ALTER TABLE public.stalls_rv_inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stalls_rv_reservations ENABLE ROW LEVEL SECURITY;

-- Stalls inventory: event owners can manage, everyone can view
CREATE POLICY "Event owners can manage stalls inventory"
  ON public.stalls_rv_inventory FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.events e
    WHERE e.id = event_id AND e.created_by = auth.uid()
  ));

CREATE POLICY "Everyone can view stalls inventory"
  ON public.stalls_rv_inventory FOR SELECT
  USING (true);

-- Reservations: users can manage their own, event owners can view all
CREATE POLICY "Users can manage their reservations"
  ON public.stalls_rv_reservations FOR ALL
  USING (user_id = auth.uid());

CREATE POLICY "Event owners can view all reservations"
  ON public.stalls_rv_reservations FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.stalls_rv_inventory i
    JOIN public.events e ON e.id = i.event_id
    WHERE i.id = inventory_id AND e.created_by = auth.uid()
  ));