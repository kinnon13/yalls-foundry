/**
 * Notifications Types
 * Shared types for notification adapters
 */

export type NotificationLane = 'priority' | 'social' | 'system';

export interface Notification {
  id: string;
  user_id: string;
  lane: NotificationLane;
  type: string;
  title: string;
  body?: string;
  link?: string;
  metadata?: Record<string, any>;
  created_at: string;
  read_at?: string;
}

export interface NotificationCounts {
  priority: number;
  social: number;
  system: number;
}

export interface NotificationPrefs {
  user_id: string;
  channels: {
    in_app: boolean;
    email: boolean;
    push: boolean;
    sms: boolean;
  };
  categories: {
    priority: {
      in_app: boolean;
      email: boolean;
      push: boolean;
      sms: boolean;
    };
    social: {
      in_app: boolean;
      email: boolean;
      push: boolean;
      sms: boolean;
    };
    system: {
      in_app: boolean;
      email: boolean;
      push: boolean;
      sms: boolean;
    };
  };
  quiet_hours?: {
    start: string;
    end: string;
  };
  daily_cap: number;
  digest_frequency: 'off' | 'daily' | 'weekly';
  updated_at: string;
}

export interface NotificationsAdapter {
  listNotifications(
    userId: string, 
    lane: NotificationLane, 
    before?: string, 
    limit?: number
  ): Promise<Notification[]>;
  
  markRead(userId: string, notificationIds: string[]): Promise<void>;
  
  markAllRead(userId: string, lane: NotificationLane): Promise<void>;
  
  getCounts(userId: string): Promise<NotificationCounts>;
  
  enqueueTest(userId: string, kind: string): Promise<void>;
  
  getPrefs(userId: string): Promise<NotificationPrefs>;
  
  updatePrefs(
    userId: string, 
    patch: Partial<NotificationPrefs>
  ): Promise<NotificationPrefs>;
  
  getDigestPreview(
    userId: string
  ): Promise<Array<{ lane: NotificationLane; items: Notification[] }>>;
  
  sendTestDigest(userId: string): Promise<void>;
}
