/**
 * @feature(events_waitlist)
 * Waitlist Management
 * FIFO queue with manual approval
 */

import { useState, useEffect } from 'react';
import { Clock, Check, X, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface WaitlistEntry {
  id: string;
  name: string;
  email: string;
  joined: string;
  position: number;
  status: 'pending' | 'approved' | 'declined';
}

export function WaitlistManager() {
  const [entries, setEntries] = useState<WaitlistEntry[]>([]);
  
  useEffect(() => {
    // TODO: Load real waitlist from event_waitlist table
    // Query: SELECT * FROM event_waitlist WHERE event_id = ? ORDER BY position
    setEntries([]);
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Waitlist</h3>
          <p className="text-sm text-muted-foreground">
            {entries.filter(e => e.status === 'pending').length} people waiting
          </p>
        </div>
        <Button variant="outline">
          <Mail className="h-4 w-4 mr-2" />
          Notify All
        </Button>
      </div>

      <div className="space-y-3">
        {entries.map((entry) => (
          <Card key={entry.id} className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Badge variant="outline" className="h-8 w-8 rounded-full flex items-center justify-center">
                  #{entry.position}
                </Badge>
                <div>
                  <div className="font-medium">{entry.name}</div>
                  <div className="text-sm text-muted-foreground">{entry.email}</div>
                </div>
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  Joined {new Date(entry.joined).toLocaleDateString()}
                </div>
              </div>

              {entry.status === 'pending' && (
                <div className="flex gap-2">
                  <Button size="sm" variant="default">
                    <Check className="h-4 w-4 mr-1" />
                    Approve
                  </Button>
                  <Button size="sm" variant="ghost">
                    <X className="h-4 w-4 mr-1" />
                    Decline
                  </Button>
                </div>
              )}
              {entry.status === 'approved' && (
                <Badge variant="default">Approved</Badge>
              )}
              {entry.status === 'declined' && (
                <Badge variant="secondary">Declined</Badge>
              )}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
