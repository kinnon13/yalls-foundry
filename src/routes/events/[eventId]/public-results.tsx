/**
 * Public Event Results Page (read-only, shareable)
 */

import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { Trophy, Share2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

export default function PublicResults() {
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
        .order('sequence', { ascending: true});
      return data || [];
    },
  });

  const { data: results = [] } = useQuery<Array<{classId: string; classTitle: string; results: any[]}>>({
    queryKey: ['event-results-public', eventId],
    queryFn: async () => {
      if (classes.length === 0) return [];
      
      const classResults: Array<{classId: string; classTitle: string; results: any[]}> = [];
      for (const c of classes) {
        const { data } = await supabase
          .from('results')
          .select('*')
          .eq('class_id', (c as any).id)
          .eq('status', 'approved')
          .order('place', { ascending: true });
        
        classResults.push({
          classId: (c as any).id,
          classTitle: (c as any).title,
          results: data || [],
        });
      }
      return classResults;
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
          <p className="text-muted-foreground">Results</p>
        </div>
        <Button variant="outline" onClick={handleShare}>
          <Share2 className="h-4 w-4 mr-2" />
          Share
        </Button>
      </div>

      {results.map((classGroup) => (
        <Card key={classGroup.classId} className="mb-6">
          <CardHeader>
            <CardTitle>{classGroup.classTitle}</CardTitle>
          </CardHeader>
          <CardContent>
            {classGroup.results.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Results not yet published
              </div>
            ) : (
              <div className="space-y-3">
                {classGroup.results.map((r: any, idx: number) => (
                  <div
                    key={r.id}
                    className="flex items-center gap-4 p-4 border rounded hover:bg-accent/50 transition-colors"
                  >
                    {r.place && r.place <= 3 && (
                      <Trophy
                        className={`h-6 w-6 ${
                          r.place === 1
                            ? 'text-yellow-500'
                            : r.place === 2
                            ? 'text-gray-400'
                            : 'text-amber-600'
                        }`}
                      />
                    )}
                    <div className="w-12 text-center">
                      <Badge variant={r.place ? 'default' : 'outline'}>
                        {r.place || 'N/A'}
                      </Badge>
                    </div>
                    <div className="flex-1">
                      <div className="font-medium">
                        {r.entry?.rider_user_id || 'Unknown'}
                      </div>
                      {r.entry?.horse_entity_id && (
                        <div className="text-sm text-muted-foreground">
                          Horse: {r.entry.horse_entity_id}
                        </div>
                      )}
                    </div>
                    {r.time_sec && (
                      <div className="text-right">
                        <div className="font-mono font-bold">
                          {r.time_sec.toFixed(3)}s
                        </div>
                        {r.penalties && (
                          <div className="text-sm text-red-500">
                            +{r.penalties}
                          </div>
                        )}
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
