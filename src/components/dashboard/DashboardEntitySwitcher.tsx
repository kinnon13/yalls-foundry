import { useState } from 'react';
import { Building2, ChevronDown } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useSession } from '@/lib/auth/context';
import { MockIndicator } from '@/components/ui/MockIndicator';

export function DashboardEntitySwitcher() {
  const { session } = useSession();
  const [isOpen, setIsOpen] = useState(false);

  const { data: entities } = useQuery({
    queryKey: ['user-entities', session?.userId],
    queryFn: async () => {
      if (!session?.userId) return [];
      
      const { data, error } = await supabase
        .from('entities')
        .select('id, display_name, kind, is_mock')
        .eq('owner_user_id', session.userId);
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!session?.userId,
  });

  const [currentEntity, setCurrentEntity] = useState(entities?.[0]);

  if (!entities || entities.length === 0) return null;

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 rounded-lg border border-border bg-card hover:bg-accent transition-colors"
      >
        <Building2 size={16} className="text-muted-foreground" />
        <span className="text-sm font-medium">{currentEntity?.display_name || 'Select Entity'}</span>
        {currentEntity?.is_mock && (
          <MockIndicator variant="inline" size="xs" />
        )}
        <ChevronDown size={16} className="text-muted-foreground" />
      </button>

      {isOpen && (
        <div className="absolute top-full mt-2 w-64 rounded-lg border border-border bg-card shadow-lg z-50">
          <div className="p-2 space-y-1">
            {entities.map((entity) => (
              <button
                key={entity.id}
                onClick={() => {
                  setCurrentEntity(entity);
                  setIsOpen(false);
                }}
                className="w-full px-3 py-2 text-left rounded-md hover:bg-accent transition-colors text-sm flex items-center justify-between"
              >
                <span>{entity.display_name}</span>
                {entity.is_mock && (
                  <MockIndicator variant="inline" size="xs" />
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
