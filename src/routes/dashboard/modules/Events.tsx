/**
 * Events Module
 * Private calendar, producer tools, moderation
 */

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useSession } from '@/lib/auth/context';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar, Users, Download, QrCode } from 'lucide-react';
import { Moderation } from './Moderation';

export function Events() {
  const { session } = useSession();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Events</h1>
        <p className="text-muted-foreground">Calendar & producer tools</p>
      </div>

      <Tabs defaultValue="calendar">
        <TabsList>
          <TabsTrigger value="calendar">Private Calendar</TabsTrigger>
          <TabsTrigger value="producer">Producer Tools</TabsTrigger>
          <TabsTrigger value="moderation">Moderation</TabsTrigger>
        </TabsList>

        <TabsContent value="calendar" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Your Events</CardTitle>
              <CardDescription>Private calendar view</CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" asChild>
                <a href="/farm/calendar">
                  <Calendar className="w-4 h-4 mr-2" />
                  Open Full Calendar
                </a>
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="producer" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Producer Tools</CardTitle>
              <CardDescription>Entries, draws, results, exports</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Button variant="outline" className="w-full justify-start">
                  <Users className="w-4 h-4 mr-2" />
                  Manage Entries
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <Download className="w-4 h-4 mr-2" />
                  Export CSV
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <QrCode className="w-4 h-4 mr-2" />
                  QR Check-in
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="moderation" className="mt-4">
          <Moderation />
        </TabsContent>
      </Tabs>
    </div>
  );
}
