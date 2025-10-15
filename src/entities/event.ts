/**
 * Event Entity
 * 
 * Zod schema for equine events (shows, clinics, sales, expos, conferences).
 * Extends entity profile with event-specific fields.
 */

import { z } from 'zod';

export const eventTypeEnum = z.enum(['show', 'clinic', 'sale', 'expo', 'conference']);
export type EventType = z.infer<typeof eventTypeEnum>;

export const resultStatusEnum = z.enum(['uploaded', 'audited', 'approved', 'published', 'rejected']);
export type ResultStatus = z.infer<typeof resultStatusEnum>;

/**
 * Event class/division entry
 */
export const eventClassSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().optional(),
  entries: z.number().int().nonnegative().default(0),
  fee_cents: z.number().int().nonnegative().optional(),
});

export type EventClass = z.infer<typeof eventClassSchema>;

/**
 * Core event schema
 */
export const eventSchema = z.object({
  id: z.string().uuid(),
  slug: z.string().min(1).max(100),
  title: z.string().min(1).max(200),
  type: eventTypeEnum,
  starts_at: z.string().datetime(),
  ends_at: z.string().datetime().optional(),
  business_id: z.string().uuid().optional().nullable(),
  created_by: z.string().uuid(),
  embedding: z.array(z.number()).length(384).optional().nullable(),
  location: z.object({
    lat: z.number().min(-90).max(90),
    lng: z.number().min(-180).max(180),
    name: z.string().optional(),
  }).optional().nullable(),
  metadata: z.object({
    classes: z.array(eventClassSchema).optional(),
    venue: z.string().optional(),
    contact_email: z.string().email().optional(),
    contact_phone: z.string().optional(),
    registration_url: z.string().url().optional(),
    prize_money_cents: z.number().int().nonnegative().optional(),
  }).optional(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
});

export type Event = z.infer<typeof eventSchema>;

/**
 * Event result (uploaded CSV/JSON from show management software)
 */
export const eventResultSchema = z.object({
  id: z.string().uuid(),
  event_id: z.string().uuid(),
  uploader_id: z.string().uuid(),
  sha256: z.string().length(64),
  data: z.record(z.any()), // Raw JSONB from upload
  status: resultStatusEnum,
  approved: z.boolean(),
  embedding: z.array(z.number()).length(384).optional().nullable(),
  uploaded_at: z.string().datetime(),
});

export type EventResult = z.infer<typeof eventResultSchema>;

/**
 * Payout ledger entry (append-only)
 */
export const payoutSchema = z.object({
  id: z.string().uuid(),
  event_id: z.string().uuid(),
  recipient_user_id: z.string().uuid(),
  amount_cents: z.bigint().nonnegative(),
  currency: z.string().length(3),
  status: z.enum(['pending', 'paid', 'failed']),
  idempotency_key: z.string(),
  metadata: z.record(z.any()).optional(),
  created_at: z.string().datetime(),
});

export type Payout = z.infer<typeof payoutSchema>;

/**
 * Create event input (for form validation)
 */
export const createEventSchema = eventSchema
  .omit({ id: true, created_by: true, embedding: true, created_at: true, updated_at: true })
  .extend({
    starts_at: z.string().datetime(),
    ends_at: z.string().datetime().optional(),
  });

export type CreateEventInput = z.infer<typeof createEventSchema>;
