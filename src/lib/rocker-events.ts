/**
 * Rocker Event Emitters
 * Helper functions to emit events throughout the platform
 */

import { rockerBus, type RockerEventType } from '@/lib/ai/rocker/bus';
import { resolveTenantId } from '@/lib/tenancy/context';

/**
 * Emit a user action event
 */
export async function emitUserAction(
  type: RockerEventType,
  userId: string,
  payload: Record<string, any> = {}
) {
  try {
    const tenantId = await resolveTenantId(userId);
    await rockerBus.emit({
      type,
      userId,
      tenantId,
      payload,
    });
  } catch (error) {
    console.error('[RockerEvents] Failed to emit event:', error);
  }
}

// Convenience functions for common events

export const rockerEvents = {
  createProfile: (userId: string, profileData: any) =>
    emitUserAction('user.create.profile', userId, profileData),
    
  updateProfile: (userId: string, updates: any) =>
    emitUserAction('user.update.profile', userId, updates),
    
  createPost: (userId: string, postData: any) =>
    emitUserAction('user.create.post', userId, postData),
    
  createCalendar: (userId: string, calendarData: any) =>
    emitUserAction('user.create.calendar', userId, calendarData),
    
  createCalendarEvent: (userId: string, eventData: any) =>
    emitUserAction('user.create.calendar_event', userId, eventData),
    
  createBusiness: (userId: string, businessData: any) =>
    emitUserAction('user.create.business', userId, businessData),
    
  searchPerformed: (userId: string, query: string) =>
    emitUserAction('user.search', userId, { query }),
    
  uploadMedia: (userId: string, mediaData: any) =>
    emitUserAction('user.upload.media', userId, mediaData),
};
