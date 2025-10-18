/**
 * Notifications DB Adapter
 * Production adapter using Supabase RPC for notification operations
 */

import { supabase } from '@/integrations/supabase/client';
import type { 
  NotificationsAdapter, 
  Notification, 
  NotificationLane,
  NotificationCounts,
  NotificationPrefs 
} from './notifications-types';

export const notificationsDbAdapter: NotificationsAdapter = {
  async listNotifications(userId: string, lane: NotificationLane, before?: string, limit = 50) {
    const { data, error } = await supabase.rpc('notifications_list' as any, {
      p_user_id: userId,
      p_lane: lane,
      p_before: before || null,
      p_limit: limit
    });

    if (error) {
      console.error('[NotificationsDB] listNotifications error:', error);
      throw error;
    }

    return (data || []) as Notification[];
  },

  async markRead(userId: string, notificationIds: string[]) {
    const { error } = await supabase.rpc('notifications_mark_read' as any, {
      p_user_id: userId,
      p_ids: notificationIds
    });

    if (error) {
      console.error('[NotificationsDB] markRead error:', error);
      throw error;
    }
  },

  async markAllRead(userId: string, lane: NotificationLane) {
    const { error } = await supabase.rpc('notifications_mark_all_read' as any, {
      p_user_id: userId,
      p_lane: lane
    });

    if (error) {
      console.error('[NotificationsDB] markAllRead error:', error);
      throw error;
    }
  },

  async getCounts(userId: string): Promise<NotificationCounts> {
    const { data, error } = await supabase.rpc('notifications_counts' as any, {
      p_user_id: userId
    });

    if (error) {
      console.error('[NotificationsDB] getCounts error:', error);
      throw error;
    }

    if (!data || (Array.isArray(data) && data.length === 0)) {
      return { priority: 0, social: 0, system: 0 };
    }

    return (Array.isArray(data) ? data[0] : data) as NotificationCounts;
  },

  async enqueueTest(userId: string, kind: string) {
    const { error } = await supabase.rpc('notification_enqueue_test' as any, {
      p_user_id: userId,
      p_kind: kind
    });

    if (error) {
      console.error('[NotificationsDB] enqueueTest error:', error);
      throw error;
    }
  },

  async getPrefs(userId: string): Promise<NotificationPrefs> {
    const { data, error } = await supabase.rpc('notification_prefs_get' as any, {
      p_user_id: userId
    });

    if (error) {
      console.error('[NotificationsDB] getPrefs error:', error);
      throw error;
    }

    return data as NotificationPrefs;
  },

  async updatePrefs(userId: string, patch: Partial<NotificationPrefs>): Promise<NotificationPrefs> {
    const { data, error } = await supabase.rpc('notification_prefs_update' as any, {
      p_user_id: userId,
      p_patch: patch as any
    });

    if (error) {
      console.error('[NotificationsDB] updatePrefs error:', error);
      throw error;
    }

    return data as NotificationPrefs;
  },

  async getDigestPreview(userId: string) {
    const { data, error } = await supabase.rpc('notification_digest_preview' as any, {
      p_user_id: userId
    });

    if (error) {
      console.error('[NotificationsDB] getDigestPreview error:', error);
      throw error;
    }

    return (data || []) as Array<{ lane: NotificationLane; items: Notification[] }>;
  },

  async sendTestDigest(userId: string) {
    const { error } = await supabase.rpc('notification_digest_send_test' as any, {
      p_user_id: userId
    });

    if (error) {
      console.error('[NotificationsDB] sendTestDigest error:', error);
      throw error;
    }
  }
};
