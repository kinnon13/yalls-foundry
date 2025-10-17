/**
 * Dashboard V2 - Owner HQ with modular cards
 */

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { 
  Home, Briefcase, Users, Calendar, ShoppingBag, 
  DollarSign, Sparkles, Settings 
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function DashboardV2() {
  const [activeCard, setActiveCard] = useState('overview');
  const navigate = useNavigate();

  const { data: stats } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      // Fetch various counts
      const { count: entities } = await supabase
        .from('entities')
        .select('*', { count: 'exact', head: true })
        .eq('owner_user_id', user.id);

      const { count: orders } = await supabase
        .from('orders')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);

      const { count: contacts } = await supabase
        .from('crm_contacts')
        .select('*', { count: 'exact', head: true })
        .eq('owner_user_id', user.id);

      return { entities, orders, contacts };
    },
  });

  const CARDS = [
    { id: 'overview', icon: Home, label: 'Overview', color: 'text-blue-500' },
    { id: 'business', icon: Briefcase, label: 'Business', color: 'text-purple-500' },
    { id: 'crm', icon: Users, label: 'CRM', color: 'text-green-500' },
    { id: 'events', icon: Calendar, label: 'Events', color: 'text-orange-500' },
    { id: 'orders', icon: ShoppingBag, label: 'Orders', color: 'text-pink-500' },
    { id: 'earnings', icon: DollarSign, label: 'Earnings', color: 'text-yellow-500' },
    { id: 'ai', icon: Sparkles, label: 'AI', color: 'text-indigo-500' },
    { id: 'settings', icon: Settings, label: 'Settings', color: 'text-gray-500' },
  ];

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Owner HQ</h1>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{stats?.entities || 0}</div>
            <div className="text-sm text-muted-foreground">Owned Pages</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{stats?.contacts || 0}</div>
            <div className="text-sm text-muted-foreground">CRM Contacts</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{stats?.orders || 0}</div>
            <div className="text-sm text-muted-foreground">Orders</div>
          </CardContent>
        </Card>
      </div>

      {/* Modular Cards */}
      <Tabs value={activeCard} onValueChange={setActiveCard}>
        <TabsList className="mb-6">
          {CARDS.map((card) => (
            <TabsTrigger key={card.id} value={card.id}>
              <card.icon className={`h-4 w-4 mr-2 ${card.color}`} />
              {card.label}
            </TabsTrigger>
          ))}
        </TabsList>

        {/* Overview */}
        <TabsContent value="overview">
          <Card>
            <CardHeader>
              <CardTitle>Next Best Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button
                variant="ghost"
                className="w-full justify-start"
                onClick={() => navigate('/listings/new')}
              >
                Create a new listing
              </Button>
              <Button
                variant="ghost"
                className="w-full justify-start"
                onClick={() => navigate('/feed')}
              >
                Share an update
              </Button>
              <Button
                variant="ghost"
                className="w-full justify-start"
                onClick={() => navigate('/events/new')}
              >
                Create an event
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Business */}
        <TabsContent value="business">
          <Card>
            <CardHeader>
              <CardTitle>Your Pages</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Manage your business pages and storefronts</p>
              <Button className="mt-4" onClick={() => navigate('/entities')}>
                View All Pages
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* CRM */}
        <TabsContent value="crm">
          <Card>
            <CardHeader>
              <CardTitle>CRM</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                CRM management coming soon
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Events */}
        <TabsContent value="events">
          <Card>
            <CardHeader>
              <CardTitle>Events</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Events management coming soon
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Orders */}
        <TabsContent value="orders">
          <Card>
            <CardHeader>
              <CardTitle>Orders</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Orders management coming soon
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Earnings */}
        <TabsContent value="earnings">
          <Card>
            <CardHeader>
              <CardTitle>Earnings</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Earnings management coming soon
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* AI */}
        <TabsContent value="ai">
          <Card>
            <CardHeader>
              <CardTitle>AI</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                AI management coming soon
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Settings */}
        <TabsContent value="settings">
          <Card>
            <CardHeader>
              <CardTitle>Settings</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Settings management coming soon
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
