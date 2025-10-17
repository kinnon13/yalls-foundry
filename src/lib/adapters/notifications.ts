/**
 * Notifications Adapter Factory
 * Exports the appropriate adapter based on environment
 */

import { notificationsDbAdapter } from './notifications-db';
import { notificationsMockAdapter } from './notifications-mock';
import type { NotificationsAdapter } from './notifications-types';

const PORTS_MODE = import.meta.env.VITE_PORTS_MODE || 'mock';

export const notificationsAdapter: NotificationsAdapter = 
  PORTS_MODE === 'db' ? notificationsDbAdapter : notificationsMockAdapter;

export * from './notifications-types';
