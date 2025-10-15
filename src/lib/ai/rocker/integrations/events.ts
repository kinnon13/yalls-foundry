/**
 * Rocker Integration: Events
 * 
 * Connects event management to Rocker for guidance and validation.
 */

import { logRockerEvent } from '../bus';

export async function rockerEventCreated(params: {
  userId: string;
  eventId: string;
  eventType: string;
  title: string;
  startsAt: string;
  sessionId?: string;
}): Promise<void> {
  await logRockerEvent('user.create.event', params.userId, {
    eventId: params.eventId,
    eventType: params.eventType,
    title: params.title,
    startsAt: params.startsAt,
  }, params.sessionId);

  // Rocker should:
  // - Guide through setup checklist
  // - Check for missing fields
  // - Suggest pricing strategies
}

export async function rockerEventRegistration(params: {
  userId: string;
  eventId: string;
  sessionId?: string;
}): Promise<void> {
  await logRockerEvent('user.register.event', params.userId, {
    eventId: params.eventId,
  }, params.sessionId);

  // Rocker may:
  // - Send confirmation
  // - Suggest related events
  // - Track attendance patterns
}
