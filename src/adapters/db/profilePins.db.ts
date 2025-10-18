import { ProfilePinsPort, ProfilePin } from '@/ports/profilePins';
import { supabase } from '@/integrations/supabase/client';

export const profilePinsDb: ProfilePinsPort = {
  async list(userId): Promise<ProfilePin[]> {
    const { data, error } = await supabase.rpc('profile_pins_list' as any, {
      p_user_id: userId
    });
    if (error) throw error;
    const rows = (data as any[]) || [];
    return rows.map((row: any) => ({
      id: row.id,
      user_id: row.user_id,
      pin_type: row.pin_type,
      ref_id: row.ref_id,
      position: row.position,
      title: row.title,
      metadata: row.metadata,
      created_at: row.created_at
    }));
  },

  async set(userId, pins) {
    const { error } = await supabase.rpc('profile_pins_set' as any, {
      p_pins: JSON.stringify(pins)
    } as any);
    if (error) throw error;
  },

  async add(userId, pin) {
    const { data, error } = await supabase.rpc('profile_pins_add' as any, {
      p_pin_type: pin.pin_type,
      p_ref_id: pin.ref_id,
      p_title: pin.title || null,
      p_metadata: pin.metadata || {}
    } as any);
    if (error) throw error;
    const result = data as any;
    return {
      id: result.id,
      user_id: result.user_id,
      pin_type: result.pin_type,
      ref_id: result.ref_id,
      position: result.position,
      title: result.title,
      metadata: result.metadata,
      created_at: result.created_at
    };
  },

  async remove(userId, pinId) {
    const { error } = await supabase.rpc('profile_pins_remove' as any, {
      p_pin_id: pinId
    } as any);
    if (error) throw error;
  },

  async reorder(userId, orderedIds) {
    const { error } = await supabase.rpc('profile_pins_reorder' as any, {
      p_ordered_ids: orderedIds
    } as any);
    if (error) throw error;
  },
};
