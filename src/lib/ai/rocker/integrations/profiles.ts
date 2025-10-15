/**
 * Rocker Integration: Profiles
 * 
 * Connects profile operations to Rocker event bus.
 * Logs all profile actions and enables Rocker suggestions.
 */

import { rockerBus, emitRockerEvent } from '../bus';
import { supabase } from '@/integrations/supabase/client';

// ============= Profile Event Emitters =============

export async function rockerProfileCreated(params: {
  userId: string;
  profileId: string;
  entityType: string;
  name: string;
  sessionId?: string;
}): Promise<void> {
  await emitRockerEvent('user.create.profile', params.userId, {
    profileId: params.profileId,
    entityType: params.entityType,
    name: params.name,
  }, params.sessionId);

  // Rocker should suggest:
  // - Related profiles to link
  // - Tags to add
  // - Photos to upload
}

export async function rockerProfileUpdated(params: {
  userId: string;
  profileId: string;
  changes: Record<string, any>;
  sessionId?: string;
}): Promise<void> {
  await emitRockerEvent('user.update.profile', params.userId, {
    profileId: params.profileId,
    changes: params.changes,
  }, params.sessionId);
}

export async function rockerProfileClaimed(params: {
  userId: string;
  profileId: string;
  entityType: string;
  sessionId?: string;
}): Promise<void> {
  await emitRockerEvent('user.claim.profile', params.userId, {
    profileId: params.profileId,
    entityType: params.entityType,
  }, params.sessionId);

  // Rocker should suggest:
  // - Verification steps
  // - Profile completion checklist
}

export async function rockerProfileViewed(params: {
  userId: string;
  profileId: string;
  entityType: string;
  sessionId?: string;
}): Promise<void> {
  await emitRockerEvent('user.view.profile', params.userId, {
    profileId: params.profileId,
    entityType: params.entityType,
  }, params.sessionId);

  // Rocker may suggest:
  // - Similar profiles
  // - Connection opportunities
}

// ============= Rocker-Enhanced Profile Operations =============

/**
 * Create profile with Rocker awareness
 */
export async function createProfileWithRocker(params: {
  userId: string;
  entityType: 'user' | 'horse' | 'business';
  name: string;
  description?: string;
  customFields?: Record<string, any>;
  sessionId?: string;
}): Promise<{ profileId: string }> {
  // Create profile in database - using any to bypass type issues
  const profileData: any = {
    owner_id: params.userId,
    entity_type: params.entityType,
    name: params.name,
    description: params.description,
    custom_fields: params.customFields || {},
    slug: generateSlug(params.name),
  };

  const { data, error } = await supabase
    .from('entity_profiles')
    .insert(profileData)
    .select('id')
    .single();

  if (error) throw error;

  // Notify Rocker
  await rockerProfileCreated({
    userId: params.userId,
    profileId: data.id,
    entityType: params.entityType,
    name: params.name,
    sessionId: params.sessionId,
  });

  return { profileId: data.id };
}

/**
 * Update profile with Rocker memory
 */
export async function updateProfileWithRocker(params: {
  userId: string;
  profileId: string;
  changes: Partial<{
    name: string;
    description: string;
    customFields: Record<string, any>;
  }>;
  sessionId?: string;
}): Promise<void> {
  // Update database
  const { error } = await supabase
    .from('entity_profiles')
    .update(params.changes)
    .eq('id', params.profileId)
    .eq('owner_id', params.userId);

  if (error) throw error;

  // Notify Rocker (learns from changes)
  await rockerProfileUpdated({
    userId: params.userId,
    profileId: params.profileId,
    changes: params.changes,
    sessionId: params.sessionId,
  });
}

// ============= Helpers =============

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .slice(0, 50);
}
