/**
 * Profile Pane - Social profile with upcoming events
 * Shows on right side in social mode
 */

import { Calendar, MapPin, Users, Star } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

export function ProfilePane() {
  return (
    <aside className="card" style={{ padding: '20px', overflow: 'auto' }}>
      {/* Profile Header */}
      <div className="flex flex-col items-center gap-4 mb-6">
        <Avatar className="h-24 w-24">
          <AvatarImage src="/placeholder.svg" />
          <AvatarFallback>JD</AvatarFallback>
        </Avatar>
        <div className="text-center">
          <h2 className="text-xl font-bold">John Doe</h2>
          <p className="text-sm opacity-70">@johndoe</p>
          <Badge variant="secondary" className="mt-2">
            <Star className="h-3 w-3 mr-1" />
            Gold Tier
          </Badge>
        </div>
        <div className="flex gap-6 text-sm">
          <div className="text-center">
            <div className="font-bold">127</div>
            <div className="opacity-70">Following</div>
          </div>
          <div className="text-center">
            <div className="font-bold">2.4k</div>
            <div className="opacity-70">Followers</div>
          </div>
        </div>
        <Button variant="outline" size="sm" className="w-full">
          Edit Profile
        </Button>
      </div>

      {/* Quick Stats */}
      <Card className="mb-4">
        <CardHeader>
          <CardTitle className="text-sm">This Month</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="opacity-70">Earnings</span>
            <span className="font-semibold">$1,234</span>
          </div>
          <div className="flex justify-between">
            <span className="opacity-70">Orders</span>
            <span className="font-semibold">8</span>
          </div>
          <div className="flex justify-between">
            <span className="opacity-70">Referrals</span>
            <span className="font-semibold">3</span>
          </div>
        </CardContent>
      </Card>

      {/* Upcoming Events */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Upcoming
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <EventItem
            title="Team Meeting"
            date="Today"
            time="2:00 PM"
            attendees={5}
          />
          <EventItem
            title="Project Demo"
            date="Tomorrow"
            time="10:00 AM"
            attendees={12}
          />
          <EventItem
            title="Client Call"
            date="Friday"
            time="3:30 PM"
            attendees={3}
          />
          <Button variant="ghost" size="sm" className="w-full mt-2">
            View all events →
          </Button>
        </CardContent>
      </Card>
    </aside>
  );
}

function EventItem({ title, date, time, attendees }: {
  title: string;
  date: string;
  time: string;
  attendees: number;
}) {
  return (
    <div className="flex items-start gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer">
      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
        <Calendar className="h-5 w-5 text-primary" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="font-medium text-sm">{title}</div>
        <div className="text-xs opacity-70">{date} · {time}</div>
        <div className="flex items-center gap-1 text-xs opacity-60 mt-1">
          <Users className="h-3 w-3" />
          {attendees} attending
        </div>
      </div>
    </div>
  );
}
