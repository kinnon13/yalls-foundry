import { ProfilePinsPort, ProfilePin } from '@/ports/profilePins';
import { supabase } from '@/integrations/supabase/client';

export const profilePinsDb: ProfilePinsPort = {
  async list(userId): Promise<ProfilePin[]> {
    // TODO: Wire when profile_pins_get RPC exists
    return [];
  },

  async set(userId, pins) {
    // TODO: Wire when profile_pins_set RPC exists
  },

  async add(userId, pin) {
    // TODO: implement profile_pins_add RPC
    throw new Error('DB adapter not fully wired yet');
  },

  async remove(userId, pinId) {
    // TODO: implement profile_pins_remove RPC
    throw new Error('DB adapter not fully wired yet');
  },

  async reorder(userId, orderedIds) {
    // TODO: implement profile_pins_reorder RPC
    throw new Error('DB adapter not fully wired yet');
  },
};
