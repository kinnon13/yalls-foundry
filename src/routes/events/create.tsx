/**
 * Create Event Page (stub)
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createEvent } from '@/lib/events/service.supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { rockerBus } from '@/lib/ai/rocker/bus';

export default function CreateEvent() {
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const event = await createEvent({
        title,
        slug,
        type: 'show',
        starts_at: new Date().toISOString(),
      });
      
      // ROCKER BUS: Emit event creation
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await rockerBus.emit({
          type: 'user.create.event',
          userId: user.id,
          tenantId: '00000000-0000-0000-0000-000000000000',
          payload: {
            event_id: event.id,
            event_type: 'show',
            title: event.title,
            starts_at: event.starts_at
          }
        });
      }
      
      toast({ title: 'Event created!' });
      navigate(`/events/${event.id}`);
    } catch (err) {
      toast({ title: 'Failed to create event', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Create Event</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label>Title</Label>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} required />
            </div>
            <div>
              <Label>Slug</Label>
              <Input value={slug} onChange={(e) => setSlug(e.target.value)} required />
            </div>
            <Button type="submit" disabled={loading}>Create</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
