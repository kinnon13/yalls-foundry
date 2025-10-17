/**
 * Rodeo Service
 * Handles barrel racing, team roping, and rodeo operations
 */

import { supabase } from '@/integrations/supabase/client';

export type EventClass = {
  id: string;
  event_id: string;
  key: string;
  title: string;
  discipline: 'barrel' | 'team_roping' | 'breakaway' | 'tie_down' | 'steer_wrestling' | 'bull_riding' | 'bronc';
  fees_jsonb: {
    entry_cents: number;
    office_cents: number;
    jackpot_cents: number;
    exhibition_cents: number;
  };
  schedule_block?: string;
  max_entries?: number;
  added_money_cents: number;
  rules_md?: string;
};

export type Entry = {
  id: string;
  class_id: string;
  rider_user_id: string;
  horse_entity_id?: string;
  back_number?: number;
  fees_cents: number;
  status: 'pending' | 'accepted' | 'scratched' | 'no_show' | 'completed';
};

export async function getEventClasses(eventId: string) {
  const { data, error } = await supabase
    .from('event_classes' as any)
    .select('*')
    .eq('event_id', eventId)
    .order('created_at', { ascending: true });
  
  if (error) throw error;
  return (data || []) as any;
}

export async function upsertClass(eventId: string, payload: Partial<EventClass>) {
  const { data, error } = await supabase.rpc('class_upsert', {
    p_event_id: eventId,
    p_payload: payload as any
  });
  
  if (error) throw error;
  return data;
}

export async function getClassEntries(classId: string) {
  const { data, error } = await supabase
    .from('entries' as any)
    .select('*, rider:profiles!rider_user_id(display_name), horse:entities!horse_entity_id(display_name)')
    .eq('class_id', classId)
    .order('created_at', { ascending: true });
  
  if (error) throw error;
  return data || [];
}

export async function submitEntry(
  classId: string,
  riderUserId: string,
  horseEntityId?: string,
  opts?: any
) {
  const { data, error } = await supabase.rpc('entry_submit', {
    p_class_id: classId,
    p_rider_user_id: riderUserId,
    p_horse_entity_id: horseEntityId || null,
    p_opts: opts || {}
  });
  
  if (error) throw error;
  return data;
}

export async function generateDraw(eventId: string, opts?: any) {
  const { data, error } = await supabase.rpc('draw_generate', {
    p_event_id: eventId,
    p_opts: opts || {}
  });
  
  if (error) throw error;
  return data;
}

export async function getClassDraw(classId: string, round = 1) {
  const { data, error } = await supabase
    .from('draws' as any)
    .select('*, entry:entries!entry_id(*, rider:profiles!rider_user_id(display_name), horse:entities!horse_entity_id(display_name))')
    .eq('class_id', classId)
    .eq('round', round)
    .order('position', { ascending: true });
  
  if (error) throw error;
  return data || [];
}

export async function recordResult(entryId: string, round: number, payload: {
  time_ms?: number;
  penalties_ms?: number;
  score?: number;
  dnf?: boolean;
  notes?: string;
}) {
  const { error } = await supabase.rpc('result_record', {
    p_entry_id: entryId,
    p_round: round,
    p_payload: payload as any
  });
  
  if (error) throw error;
}

export async function getClassResults(classId: string) {
  const { data, error } = await supabase
    .from('results' as any)
    .select('*, entry:entries!entry_id(*, rider:profiles!rider_user_id(display_name), horse:entities!horse_entity_id(display_name))')
    .eq('entry.class_id', classId)
    .order('time_ms', { ascending: true });
  
  if (error) throw error;
  return data || [];
}

export async function computePayouts(classId: string) {
  const { data, error } = await supabase.rpc('payout_compute', {
    p_class_id: classId
  });
  
  if (error) throw error;
  return data;
}

export async function getClassPayouts(classId: string) {
  const { data, error } = await supabase
    .from('payouts' as any)
    .select('*, entry:entries!entry_id(*, rider:profiles!rider_user_id(display_name))')
    .eq('class_id', classId)
    .order('place', { ascending: true });
  
  if (error) throw error;
  return data || [];
}
