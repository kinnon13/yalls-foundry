/**
 * Stallions & Breeding Service
 */

import { supabase } from '@/integrations/supabase/client';

export async function createBreedingContract(
  stallionId: string,
  mareId: string,
  terms?: Record<string, any>
) {
  const { data, error } = await supabase.rpc('breeding_contract_create' as any, {
    p_stallion_id: stallionId,
    p_mare_id: mareId,
    p_terms: terms || {},
  });

  if (error) throw error;
  return data;
}

export async function nominateFoal(foalEntityId: string, programId: string) {
  const { data, error } = await supabase.rpc('nominate_foal' as any, {
    p_foal_entity_id: foalEntityId,
    p_program_id: programId,
  });

  if (error) throw error;
  return data;
}

export async function checkBonusEligibility(foalEntityId: string, eventResultId?: string) {
  const { data, error } = await supabase.rpc('bonus_payout_eligibility' as any, {
    p_foal_entity_id: foalEntityId,
    p_event_result_id: eventResultId || null,
  });

  if (error) throw error;
  return data || [];
}
