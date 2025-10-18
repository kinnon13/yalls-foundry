/**
 * Mock Notifications Adapter
 * LocalStorage-backed implementation with lane classification
 */

import type { NotificationsPort, NotificationItem, NotificationLane, NotificationType, NotificationCounts } from '@/ports/notifications';
import { k, read, write } from './storage';

const NOTIFS_KEY = (userId: string) => k('notifications', userId);
const MAX_NOTIFS = 200;

// Classifier: emulate lane assignment
function classifyLane(type: NotificationType): NotificationLane {
  if (['mention', 'order'].includes(type)) return 'priority';
  if (['follow', 'like', 'repost'].includes(type)) return 'social';
  return 'system';
}

function getAllNotifs(userId: string): NotificationItem[] {
  return read<NotificationItem[]>(NOTIFS_KEY(userId), []);
}

function saveNotifs(userId: string, items: NotificationItem[]) {
  // Cap at 200
  const capped = items.slice(0, MAX_NOTIFS);
  write(NOTIFS_KEY(userId), capped);
}

export const notificationsMock: NotificationsPort = {
  async list(userId, lane, opts = {}) {
    const { before, limit = 50 } = opts;
    let all = getAllNotifs(userId);
    
    // Filter by lane
    all = all.filter(n => n.lane === lane);
    
    // Filter by before timestamp
    if (before) {
      all = all.filter(n => new Date(n.created_at) < new Date(before));
    }
    
    // Sort by created_at desc
    all.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    
    // Limit
    return all.slice(0, limit);
  },

  async markRead(userId, ids) {
    const all = getAllNotifs(userId);
    const now = new Date().toISOString();
    
    all.forEach(n => {
      if (ids.includes(n.id) && !n.read_at) {
        n.read_at = now;
      }
    });
    
    saveNotifs(userId, all);
  },

  async markAllRead(userId, lane) {
    const all = getAllNotifs(userId);
    const now = new Date().toISOString();
    
    all.forEach(n => {
      if (n.lane === lane && !n.read_at) {
        n.read_at = now;
      }
    });
    
    saveNotifs(userId, all);
  },

  async counts(userId) {
    const all = getAllNotifs(userId);
    const unread = all.filter(n => !n.read_at);
    
    return {
      priority: unread.filter(n => n.lane === 'priority').length,
      social: unread.filter(n => n.lane === 'social').length,
      system: unread.filter(n => n.lane === 'system').length,
    };
  },

  async enqueueTest(userId, kind) {
    const all = getAllNotifs(userId);
    const lane = classifyLane(kind);
    
    const testNotif: NotificationItem = {
      id: `test-${Date.now()}-${Math.random()}`,
      user_id: userId,
      lane,
      type: kind,
      title: `Test ${kind} notification`,
      body: `This is a test ${kind} notification for lane: ${lane}`,
      link: kind === 'order' ? '/orders/test' : kind === 'mention' ? '/posts/test' : undefined,
      created_at: new Date().toISOString(),
    };
    
    all.unshift(testNotif);
    saveNotifs(userId, all);
    return true; // Mock always succeeds
  },
};
