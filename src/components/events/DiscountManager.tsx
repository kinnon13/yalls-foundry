/**
 * @feature(events_discounts)
 * Discount Code Manager
 * Create and manage promo codes
 */

import React, { useState } from 'react';
import { Plus, Percent, Calendar, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';

interface Discount {
  id: string;
  code: string;
  percent: number;
  used: number;
  limit: number;
  expires: string;
  active: boolean;
}

const mockDiscounts: Discount[] = [
  { id: '1', code: 'EARLY25', percent: 25, used: 12, limit: 50, expires: '2025-03-01', active: true },
  { id: '2', code: 'VIP50', percent: 50, used: 3, limit: 10, expires: '2025-06-01', active: true },
];

export function DiscountManager() {
  const [discounts] = useState<Discount[]>(mockDiscounts);
  const [showCreate, setShowCreate] = useState(false);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Discount Codes</h3>
          <p className="text-sm text-muted-foreground">
            Manage promotional codes for your event
          </p>
        </div>
        <Button onClick={() => setShowCreate(!showCreate)}>
          <Plus className="h-4 w-4 mr-2" />
          New Code
        </Button>
      </div>

      {showCreate && (
        <Card className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input placeholder="Code (e.g. SUMMER25)" />
            <Input type="number" placeholder="Discount %" />
            <Input type="number" placeholder="Usage limit" />
            <Input type="date" placeholder="Expires" />
          </div>
          <div className="flex gap-2">
            <Button size="sm">Create</Button>
            <Button size="sm" variant="ghost" onClick={() => setShowCreate(false)}>
              Cancel
            </Button>
          </div>
        </Card>
      )}

      <div className="space-y-3">
        {discounts.map((discount) => (
          <Card key={discount.id} className="p-4">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <code className="text-lg font-mono font-bold">{discount.code}</code>
                  <Badge variant={discount.active ? 'default' : 'secondary'}>
                    {discount.active ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Percent className="h-3 w-3" />
                    {discount.percent}% off
                  </span>
                  <span className="flex items-center gap-1">
                    <Users className="h-3 w-3" />
                    {discount.used}/{discount.limit} used
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    Expires {new Date(discount.expires).toLocaleDateString()}
                  </span>
                </div>
              </div>
              <Button variant="ghost" size="sm">Edit</Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
