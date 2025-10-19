/**
 * Locked Pins Hook - Extended with lock support
 * Manages user pins with auto-follow locking
 */

import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { PIN_FEATURES } from '@/lib/features/pin-config';
import { rocker } from '@/lib/rocker/event-bus';

export interface AppPin {
  id: string;
  userId: string;
  pinType: string;
  refId: string;
  title?: string;
  metadata: Record<string, any>;
  folderId?: string;
  sortIndex: number;
  createdAt: string;
  origin: 'manual' | 'auto_follow';
  lockedUntil: string | null;
  lockReason: string | null;
  useCount: number;
}

export function useLockedPins() {
  const [pins, setPins] = useState<AppPin[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadPins();
    const channel = supabase.channel('user_pins_changes').on('postgres_changes', { event: '*', schema: 'public', table: 'user_pins' }, () => loadPins()).subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  async function loadPins() {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) { setLoading(false); return; }
    const { data, error } = await supabase.from('user_pins').select('*').eq('user_id', user.user.id).order('sort_index', { ascending: true });
    if (error) { console.error('[pins] Load error:', error); } 
    else { setPins(data.map(row => ({ id: row.id, userId: row.user_id, pinType: row.pin_type, refId: row.ref_id, title: row.title || undefined, metadata: row.metadata as any, folderId: row.folder_id || undefined, sortIndex: row.sort_index, createdAt: row.created_at, origin: (row as any).origin || 'manual', lockedUntil: (row as any).locked_until || null, lockReason: (row as any).lock_reason || null, useCount: (row as any).use_count || 0 }))); }
    setLoading(false);
  }

  const isLocked = (pin: AppPin): boolean => { if (!pin.lockedUntil) return false; return new Date(pin.lockedUntil) > new Date(); };
  const canUnlock = (pin: AppPin): boolean => { return pin.useCount >= PIN_FEATURES.PIN_MIN_INTERACTIONS; };
  const unpin = async (pinId: string) => { const pin = pins.find(p => p.id === pinId); if (!pin) return; if (isLocked(pin)) { const daysLeft = Math.ceil((new Date(pin.lockedUntil!).getTime() - Date.now()) / (1000 * 60 * 60 * 24)); toast({ title: 'Pin Locked', description: `Auto-added for quick access. Unlocks in ${daysLeft} day${daysLeft === 1 ? '' : 's'}.`, variant: 'default' }); return; } const { error } = await supabase.from('user_pins').delete().eq('id', pinId); if (error) { toast({ title: 'Failed to remove pin', description: error.message, variant: 'destructive' }); } else { rocker.emit('pin_unpinned', { metadata: { pinId, origin: pin.origin } }); toast({ title: 'Removed from pins', description: 'Pin removed successfully.' }); } };
  const incrementUse = async (pinId: string) => { const { data: user } = await supabase.auth.getUser(); if (!user.user) return; const { data, error } = await supabase.rpc('increment_pin_use', { p_pin_id: pinId, p_unlock_threshold: PIN_FEATURES.PIN_MIN_INTERACTIONS }); if (!error && data) { const result = data as { use_count: number; unlocked: boolean }; if (result.unlocked) { rocker.emit('pin_unlocked', { metadata: { pinId, reason: 'use', useCount: result.use_count } }); toast({ title: 'Pin Unlocked', description: 'You can now customize or remove this pin.' }); } rocker.emit('pin_used', { metadata: { pinId, useCount: result.use_count } }); loadPins(); } };

  return { pins, loading, unpin, incrementUse, isLocked, canUnlock };
}
