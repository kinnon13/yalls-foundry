/**
 * Cross-Post Target Picker
 * Production UI: Mac efficiency + TikTok feel + Amazon capabilities
 */

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/design/components/Button';
import { Input } from '@/design/components/Input';
import { Badge } from '@/design/components/Badge';
import { tokens } from '@/design/tokens';
import { X } from 'lucide-react';
import { MockIndicator } from '@/components/ui/MockIndicator';

interface Entity {
  id: string;
  name: string;
  kind: string;
  is_mock?: boolean;
}

interface CrossPostPickerProps {
  selectedTargets: string[];
  onTargetsChange: (targets: string[]) => void;
}

export function CrossPostPicker({ selectedTargets, onTargetsChange }: CrossPostPickerProps) {
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch user's entities
  const { data: entities = [] } = useQuery({
    queryKey: ['entities', searchQuery],
    queryFn: async () => {
      let query = (supabase as any)
        .from('entities')
        .select('id, display_name, kind, is_mock')
        .limit(20);
      
      if (searchQuery) {
        query = query.ilike('display_name', `%${searchQuery}%`);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      
      return (data || []).map((e: any) => ({
        id: e.id,
        name: e.display_name,
        kind: e.kind,
        is_mock: e.is_mock,
      })) as Entity[];
    },
  });

  const toggleTarget = (entityId: string) => {
    if (selectedTargets.includes(entityId)) {
      onTargetsChange(selectedTargets.filter(id => id !== entityId));
    } else {
      onTargetsChange([...selectedTargets, entityId]);
    }
  };

  return (
    <div style={{
      padding: tokens.space.m,
      border: `1px solid ${tokens.color.text.secondary}40`,
      borderRadius: tokens.radius.m,
      marginBottom: tokens.space.m,
    }}>
      <p style={{ fontSize: tokens.typography.size.s, marginBottom: tokens.space.s, color: tokens.color.text.secondary }}>
        Cross-post to:
      </p>
      
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: tokens.space.xs, marginBottom: tokens.space.m }}>
        {selectedTargets.map(targetId => {
          const entity = entities.find(e => e.id === targetId);
          return (
            <span key={targetId} style={{ 
              display: 'inline-flex', 
              alignItems: 'center', 
              gap: tokens.space.xxs,
              padding: `${tokens.space.xs}px ${tokens.space.s}px`,
              background: tokens.color.bg.light,
              borderRadius: tokens.radius.s,
              fontSize: tokens.typography.size.s,
            }}>
              {entity?.name || 'Unknown'}
              {entity?.is_mock && (
                <span style={{ marginLeft: tokens.space.xxs }}>
                  🚩
                </span>
              )}
              <X
                size={12}
                style={{ cursor: 'pointer' }}
                onClick={() => toggleTarget(targetId)}
              />
            </span>
          );
        })}
      </div>

      <div style={{ marginBottom: tokens.space.s }}>
        <Input
          placeholder="Search entities to cross-post..."
          value={searchQuery}
          onChange={setSearchQuery}
        />
      </div>

      <div style={{ maxHeight: 200, overflowY: 'auto' }}>
        {entities
          .filter(e => !selectedTargets.includes(e.id))
          .map(entity => (
            <div
              key={entity.id}
              onClick={() => toggleTarget(entity.id)}
              style={{
                padding: tokens.space.s,
                cursor: 'pointer',
                borderRadius: tokens.radius.s,
                transition: 'background 0.15s ease',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = tokens.color.bg.light;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent';
              }}
            >
              <div>
                <span style={{ fontWeight: tokens.typography.weight.medium }}>{entity.name}</span>
                <span style={{ fontSize: tokens.typography.size.xs, color: tokens.color.text.secondary, marginLeft: tokens.space.xs }}>
                  ({entity.kind})
                </span>
              </div>
              {entity.is_mock && <span>🚩</span>}
            </div>
          ))}
      </div>
    </div>
  );
}
