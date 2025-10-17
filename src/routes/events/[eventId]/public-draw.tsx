/**
 * Public Event Draw Page (read-only, shareable)
 */

import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { Share2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

export default function PublicDraw() {
  const { eventId } = useParams();

  const { data: event } = useQuery({
    queryKey: ['event', eventId],
    queryFn: async () => {
      const { data } = await supabase
        .from('events')
        .select('*')
        .eq('id', eventId)
        .single();
      return data;
    },
  });

  const { data: classes = [] } = useQuery({
    queryKey: ['event-classes', eventId],
    queryFn: async () => {
      const { data } = await supabase
        .from('event_classes')
        .select('*')
        .eq('event_id', eventId)
        .order('sequence', { ascending: true });
      return data || [];
    },
  });

  const { data: draws = [] } = useQuery<Array<{classId: string; classTitle: string; draw: any[]}>>({
    queryKey: ['event-draws-public', eventId],
    queryFn: async () => {
      if (classes.length === 0) return [];
      
      const results: Array<{classId: string; classTitle: string; draw: any[]}> = [];
      for (const c of classes) {
        const { data } = await supabase
          .from('draws')
          .select('*')
          .eq('class_id', (c as any).id)
          .eq('perf_num', 1)
          .order('position', { ascending: true });
        
        results.push({
          classId: (c as any).id,
          classTitle: (c as any).title,
          draw: data || [],
        });
      }
      return results;
    },
    enabled: classes.length > 0,
  });

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    toast.success('Link copied to clipboard');
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">{event?.title}</h1>
          <p className="text-muted-foreground">Draw Order</p>
        </div>
        <Button variant="outline" onClick={handleShare}>
          <Share2 className="h-4 w-4 mr-2" />
          Share
        </Button>
      </div>

      {draws.map((group) => (
        <Card key={group.classId} className="mb-6">
          <CardHeader>
            <CardTitle>{group.classTitle}</CardTitle>
          </CardHeader>
          <CardContent>
            {group.draw.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Draw not yet published
              </div>
            ) : (
              <div className="space-y-2">
                {group.draw.map((d: any) => (
                  <div
                    key={d.id}
                    className="flex items-center gap-4 p-3 border rounded hover:bg-accent/50 transition-colors"
                  >
                    <div className="w-16 text-center">
                      <div className="text-2xl font-bold">#{d.position}</div>
                    </div>
                    <div className="flex-1">
                      <div className="font-medium">
                        {d.entry?.rider_user_id || 'TBD'}
                      </div>
                      {d.entry?.horse_entity_id && (
                        <div className="text-sm text-muted-foreground">
                          Horse ID: {d.entry.horse_entity_id}
                        </div>
                      )}
                    </div>
                    {d.back_number && (
                      <div className="text-sm font-medium">
                        Back #{d.back_number}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
