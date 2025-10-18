/**
 * Notifications Port
 * Contract for notification delivery & management
 */

export type NotificationLane = 'priority' | 'social' | 'system';
export type NotificationType = 'mention' | 'follow' | 'like' | 'repost' | 'order' | 'system' | 'digest';

export interface NotificationItem {
  id: string;
  user_id: string;
  lane: NotificationLane;
  type: NotificationType;
  title: string;
  body?: string;
  link?: string;
  created_at: string;
  read_at?: string;
}

export interface NotificationCounts {
  priority: number;
  social: number;
  system: number;
}

export interface NotificationsPort {
  list(
    userId: string,
    lane: NotificationLane,
    opts?: { before?: string; limit?: number }
  ): Promise<NotificationItem[]>;
  
  markRead(userId: string, ids: string[]): Promise<void>;
  
  markAllRead(userId: string, lane: NotificationLane): Promise<void>;
  
  counts(userId: string): Promise<NotificationCounts>;
  
  enqueueTest(userId: string, kind: NotificationType): Promise<boolean>;
}

export interface UserNotifPrefs {
  user_id: string;
  channels: {
    in_app: boolean;
    email: boolean;
    push: boolean;
    sms: boolean;
  };
  categories: {
    [key in NotificationLane]: {
      in_app: boolean;
      email: boolean;
      push: boolean;
      sms: boolean;
    };
  };
  quiet_hours?: {
    start: string; // HH:mm format
    end: string;
  };
  daily_cap: number;
  digest_frequency: 'off' | 'daily' | 'weekly';
  updated_at: string;
}

export interface DigestGroup {
  lane: NotificationLane;
  items: NotificationItem[];
}

export interface NotificationPrefsPort {
  get(userId: string): Promise<UserNotifPrefs>;
  
  update(userId: string, patch: Partial<UserNotifPrefs>): Promise<UserNotifPrefs>;
  
  digestPreview(userId: string): Promise<DigestGroup[]>;
  
  sendTestDigest(userId: string): Promise<void>;
}
