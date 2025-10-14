/**
 * Profile Registry
 * 
 * Defines type-specific fields for each profile type.
 */

import type { ProfileType } from './types';

export interface ProfileField {
  key: string;
  label: string;
  type?: 'text' | 'date' | 'select';
  options?: string[];
}

/**
 * Registry of fields for each profile type
 */
export const profileFields: Record<ProfileType, ProfileField[]> = {
  horse: [
    { key: 'breed', label: 'Breed', type: 'text' },
    { key: 'dob', label: 'Date of Birth', type: 'date' },
    { key: 'sex', label: 'Sex', type: 'select', options: ['M', 'F'] },
  ],
  farm: [
    { key: 'city', label: 'City', type: 'text' },
    { key: 'state', label: 'State', type: 'text' },
  ],
  business: [
    { key: 'industry', label: 'Industry', type: 'text' },
    { key: 'website', label: 'Website', type: 'text' },
  ],
  animal: [
    { key: 'species', label: 'Species', type: 'text' },
    { key: 'breed', label: 'Breed', type: 'text' },
  ],
  rider: [
    { key: 'discipline', label: 'Discipline', type: 'text' },
    { key: 'level', label: 'Level', type: 'text' },
  ],
  owner: [
    { key: 'location', label: 'Location', type: 'text' },
  ],
  breeder: [
    { key: 'specialization', label: 'Specialization', type: 'text' },
  ],
};

/**
 * Get fields for a profile type
 */
export function getFieldsForType(type: ProfileType): ProfileField[] {
  return profileFields[type] ?? [];
}
