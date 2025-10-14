/**
 * Profile Fields Component
 * 
 * Renders type-specific fields for a profile.
 */

import { getFieldsForType } from '@/lib/profiles/registry';
import type { AnyProfile } from '@/lib/profiles/types';

interface ProfileFieldsProps {
  profile: AnyProfile;
}

export function ProfileFields({ profile }: ProfileFieldsProps) {
  const fields = getFieldsForType(profile.type);
  
  if (fields.length === 0) {
    return (
      <div className="text-sm text-muted-foreground">
        No additional fields defined for this profile type.
      </div>
    );
  }
  
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {fields.map((field) => {
        const value = (profile as any)[field.key];
        
        return (
          <div key={field.key} className="space-y-1">
            <label className="text-sm font-medium">{field.label}</label>
            <div className="text-sm text-muted-foreground">
              {value ?? '—'}
            </div>
          </div>
        );
      })}
    </div>
  );
}
