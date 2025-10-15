/**
 * Rocker Integration: Business
 * 
 * Connects business operations to Rocker event bus.
 */

import { logRockerEvent } from '../bus';
import { supabase } from '@/integrations/supabase/client';

export async function rockerBusinessCreated(params: {
  userId: string;
  businessId: string;
  name: string;
  sessionId?: string;
}): Promise<void> {
  await logRockerEvent('user.create.business', params.userId, {
    businessId: params.businessId,
    name: params.name,
  }, params.sessionId);
}

export async function createBusinessWithRocker(params: {
  userId: string;
  name: string;
  description?: string;
  sessionId?: string;
}): Promise<{ businessId: string }> {
  const { data: business, error } = await supabase
    .from('businesses')
    .insert({
      name: params.name,
      description: params.description,
      owner_id: params.userId,
      created_by: params.userId,
      slug: params.name.toLowerCase().replace(/\s+/g, '-')
    })
    .select()
    .single();

  if (error) throw error;

  await rockerBusinessCreated({
    userId: params.userId,
    businessId: business.id,
    name: params.name,
    sessionId: params.sessionId
  });

  return { businessId: business.id };
}

export async function createCRMContactWithRocker(params: {
  userId: string;
  businessId: string;
  name: string;
  email?: string;
  phone?: string;
  notes?: string;
  sessionId?: string;
}): Promise<{ contactId: string }> {
  const { data: contact, error } = await supabase
    .from('crm_contacts')
    .insert({
      business_id: params.businessId,
      name: params.name,
      email: params.email,
      phone: params.phone,
      notes: params.notes
    })
    .select()
    .single();

  if (error) throw error;

  await logRockerEvent('user.create.crm_contact', params.userId, {
    contactId: contact.id,
    businessId: params.businessId,
    name: params.name,
  }, params.sessionId);

  return { contactId: contact.id };
}
