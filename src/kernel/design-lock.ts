/**
 * Design Lock
 * Prevents accidental layout changes; requires PIN to unlock
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { rocker } from '@/lib/rocker/event-bus';

interface DesignLockState {
  isLocked: boolean;
  pin: string | null;
}

interface DesignLockStore extends DesignLockState {
  lock: () => void;
  unlock: (pin: string) => boolean;
  setPin: (newPin: string) => void;
  verifyPin: (pin: string) => boolean;
}

export const useDesignLock = create<DesignLockStore>()(
  persist(
    (set, get) => ({
      isLocked: true, // Locked by default
      pin: null,

      lock: () => {
        set({ isLocked: true });
        rocker.emit('design_locked', { metadata: {} });
      },

      unlock: (pin: string) => {
        const { pin: storedPin } = get();
        
        // If no PIN set, allow unlock but prompt to set one
        if (!storedPin) {
          set({ isLocked: false });
          rocker.emit('design_unlocked', { metadata: { requiresPin: true } });
          return true;
        }

        // Verify PIN
        if (pin === storedPin) {
          set({ isLocked: false });
          rocker.emit('design_unlocked', { metadata: { requiresPin: false } });
          return true;
        }

        rocker.emit('design_unlock_failed', { metadata: { pin: '***' } });
        return false;
      },

      setPin: (newPin: string) => {
        set({ pin: newPin });
        rocker.emit('design_pin_set', { metadata: {} });
      },

      verifyPin: (pin: string) => {
        return pin === get().pin;
      },
    }),
    {
      name: 'rocker-design-lock',
    }
  )
);
