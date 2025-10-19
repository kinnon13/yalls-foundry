/**
 * CRM Supabase Adapter
 * Real implementation for CRM operations
 */

import { supabase } from '@/integrations/supabase/client';
import type { AppAdapter, AdapterContext, AdapterResult } from './types';

export const crmAdapter: AppAdapter = {
  async execute(appId, actionId, params, ctx): Promise<AdapterResult> {
    try {
      switch (actionId) {
        case 'create_contact':
          return await createContact(params, ctx);
        
        case 'update_contact':
          return await updateContact(params, ctx);
        
        case 'delete_contact':
          return await deleteContact(params, ctx);
        
        case 'list_contacts':
          return await listContacts(params, ctx);
        
        case 'search_contacts':
          return await searchContacts(params, ctx);
        
        default:
          return {
            success: false,
            error: `Unknown CRM action: ${actionId}`
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

async function createContact(params: any, ctx: AdapterContext): Promise<AdapterResult> {
  const { name, email, phone, tags } = params;
  
  const { data, error } = await supabase
    .from('crm_contacts')
    .insert({
      owner_user_id: ctx.userId,
      name,
      email,
      phone,
      tags: tags || [],
      business_id: ctx.contextId,
      tenant_id: ctx.userId
    })
    .select()
    .single();

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true, data };
}

async function updateContact(params: any, ctx: AdapterContext): Promise<AdapterResult> {
  const { id, ...updates } = params;
  
  const { data, error } = await supabase
    .from('crm_contacts')
    .update(updates)
    .eq('id', id)
    .eq('owner_user_id', ctx.userId)
    .select()
    .single();

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true, data };
}

async function deleteContact(params: any, ctx: AdapterContext): Promise<AdapterResult> {
  const { id } = params;
  
  const { error } = await supabase
    .from('crm_contacts')
    .delete()
    .eq('id', id)
    .eq('owner_user_id', ctx.userId);

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true };
}

async function listContacts(params: any, ctx: AdapterContext): Promise<AdapterResult> {
  const { limit = 50, offset = 0 } = params;
  
  const { data, error } = await supabase
    .from('crm_contacts')
    .select('*')
    .eq('owner_user_id', ctx.userId)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true, data };
}

async function searchContacts(params: any, ctx: AdapterContext): Promise<AdapterResult> {
  const { query } = params;
  
  const { data, error } = await supabase
    .from('crm_contacts')
    .select('*')
    .eq('owner_user_id', ctx.userId)
    .or(`name.ilike.%${query}%,email.ilike.%${query}%,phone.ilike.%${query}%`)
    .limit(20);

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true, data };
}
