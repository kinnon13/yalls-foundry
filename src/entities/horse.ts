/**
 * Horse Entity Type
 * 
 * Extends base profile with horse-specific fields and Zod validation.
 */

import { z } from 'zod';
import { BaseProfileSchema, ProfileType } from './profile';

// Horse-specific custom fields schema
export const HorseFieldsSchema = z.object({
  breed: z.string().optional(),
  dob: z.string().date().optional(),
  sex: z.enum(['M', 'F', 'Gelding']).optional(),
  color: z.string().optional(),
  height: z.number().positive().optional(), // hands
  pedigree: z
    .object({
      sire: z.string().optional(),
      dam: z.string().optional(),
      sire_of_dam: z.string().optional(),
      dam_of_dam: z.string().optional(),
    })
    .optional(),
  discipline: z.array(z.string()).optional(),
  achievements: z.array(z.string()).optional(),
  registration_numbers: z.record(z.string()).optional(), // { "AQHA": "123456", ... }
  location: z.string().optional(),
  status: z.enum(['active', 'retired', 'deceased']).default('active'),
});

export type HorseFields = z.infer<typeof HorseFieldsSchema>;

// Full horse profile (base + custom fields)
export const HorseProfileSchema = BaseProfileSchema.extend({
  type: z.literal('horse' as ProfileType),
  custom_fields: HorseFieldsSchema,
});

export type HorseProfile = z.infer<typeof HorseProfileSchema>;

// Create horse input
export const CreateHorseSchema = z.object({
  name: z.string().min(1).max(200),
  type: z.literal('horse' as ProfileType),
  custom_fields: HorseFieldsSchema,
  claimed_by: z.string().uuid().optional(),
  tenant_id: z.string().uuid().optional(),
});

export type CreateHorseInput = z.infer<typeof CreateHorseSchema>;

/**
 * Parse and validate horse fields from JSONB
 */
export function parseHorseFields(fields: unknown): HorseFields | null {
  const result = HorseFieldsSchema.safeParse(fields);
  return result.success ? result.data : null;
}

/**
 * Calculate horse age from DOB
 */
export function calculateAge(dob: string): number {
  const birthDate = new Date(dob);
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
}
