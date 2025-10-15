/**
 * Events Service (Supabase)
 * 
 * CRUD + upload/approve results + calculate payouts.
 * Billion-scale: partitioned by starts_at, HNSW for embeddings, append-only ledger.
 */

import { supabase } from '@/integrations/supabase/client';
import type { Event, EventResult, CreateEventInput } from '@/entities/event';

/**
 * Fetch all events (with optional filters)
 */
export async function getAllEvents(filters?: {
  type?: string;
  upcoming?: boolean;
  limit?: number;
}): Promise<Event[]> {
  let query = supabase
    .from('events')
    .select('*')
    .order('starts_at', { ascending: filters?.upcoming ?? true });

  if (filters?.type) {
    query = query.eq('type', filters.type);
  }

  if (filters?.upcoming) {
    query = query.gte('starts_at', new Date().toISOString());
  }

  if (filters?.limit) {
    query = query.limit(filters.limit);
  }

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return data as Event[];
}

/**
 * Fetch single event by ID
 */
export async function getEventById(id: string): Promise<Event | null> {
  const { data, error } = await supabase
    .from('events')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data as Event | null;
}

/**
 * Fetch event by slug
 */
export async function getEventBySlug(slug: string): Promise<Event | null> {
  const { data, error } = await supabase
    .from('events')
    .select('*')
    .eq('slug', slug)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data as Event | null;
}

/**
 * Create event
 */
export async function createEvent(input: CreateEventInput): Promise<Event> {
  const { data: session } = await supabase.auth.getSession();
  if (!session.session) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('events')
    .insert({
      ...input,
      created_by: session.session.user.id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data as Event;
}

/**
 * Update event
 */
export async function updateEvent(id: string, updates: Partial<CreateEventInput>): Promise<Event> {
  const { data, error } = await supabase
    .from('events')
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data as Event;
}

/**
 * Delete event
 */
export async function deleteEvent(id: string): Promise<void> {
  const { error } = await supabase.from('events').delete().eq('id', id);
  if (error) throw new Error(error.message);
}

/**
 * Upload event results (CSV/JSON raw data)
 */
export async function uploadResults(
  eventId: string,
  rawData: Record<string, any>,
  sha256: string
): Promise<EventResult> {
  const { data: session } = await supabase.auth.getSession();
  if (!session.session) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('event_results_raw')
    .insert({
      event_id: eventId,
      uploader_id: session.session.user.id,
      sha256,
      data: rawData,
      status: 'uploaded',
      approved: false,
      uploaded_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data as EventResult;
}

/**
 * Request AI audit of results (via RPC)
 */
export async function requestResultsAudit(eventId: string): Promise<{ success: boolean; audited_count: number }> {
  const { data, error } = await supabase.rpc('request_results_audit', {
    p_event_id: eventId,
  });

  if (error) throw new Error(error.message);
  return data as { success: boolean; audited_count: number };
}

/**
 * Approve results (publish to public view)
 */
export async function approveResults(eventId: string): Promise<{ success: boolean; approved_count: number }> {
  const { data, error } = await supabase.rpc('approve_results', {
    p_event_id: eventId,
  });

  if (error) throw new Error(error.message);
  return data as { success: boolean; approved_count: number };
}

/**
 * Calculate payouts (admin only)
 */
export async function calculatePayouts(eventId: string): Promise<{
  success: boolean;
  event_id: string;
  total_cents: number;
  message: string;
}> {
  const { data, error } = await supabase.rpc('calc_payouts', {
    p_event_id: eventId,
  });

  if (error) throw new Error(error.message);
  return data as { success: boolean; event_id: string; total_cents: number; message: string };
}

/**
 * Fetch approved results for event (public view)
 */
export async function getApprovedResults(eventId: string): Promise<EventResult[]> {
  const { data, error } = await supabase
    .from('event_results')
    .select('*')
    .eq('event_id', eventId)
    .order('uploaded_at', { ascending: false });

  if (error) throw new Error(error.message);
  return data as EventResult[];
}

/**
 * Subscribe to event updates (realtime)
 */
export function subscribeToEvent(eventId: string, callback: (event: Event) => void) {
  const channel = supabase
    .channel(`event:${eventId}`)
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'events',
        filter: `id=eq.${eventId}`,
      },
      (payload) => {
        callback(payload.new as Event);
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}
