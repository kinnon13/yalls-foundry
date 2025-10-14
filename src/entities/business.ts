/**
 * Business Entity
 * 
 * Extended profile for businesses with capabilities (30 types like stallion-station, breeder, etc.)
 */

import { z } from 'zod';

// 30 business capability types for equine industry
export const BusinessCapabilitySchema = z.enum([
  'stallion-station',
  'breeder',
  'boarding-facility',
  'training-facility',
  'veterinary-clinic',
  'farrier-service',
  'equine-dentist',
  'equine-insurance',
  'feed-supplier',
  'tack-shop',
  'arena-rental',
  'trail-riding',
  'lesson-program',
  'therapy-program',
  'rescue-shelter',
  'adoption-agency',
  'transport-service',
  'photography-service',
  'event-organizer',
  'show-grounds',
  'racing-stable',
  'polo-club',
  'dressage-barn',
  'jumping-barn',
  'western-ranch',
  'auction-house',
  'bloodstock-agent',
  'equine-lawyer',
  'marketing-agency',
  'other',
]);

export type BusinessCapability = z.infer<typeof BusinessCapabilitySchema>;

export const BusinessSchema = z.object({
  id: z.string().uuid(),
  slug: z.string().min(1),
  name: z.string().min(1),
  description: z.string().nullable(),
  owner_id: z.string().uuid(),
  created_by: z.string().uuid(),
  capabilities: z.array(BusinessCapabilitySchema).default([]),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
});

export type Business = z.infer<typeof BusinessSchema>;

export const CreateBusinessInput = z.object({
  slug: z.string().min(3).max(50).regex(/^[a-z0-9-]+$/),
  name: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
  capabilities: z.array(BusinessCapabilitySchema).min(1).max(10),
});

export const UpdateBusinessInput = z.object({
  name: z.string().min(1).max(200).optional(),
  description: z.string().max(2000).optional(),
  capabilities: z.array(BusinessCapabilitySchema).min(1).max(10).optional(),
});

export type CreateBusinessInputType = z.infer<typeof CreateBusinessInput>;
export type UpdateBusinessInputType = z.infer<typeof UpdateBusinessInput>;
