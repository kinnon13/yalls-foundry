/**
 * Mock Notification Preferences Adapter
 * LocalStorage-backed user preferences
 */

import type { NotificationPrefsPort, UserNotifPrefs, DigestGroup } from '@/ports/notifications';
import { k, read, write } from './storage';
import { notificationsMock } from './notifications.mock';

const PREFS_KEY = (userId: string) => k('notification-prefs', userId);

const DEFAULT_PREFS: Omit<UserNotifPrefs, 'user_id'> = {
  channels: {
    in_app: true,
    email: false,
    push: false,
    sms: false,
  },
  categories: {
    priority: { in_app: true, email: true, push: true, sms: false },
    social: { in_app: true, email: false, push: false, sms: false },
    system: { in_app: true, email: false, push: false, sms: false },
  },
  quiet_hours: undefined,
  daily_cap: 50,
  digest_frequency: 'off',
  updated_at: new Date().toISOString(),
};

export const notificationPrefsMock: NotificationPrefsPort = {
  async get(userId) {
    const stored = read<UserNotifPrefs | null>(PREFS_KEY(userId), null);
    if (stored) return stored;
    
    const prefs: UserNotifPrefs = {
      user_id: userId,
      ...DEFAULT_PREFS,
    };
    write(PREFS_KEY(userId), prefs);
    return prefs;
  },

  async update(userId, patch) {
    const current = await this.get(userId);
    const updated: UserNotifPrefs = {
      ...current,
      ...patch,
      channels: patch.channels ? { ...current.channels, ...patch.channels } : current.channels,
      categories: patch.categories ? { ...current.categories, ...patch.categories } : current.categories,
      updated_at: new Date().toISOString(),
    };
    write(PREFS_KEY(userId), updated);
    return updated;
  },

  async digestPreview(userId) {
    // Fetch unread from each lane
    const [priority, social, system] = await Promise.all([
      notificationsMock.list(userId, 'priority', { limit: 10 }),
      notificationsMock.list(userId, 'social', { limit: 10 }),
      notificationsMock.list(userId, 'system', { limit: 10 }),
    ]);

    const groups: DigestGroup[] = [];
    if (priority.length > 0) groups.push({ lane: 'priority', items: priority.filter(n => !n.read_at) });
    if (social.length > 0) groups.push({ lane: 'social', items: social.filter(n => !n.read_at) });
    if (system.length > 0) groups.push({ lane: 'system', items: system.filter(n => !n.read_at) });

    return groups;
  },

  async sendTestDigest(userId) {
    // Mock: just log
    console.log('[Mock] Sending test digest to user:', userId);
    // In real impl, this would trigger edge function
  },
};
