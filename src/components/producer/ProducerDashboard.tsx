/**
 * @feature(producer_console_overview)
 * Producer Dashboard
 * Events overview + quick stats
 */

import React from 'react';
import { Calendar, Users, DollarSign, TrendingUp } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export function ProducerDashboard() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold">Producer Console</h2>
        <p className="text-muted-foreground">Manage your events and registrations</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard
          icon={<Calendar className="h-5 w-5" />}
          label="Active Events"
          value="12"
          change="+2"
        />
        <StatCard
          icon={<Users className="h-5 w-5" />}
          label="Total Registrations"
          value="456"
          change="+34"
        />
        <StatCard
          icon={<DollarSign className="h-5 w-5" />}
          label="Revenue (30d)"
          value="$12,450"
          change="+15%"
        />
        <StatCard
          icon={<TrendingUp className="h-5 w-5" />}
          label="Avg. Attendance"
          value="87%"
          change="+5%"
        />
      </div>

      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Upcoming Events</h3>
        <div className="space-y-3">
          <EventRow
            name="Summer Classic"
            date="2025-06-15"
            registrations={45}
            capacity={60}
          />
          <EventRow
            name="Fall Championship"
            date="2025-09-20"
            registrations={32}
            capacity={50}
          />
          <EventRow
            name="Winter Series"
            date="2025-12-10"
            registrations={18}
            capacity={40}
          />
        </div>
      </Card>
    </div>
  );
}

function StatCard({ 
  icon, 
  label, 
  value, 
  change 
}: { 
  icon: React.ReactNode; 
  label: string; 
  value: string; 
  change: string;
}) {
  const isPositive = change.startsWith('+');
  return (
    <Card className="p-4">
      <div className="flex items-center gap-2 text-muted-foreground mb-2">
        {icon}
        <span className="text-sm">{label}</span>
      </div>
      <div className="text-2xl font-bold">{value}</div>
      <Badge variant={isPositive ? 'default' : 'secondary'} className="mt-2">
        {change}
      </Badge>
    </Card>
  );
}

function EventRow({ 
  name, 
  date, 
  registrations, 
  capacity 
}: { 
  name: string; 
  date: string; 
  registrations: number; 
  capacity: number;
}) {
  const percent = (registrations / capacity) * 100;
  return (
    <div className="flex items-center justify-between p-3 rounded-lg border">
      <div>
        <div className="font-medium">{name}</div>
        <div className="text-sm text-muted-foreground">
          {new Date(date).toLocaleDateString()}
        </div>
      </div>
      <div className="text-right">
        <div className="font-medium">{registrations}/{capacity}</div>
        <div className="text-sm text-muted-foreground">{percent.toFixed(0)}% full</div>
      </div>
    </div>
  );
}
