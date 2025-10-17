/**
 * Farm Operations Service
 */

import { supabase } from '@/integrations/supabase/client';

export async function applyCarePlan(horseId: string, templateName: string) {
  const { data, error } = await supabase.rpc('care_plan_apply' as any, {
    p_horse_id: horseId,
    p_template_name: templateName,
  });

  if (error) throw error;
  return data;
}

export async function generateInvoice(boarderId: string, periodStart: string, periodEnd?: string) {
  const { data, error } = await supabase.rpc('invoice_generate' as any, {
    p_boarder_id: boarderId,
    p_period_start: periodStart,
    p_period_end: periodEnd || null,
  });

  if (error) throw error;
  return data;
}

export async function getCalendarFeed(entityId?: string, userId?: string) {
  const { data, error } = await supabase.rpc('calendar_feed' as any, {
    p_entity_id: entityId || null,
    p_user_id: userId || null,
  });

  if (error) throw error;
  return data || [];
}
