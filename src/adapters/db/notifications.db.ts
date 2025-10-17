/**
 * DB Notifications Adapter
 * Supabase RPC-backed implementation (stubs for now)
 */

import type { NotificationsPort, NotificationItem, NotificationLane, NotificationType, NotificationCounts } from '@/ports/notifications';
import { callRPC } from '@/lib/rpc/client';

export const notificationsDb: NotificationsPort = {
  async list(userId, lane, opts = {}) {
    const { before, limit = 50 } = opts;
    return callRPC<NotificationItem[]>('notifications_list', {
      p_user_id: userId,
      p_lane: lane,
      p_before: before || null,
      p_limit: limit,
    });
  },

  async markRead(userId, ids) {
    await callRPC('notifications_mark_read', {
      p_user_id: userId,
      p_ids: ids,
    });
  },

  async markAllRead(userId, lane) {
    await callRPC('notifications_mark_all_read', {
      p_user_id: userId,
      p_lane: lane,
    });
  },

  async counts(userId) {
    return callRPC<NotificationCounts>('notifications_counts', {
      p_user_id: userId,
    });
  },

  async enqueueTest(userId, kind) {
    await callRPC('notification_enqueue_test', {
      p_user_id: userId,
      p_kind: kind,
    });
  },
};
