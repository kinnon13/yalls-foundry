/**
 * Rocker Voice Utilities
 * Helper functions for voice communication
 */

import { supabase } from '@/integrations/supabase/client';

export interface VoiceCallOptions {
  message: string;
  phoneNumber?: string;
  approvalId?: string;
}

export interface VoiceMessageOptions {
  message: string;
  phoneNumber?: string;
}

export interface SMSOptions {
  message: string;
  phoneNumber?: string;
  metadata?: Record<string, any>;
}

/**
 * Initiate a voice call to the user
 */
export async function initiateVoiceCall(options: VoiceCallOptions) {
  const { data, error } = await supabase.functions.invoke('rocker-voice-call', {
    body: {
      action: 'initiate_call',
      message: options.message,
      to: options.phoneNumber,
      approval_id: options.approvalId,
    },
  });

  if (error) throw error;
  return data;
}

/**
 * Send an SMS text message to the user
 */
export async function sendSMS(options: SMSOptions) {
  const { data, error } = await supabase.functions.invoke('rocker-voice-call', {
    body: {
      action: 'send_sms',
      message: options.message,
      to: options.phoneNumber,
      metadata: options.metadata,
    },
  });

  if (error) throw error;
  return data;
}

/**
 * Send a voice message to the user
 */
export async function sendVoiceMessage(options: VoiceMessageOptions) {
  const { data, error } = await supabase.functions.invoke('rocker-voice-call', {
    body: {
      action: 'send_voice_message',
      message: options.message,
      to: options.phoneNumber,
    },
  });

  if (error) throw error;
  return data;
}

/**
 * Check if voice calls are currently allowed for a user
 */
export async function canInitiateCall(userId: string): Promise<boolean> {
  const { data, error } = await supabase.rpc('can_initiate_voice_call', {
    p_user_id: userId,
  });

  if (error) {
    console.error('Error checking voice call permission:', error);
    return false;
  }

  return data || false;
}

/**
 * Get voice preferences for current user
 */
export async function getVoicePreferences() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from('voice_preferences')
    .select('*')
    .eq('user_id', user.id)
    .maybeSingle();

  if (error) {
    console.error('Error fetching voice preferences:', error);
    return null;
  }

  return data;
}
