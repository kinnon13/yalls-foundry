/**
 * @feature(composer_crosspost)
 * Entity Picker for Crossposting
 * Multi-entity targeting with edges
 */

import React, { useState } from 'react';
import { Building, User, Check } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface Entity {
  id: string;
  name: string;
  type: 'person' | 'business';
  followers: number;
}

const mockEntities: Entity[] = [
  { id: '1', name: 'My Farm', type: 'business', followers: 1234 },
  { id: '2', name: 'Personal Profile', type: 'person', followers: 567 },
  { id: '3', name: 'Training Stable', type: 'business', followers: 890 },
];

export function EntityPicker() {
  const [selected, setSelected] = useState<Set<string>>(new Set(['1']));

  const toggleEntity = (id: string) => {
    const newSelected = new Set(selected);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelected(newSelected);
  };

  return (
    <div className="space-y-3">
      <div className="text-sm font-medium">Post as:</div>
      <div className="space-y-2">
        {mockEntities.map((entity) => (
          <Card
            key={entity.id}
            className={`p-4 cursor-pointer transition-colors ${
              selected.has(entity.id) ? 'border-primary bg-primary/5' : ''
            }`}
            onClick={() => toggleEntity(entity.id)}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {entity.type === 'business' ? (
                  <Building className="h-5 w-5 text-muted-foreground" />
                ) : (
                  <User className="h-5 w-5 text-muted-foreground" />
                )}
                <div>
                  <div className="font-medium">{entity.name}</div>
                  <div className="text-xs text-muted-foreground">
                    {entity.followers.toLocaleString()} followers
                  </div>
                </div>
              </div>
              {selected.has(entity.id) && (
                <Check className="h-5 w-5 text-primary" />
              )}
            </div>
          </Card>
        ))}
      </div>
      {selected.size > 1 && (
        <Badge variant="secondary">Posting to {selected.size} entities</Badge>
      )}
    </div>
  );
}
