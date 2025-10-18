/**
 * Notifications Mock Adapter
 * Mock implementation for local development and testing
 */

import type { 
  NotificationsAdapter, 
  Notification, 
  NotificationLane,
  NotificationCounts,
  NotificationPrefs 
} from './notifications-types';

const mockNotifications: Notification[] = [];
let mockPrefs: NotificationPrefs = {
  user_id: '',
  channels: {
    in_app: true,
    email: false,
    push: false,
    sms: false
  },
  categories: {
    priority: { in_app: true, email: true, push: true, sms: false },
    social: { in_app: true, email: false, push: false, sms: false },
    system: { in_app: true, email: false, push: false, sms: false }
  },
  daily_cap: 50,
  digest_frequency: 'off',
  updated_at: new Date().toISOString()
};

export const notificationsMockAdapter: NotificationsAdapter = {
  async listNotifications(userId: string, lane: NotificationLane, before?: string, limit = 50) {
    console.log('[NotificationsMock] listNotifications', { userId, lane, before, limit });
    
    let filtered = mockNotifications
      .filter(n => n.user_id === userId && n.lane === lane);
    
    if (before) {
      filtered = filtered.filter(n => n.created_at < before);
    }
    
    return filtered
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, limit);
  },

  async markRead(userId: string, notificationIds: string[]) {
    console.log('[NotificationsMock] markRead', { userId, notificationIds });
    mockNotifications.forEach(n => {
      if (n.user_id === userId && notificationIds.includes(n.id) && !n.read_at) {
        n.read_at = new Date().toISOString();
      }
    });
  },

  async markAllRead(userId: string, lane: NotificationLane) {
    console.log('[NotificationsMock] markAllRead', { userId, lane });
    mockNotifications.forEach(n => {
      if (n.user_id === userId && n.lane === lane && !n.read_at) {
        n.read_at = new Date().toISOString();
      }
    });
  },

  async getCounts(userId: string): Promise<NotificationCounts> {
    const counts = mockNotifications
      .filter(n => n.user_id === userId && !n.read_at)
      .reduce((acc, n) => {
        acc[n.lane]++;
        return acc;
      }, { priority: 0, social: 0, system: 0 } as NotificationCounts);
    
    console.log('[NotificationsMock] getCounts', { userId, counts });
    return counts;
  },

  async enqueueTest(userId: string, kind: string): Promise<boolean> {
    console.log('[NotificationsMock] enqueueTest', { userId, kind });
    const lane: NotificationLane = 
      kind === 'mention' || kind === 'order' ? 'priority' :
      kind === 'follow' || kind === 'like' || kind === 'repost' ? 'social' :
      'system';
    
    mockNotifications.push({
      id: Math.random().toString(36).slice(2),
      user_id: userId,
      lane,
      type: kind,
      title: `Test ${kind} notification`,
      body: `This is a test ${kind} notification for lane: ${lane}`,
      link: kind === 'order' ? '/orders/test' : kind === 'mention' ? '/posts/test' : undefined,
      created_at: new Date().toISOString()
    });
    
    return true; // Mock always succeeds
  },

  async getPrefs(userId: string): Promise<NotificationPrefs> {
    console.log('[NotificationsMock] getPrefs', { userId });
    return { ...mockPrefs, user_id: userId };
  },

  async updatePrefs(userId: string, patch: Partial<NotificationPrefs>): Promise<NotificationPrefs> {
    console.log('[NotificationsMock] updatePrefs', { userId, patch });
    mockPrefs = {
      ...mockPrefs,
      ...patch,
      user_id: userId,
      updated_at: new Date().toISOString()
    };
    return mockPrefs;
  },

  async getDigestPreview(userId: string) {
    console.log('[NotificationsMock] getDigestPreview', { userId });
    const unread = mockNotifications.filter(n => n.user_id === userId && !n.read_at);
    
    const grouped = unread.reduce((acc, n) => {
      if (!acc[n.lane]) {
        acc[n.lane] = [];
      }
      acc[n.lane].push(n);
      return acc;
    }, {} as Record<NotificationLane, Notification[]>);
    
    return Object.entries(grouped).map(([lane, items]) => ({
      lane: lane as NotificationLane,
      items
    }));
  },

  async sendTestDigest(userId: string) {
    console.log('[NotificationsMock] sendTestDigest', { userId });
    // No-op in mock, just log
  }
};
