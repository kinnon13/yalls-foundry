/**
 * Accounts Module
 * Business Hub: Entities/Pages, Contacts (CRM), Staff/Roles
 */

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useSession } from '@/lib/auth/context';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Building2, Users, UserPlus } from 'lucide-react';

export function Accounts() {
  const { session } = useSession();

  // Fetch entities
  const { data: entities } = useQuery({
    queryKey: ['my-entities', session?.userId],
    queryFn: async () => {
      const { data } = await supabase
        .from('entities')
        .select('*')
        .eq('owner_user_id', session?.userId)
        .order('created_at', { ascending: false });
      return data || [];
    },
    enabled: !!session?.userId,
  });

  // Fetch contacts
  const { data: contacts } = useQuery({
    queryKey: ['crm-contacts', session?.userId],
    queryFn: async () => {
      const { data } = await supabase
        .from('crm_contacts')
        .select('*')
        .eq('owner_user_id', session?.userId)
        .order('updated_at', { ascending: false });
      return data || [];
    },
    enabled: !!session?.userId,
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Accounts</h1>
        <p className="text-muted-foreground">Business hub & CRM</p>
      </div>

      <Tabs defaultValue="entities">
        <TabsList>
          <TabsTrigger value="entities">Entities/Pages</TabsTrigger>
          <TabsTrigger value="contacts">Contacts (CRM)</TabsTrigger>
          <TabsTrigger value="staff">Staff/Access</TabsTrigger>
        </TabsList>

        <TabsContent value="entities" className="space-y-4 mt-4">
          <div className="flex justify-between items-center">
            <p className="text-sm text-muted-foreground">
              {entities?.length || 0} entities/pages
            </p>
            <Button size="sm">
              <Building2 className="w-4 h-4 mr-2" />
              Create
            </Button>
          </div>

          {entities?.map((entity) => (
            <Card key={entity.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      {entity.display_name}
                      <Badge variant="outline">{entity.kind}</Badge>
                    </CardTitle>
                    <CardDescription>{entity.handle || 'No handle'}</CardDescription>
                  </div>
                  <Button variant="outline" size="sm" asChild>
                    <a href={`/profile/${entity.id}`}>View Profile</a>
                  </Button>
                </div>
              </CardHeader>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="contacts" className="space-y-4 mt-4">
          <div className="flex justify-between items-center">
            <p className="text-sm text-muted-foreground">
              {contacts?.length || 0} contacts
            </p>
            <Button size="sm">
              <UserPlus className="w-4 h-4 mr-2" />
              Add Contact
            </Button>
          </div>

          {contacts?.map((contact) => (
            <Card key={contact.id}>
              <CardHeader>
                <CardTitle>{contact.name}</CardTitle>
                <CardDescription>
                  {contact.email || 'No email'} • {contact.phone || 'No phone'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline">Timeline</Button>
                  <Button size="sm" variant="outline">Add Task</Button>
                  <Button size="sm" variant="outline">DM</Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="staff" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Staff & Access</CardTitle>
              <CardDescription>Roles and permissions (read-only in preview)</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">No staff assigned yet</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
