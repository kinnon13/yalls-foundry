import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { GlobalHeader } from '@/components/layout/GlobalHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, Edit, MapPin } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

export default function EventDetail() {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();

  const { data: event, isLoading } = useQuery({
    queryKey: ['event', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('events' as any)
        .select('*, entities!host_entity_id(display_name)')
        .eq('id', id!)
        .maybeSingle();
      
      if (error) throw error;
      return data as any;
    }
  });

  const publishMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from('events' as any)
        .update({ status: 'published' } as any)
        .eq('id', id! as any);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['event', id] });
      toast.success('Event published');
    }
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <GlobalHeader />
        <div className="container mx-auto px-4 py-8 text-center">Loading...</div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen bg-background">
        <GlobalHeader />
        <div className="container mx-auto px-4 py-8 text-center">
          <p>Event not found</p>
          <Link to="/events">
            <Button className="mt-4">Back to Events</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <GlobalHeader />
      
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <CardTitle className="text-3xl">{event.title}</CardTitle>
                <CardDescription className="text-lg mt-2">
                  by {(event.entities as any)?.display_name || 'Unknown'}
                </CardDescription>
              </div>
              <Badge variant={event.status === 'published' ? 'default' : 'secondary'}>
                {event.status}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center gap-4 text-lg">
              <Calendar className="h-5 w-5" />
              <span>{format(new Date(event.starts_at), 'PPPp')}</span>
            </div>

            {event.ends_at && (
              <div className="flex items-center gap-4 text-lg">
                <Calendar className="h-5 w-5" />
                <span>to {format(new Date(event.ends_at), 'PPPp')}</span>
              </div>
            )}

            <div>
              <h3 className="font-semibold mb-2">Description</h3>
              <p className="text-muted-foreground">{event.description || 'No description'}</p>
            </div>

            <div className="flex gap-2">
              {event.status === 'draft' && (
                <Button onClick={() => publishMutation.mutate()}>
                  Publish Event
                </Button>
              )}
              
              <Link to={`/events/${id}/edit`}>
                <Button variant="outline">
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
