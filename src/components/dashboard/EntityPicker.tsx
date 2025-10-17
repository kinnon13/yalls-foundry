/**
 * Entity Picker Component
 * For selecting entities in forms
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useSession } from '@/lib/auth/context';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface EntityPickerProps {
  value?: string;
  onChange?: (value: string) => void;
  kind?: string;
}

export function EntityPicker({ value, onChange, kind }: EntityPickerProps) {
  const { session } = useSession();

  const { data: entities } = useQuery({
    queryKey: ['entities-picker', session?.userId, kind],
    queryFn: async () => {
      let query = supabase
        .from('entities')
        .select('*')
        .eq('owner_user_id', session?.userId);
      
      // Kind filter removed for simplicity
      
      const { data } = await query.order('display_name');
      return data || [];
    },
    enabled: !!session?.userId,
  });

  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger>
        <SelectValue placeholder="Select entity" />
      </SelectTrigger>
      <SelectContent>
        {entities?.map((entity) => (
          <SelectItem key={entity.id} value={entity.id}>
            {entity.display_name} ({entity.kind})
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
