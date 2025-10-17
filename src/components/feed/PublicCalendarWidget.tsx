import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Calendar, MapPin, ArrowRight, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export function PublicCalendarWidget() {
  const { data = [], isLoading } = useQuery({
    queryKey: ['public-events-next5'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('events')
        .select('id,title,starts_at,location')
        .gte('starts_at', new Date().toISOString())
        .order('starts_at', { ascending: true })
        .limit(5);
      if (error) throw error;
      return data || [];
    }
  });

  return (
    <Card className="animate-fade-in">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Calendar className="h-5 w-5 text-primary" />
          Upcoming Events
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {isLoading && (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        )}
        
        {!isLoading && !data.length && (
          <p className="text-sm text-muted-foreground text-center py-8">
            No upcoming events
          </p>
        )}
        
        {!isLoading && data.map((e: any) => (
          <a 
            key={e.id} 
            href={`/events/${e.id}`} 
            className="block p-3 rounded-lg border bg-card hover:bg-accent transition-all duration-200 hover:scale-[1.02] group"
          >
            <h4 className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">
              {e.title}
            </h4>
            <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
              <Calendar className="h-3 w-3" />
              <span>
                {new Date(e.starts_at).toLocaleString([], { 
                  month: 'short', 
                  day: 'numeric', 
                  hour: 'numeric', 
                  minute: '2-digit' 
                })}
              </span>
            </div>
            {e.location && (
              <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                <MapPin className="h-3 w-3" />
                <span>
                  {typeof e.location === 'string' ? e.location : (e.location.name ?? '')}
                </span>
              </div>
            )}
          </a>
        ))}
        
        {data.length > 0 && (
          <Button 
            variant="ghost" 
            className="w-full mt-2 group" 
            asChild
          >
            <a href="/events">
              View all events
              <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
            </a>
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
