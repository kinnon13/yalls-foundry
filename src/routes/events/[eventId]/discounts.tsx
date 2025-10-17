/**
 * @feature(events_discounts)
 * Event Discounts Page
 * Manage discount codes for an event
 */

import React from 'react';
import { useParams } from 'react-router-dom';
import { DiscountManager } from '@/components/events/DiscountManager';

export default function EventDiscountsPage() {
  const { eventId } = useParams();

  return (
    <div className="container max-w-6xl py-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Discount Codes</h1>
        <p className="text-muted-foreground">Event ID: {eventId}</p>
      </div>

      <DiscountManager />
    </div>
  );
}
