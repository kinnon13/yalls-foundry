/**
 * My Entries - Entrant view of their event entries
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { Calendar, DollarSign, Waves } from 'lucide-react';

export default function MyEntries() {
  const { data: entries = [] } = useQuery({
    queryKey: ['my-entries'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data } = await supabase
        .from('entries')
        .select(`
          *,
          event_classes (
            *,
            events (*)
          )
        `)
        .eq('rider_user_id', user.id)
        .order('created_at', { ascending: false });

      return data || [];
    },
  });

  const totalFees = entries.reduce((sum, e: any) => sum + (e.fees_cents || 0), 0);
  const pendingCount = entries.filter((e: any) => e.status === 'pending').length;
  const approvedCount = entries.filter((e: any) => e.status === 'approved').length;

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">My Entries</h1>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 mb-2">
              <Calendar className="h-4 w-4 text-blue-500" />
              <div className="text-sm text-muted-foreground">Total Entries</div>
            </div>
            <div className="text-2xl font-bold">{entries.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 mb-2">
              <Waves className="h-4 w-4 text-green-500" />
              <div className="text-sm text-muted-foreground">Approved</div>
            </div>
            <div className="text-2xl font-bold">{approvedCount}</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 mb-2">
              <DollarSign className="h-4 w-4 text-purple-500" />
              <div className="text-sm text-muted-foreground">Total Fees</div>
            </div>
            <div className="text-2xl font-bold">
              ${(totalFees / 100).toFixed(2)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Entries List */}
      <Card>
        <CardHeader>
          <CardTitle>All Entries</CardTitle>
        </CardHeader>
        <CardContent>
          {entries.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground mb-4">No entries yet</p>
              <Link to="/events">
                <Button>Browse Events</Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {entries.map((entry: any) => (
                <div key={entry.id} className="p-4 border rounded">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <div className="font-bold">
                        {entry.event_classes?.events?.title || 'Event'}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Class: {entry.event_classes?.title || 'Unknown'}
                      </div>
                    </div>
                    <Badge variant={
                      entry.status === 'approved' ? 'default' :
                      entry.status === 'pending' ? 'outline' :
                      entry.status === 'waitlist' ? 'secondary' : 'destructive'
                    }>
                      {entry.status}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <div className="text-muted-foreground">Horse</div>
                      <div>{entry.horse_entity_id || 'TBD'}</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Fees</div>
                      <div className="font-mono">
                        ${(entry.fees_cents / 100).toFixed(2)}
                      </div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Entered</div>
                      <div>{new Date(entry.created_at).toLocaleDateString()}</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Event Date</div>
                      <div>
                        {entry.event_classes?.events?.starts_at
                          ? new Date(entry.event_classes.events.starts_at).toLocaleDateString()
                          : 'TBD'}
                      </div>
                    </div>
                  </div>

                  {entry.status === 'pending' && (
                    <div className="mt-3 p-2 bg-yellow-50 border border-yellow-200 rounded text-sm">
                      Pending approval - payment required
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
