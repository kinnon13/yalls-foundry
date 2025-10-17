/**
 * @feature(events_waitlist)
 * Event Waitlist Page
 * Manage event waitlist entries
 */

import React from 'react';
import { useParams } from 'react-router-dom';
import { WaitlistManager } from '@/components/events/WaitlistManager';

export default function EventWaitlistPage() {
  const { eventId } = useParams();

  return (
    <div className="container max-w-6xl py-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Event Waitlist</h1>
        <p className="text-muted-foreground">Event ID: {eventId}</p>
      </div>

      <WaitlistManager />
    </div>
  );
}
