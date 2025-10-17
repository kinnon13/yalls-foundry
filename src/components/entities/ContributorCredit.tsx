import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';
import { Award } from 'lucide-react';

interface ContributorCreditProps {
  entityId: string;
}

export function ContributorCredit({ entityId }: ContributorCreditProps) {
  const [contributor, setContributor] = useState<{ display_name: string; within_window: boolean } | null>(null);

  useEffect(() => {
    supabase
      .from('claim_bounties')
      .select(`
        within_window,
        contributors:contributor_user_id(user_id),
        profiles!contributors_user_id_fkey(display_name)
      `)
      .eq('entity_id', entityId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()
      .then(({ data }) => {
        if (data && data.profiles) {
          setContributor({
            display_name: (data.profiles as any).display_name || 'Unknown',
            within_window: data.within_window
          });
        }
      });
  }, [entityId]);

  if (!contributor) return null;

  return (
    <Badge variant="secondary" className="gap-1.5">
      <Award className="h-3 w-3" />
      <span>
        Credit: @{contributor.display_name}
        {contributor.within_window && ' (within window)'}
      </span>
    </Badge>
  );
}
