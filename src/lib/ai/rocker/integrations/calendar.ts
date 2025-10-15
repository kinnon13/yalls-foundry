/**
 * Rocker Integration: Calendar
 * 
 * Connects calendar management to Rocker for natural language scheduling.
 */

import { emitRockerEvent } from '../bus';

export async function rockerCalendarCreated(params: {
  userId: string;
  calendarId: string;
  calendarType: string;
  name: string;
  sessionId?: string;
}): Promise<void> {
  await emitRockerEvent('user.create.calendar', params.userId, {
    calendarId: params.calendarId,
    calendarType: params.calendarType,
    name: params.name,
  }, params.sessionId);

  // Rocker should:
  // - Confirm calendar creation
  // - Suggest sharing with relevant people
  // - Offer to create first event
}

export async function rockerCalendarEventCreated(params: {
  userId: string;
  eventId: string;
  calendarId: string;
  title: string;
  startsAt: string;
  eventType?: string;
  sessionId?: string;
}): Promise<void> {
  await emitRockerEvent('user.create.calendar_event', params.userId, {
    eventId: params.eventId,
    calendarId: params.calendarId,
    title: params.title,
    startsAt: params.startsAt,
    eventType: params.eventType,
  }, params.sessionId);

  // Rocker should:
  // - Confirm event creation
  // - Check for conflicts
  // - Suggest reminders
  // - Offer to invite attendees
}

export async function rockerCalendarShared(params: {
  userId: string;
  calendarId: string;
  sharedWith: string;
  role: string;
  sessionId?: string;
}): Promise<void> {
  await emitRockerEvent('user.share.calendar', params.userId, {
    calendarId: params.calendarId,
    sharedWith: params.sharedWith,
    role: params.role,
  }, params.sessionId);

  // Rocker should:
  // - Confirm sharing
  // - Explain permissions
  // - Offer to notify recipient
}

export async function rockerCollectionCreated(params: {
  userId: string;
  collectionId: string;
  name: string;
  calendarCount: number;
  sessionId?: string;
}): Promise<void> {
  await emitRockerEvent('user.create.calendar_collection', params.userId, {
    collectionId: params.collectionId,
    name: params.name,
    calendarCount: params.calendarCount,
  }, params.sessionId);

  // Rocker should:
  // - Confirm collection creation
  // - Summarize what's included
  // - Offer ICS feed URL
}
