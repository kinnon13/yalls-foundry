/**
 * DB Notification Preferences Adapter
 * Supabase RPC-backed implementation (stubs for now)
 */

import type { NotificationPrefsPort, UserNotifPrefs, DigestGroup } from '@/ports/notifications';
import { callRPC } from '@/lib/rpc/client';

export const notificationPrefsDb: NotificationPrefsPort = {
  async get(userId) {
    return callRPC<UserNotifPrefs>('notification_prefs_get', {
      p_user_id: userId,
    });
  },

  async update(userId, patch) {
    return callRPC<UserNotifPrefs>('notification_prefs_update', {
      p_user_id: userId,
      p_patch: patch,
    });
  },

  async digestPreview(userId) {
    return callRPC<DigestGroup[]>('notification_digest_preview', {
      p_user_id: userId,
    });
  },

  async sendTestDigest(userId) {
    await callRPC('notification_digest_send_test', {
      p_user_id: userId,
    });
  },
};
