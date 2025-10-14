/**
 * Entity Profile Types
 * 
 * Discriminated union with Zod validation for billion-scale entity management.
 */

import { z } from 'zod';

// Profile type enum matching DB
export const ProfileTypeSchema = z.enum([
  'horse',
  'farm',
  'business',
  'animal',
  'rider',
  'owner',
  'breeder',
]);

export type ProfileType = z.infer<typeof ProfileTypeSchema>;

// Base profile schema
export const BaseProfileSchema = z.object({
  id: z.string().uuid(),
  type: ProfileTypeSchema,
  name: z.string().min(1).max(200),
  custom_fields: z.record(z.unknown()).default({}),
  is_claimed: z.boolean().default(false),
  claimed_by: z.string().uuid().nullable().optional(),
  tenant_id: z.string().uuid().nullable().optional(),
  embedding: z.array(z.number()).nullable().optional(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
});

export type BaseProfile = z.infer<typeof BaseProfileSchema>;

// Create profile input
export const CreateProfileSchema = BaseProfileSchema.omit({
  id: true,
  created_at: true,
  updated_at: true,
  is_claimed: true,
}).partial({
  claimed_by: true,
  tenant_id: true,
  embedding: true,
});

export type CreateProfileInput = z.infer<typeof CreateProfileSchema>;

// Update profile input
export const UpdateProfileSchema = BaseProfileSchema.partial().required({ id: true });

export type UpdateProfileInput = z.infer<typeof UpdateProfileSchema>;

/**
 * Safe parse custom_fields with Zod schema
 */
export function parseCustomFields<T extends z.ZodType>(
  fields: unknown,
  schema: T
): z.infer<T> | null {
  const result = schema.safeParse(fields);
  return result.success ? result.data : null;
}
