/**
 * Events Supabase Adapter
 * Real implementation for event operations
 */

import { supabase } from '@/integrations/supabase/client';
import type { AppAdapter, AdapterContext, AdapterResult } from './types';

export const eventsAdapter: AppAdapter = {
  async execute(appId, actionId, params, ctx): Promise<AdapterResult> {
    try {
      switch (actionId) {
        case 'create_event':
          return await createEvent(params, ctx);
        
        case 'update_event':
          return await updateEvent(params, ctx);
        
        case 'delete_event':
          return await deleteEvent(params, ctx);
        
        case 'list_events':
          return await listEvents(params, ctx);
        
        case 'flag_conflict':
          return await flagConflict(params, ctx);
        
        default:
          return {
            success: false,
            error: `Unknown events action: ${actionId}`
          };
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
};

async function createEvent(params: any, ctx: AdapterContext): Promise<AdapterResult> {
  const { title, description, starts_at, ends_at, location } = params;
  
  const { data, error } = await supabase
    .from('events')
    .insert({
      title,
      description,
      starts_at,
      ends_at,
      location: location || {},
      event_type: 'general'
    })
    .select()
    .single();

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true, data };
}

async function updateEvent(params: any, ctx: AdapterContext): Promise<AdapterResult> {
  const { id, ...updates } = params;
  
  const { data, error } = await supabase
    .from('events')
    .update(updates)
    .eq('id', id)
    .eq('created_by', ctx.userId)
    .select()
    .single();

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true, data };
}

async function deleteEvent(params: any, ctx: AdapterContext): Promise<AdapterResult> {
  const { id } = params;
  
  const { error } = await supabase
    .from('events')
    .delete()
    .eq('id', id)
    .eq('created_by', ctx.userId);

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true };
}

async function listEvents(params: any, ctx: AdapterContext): Promise<AdapterResult> {
  const { limit = 50, offset = 0, future_only = true } = params;
  
  let query = supabase
    .from('events')
    .select('*')
    .order('starts_at', { ascending: true });

  if (future_only) {
    query = query.gte('starts_at', new Date().toISOString());
  }

  const { data, error } = await query.range(offset, offset + limit - 1);

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true, data };
}

async function flagConflict(params: any, ctx: AdapterContext): Promise<AdapterResult> {
  const { event_id, conflicting_events, severity } = params;
  
  // Log conflict to AI action ledger
  const { error } = await supabase
    .from('ai_action_ledger')
    .insert({
      user_id: ctx.userId,
      agent: 'event_conflict_detector',
      action: 'flag_conflict',
      input: { event_id, conflicting_events },
      output: { severity },
      result: 'success'
    });

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true, data: { flagged: true, severity } };
}
