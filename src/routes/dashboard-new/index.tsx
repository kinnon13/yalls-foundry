/**
 * Dashboard (New Spec)
 * Single left rail with management modules
 * No draggable feeds, clean navigation
 */

import { useState, lazy, Suspense } from 'react';
import { GlobalHeader } from '@/components/layout/GlobalHeader';
import { Dock } from '@/components/home/Dock';
import { Button } from '@/components/ui/button';
import {
  LayoutDashboard,
  Briefcase,
  Sparkles,
  Award,
  Tractor,
  Calendar,
  ShoppingCart,
  DollarSign,
  MessageCircle,
  Settings,
  Network,
} from 'lucide-react';
import { cn } from '@/lib/utils';

type Module =
  | 'overview'
  | 'business'
  | 'stallions'
  | 'incentives'
  | 'farm-ops'
  | 'events'
  | 'orders'
  | 'earnings'
  | 'mlm'
  | 'messages'
  | 'settings';

const MODULES = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'business', label: 'Business', icon: Briefcase },
  { id: 'stallions', label: 'Stallions', icon: Sparkles },
  { id: 'incentives', label: 'Incentives', icon: Award },
  { id: 'farm-ops', label: 'Farm Ops', icon: Tractor },
  { id: 'events', label: 'Events', icon: Calendar },
  { id: 'orders', label: 'Orders', icon: ShoppingCart },
  { id: 'earnings', label: 'Earnings', icon: DollarSign },
  { id: 'mlm', label: 'Affiliate Network', icon: Network },
  { id: 'messages', label: 'Messages', icon: MessageCircle },
  { id: 'settings', label: 'Settings', icon: Settings },
] as const;

export default function DashboardNew() {
  const [activeModule, setActiveModule] = useState<Module>('overview');

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <div className="h-[var(--header-h)] shrink-0 z-40">
        <GlobalHeader />
      </div>

      {/* Main content area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Rail Navigation */}
        <aside className="w-64 border-r flex flex-col overflow-hidden">
          <div className="p-4 border-b">
            <h2 className="font-semibold text-lg">Dashboard</h2>
          </div>
          
          <nav className="flex-1 overflow-y-auto p-2">
            {MODULES.map((mod) => {
              const Icon = mod.icon;
              const isActive = activeModule === mod.id;
              
              return (
                <Button
                  key={mod.id}
                  variant="ghost"
                  className={cn(
                    'w-full justify-start gap-3 mb-1',
                    isActive && 'bg-accent'
                  )}
                  onClick={() => setActiveModule(mod.id as Module)}
                >
                  <Icon className="h-4 w-4" />
                  {mod.label}
                </Button>
              );
            })}
          </nav>
        </aside>

        {/* Content Area */}
        <main className="flex-1 overflow-y-auto">
          <div className="p-6">
            {activeModule === 'overview' && <OverviewModule />}
            {activeModule === 'business' && <BusinessModule />}
            {activeModule === 'stallions' && <StallionsModule />}
            {activeModule === 'incentives' && <IncentivesModule />}
            {activeModule === 'farm-ops' && <FarmOpsModule />}
            {activeModule === 'events' && <EventsModule />}
            {activeModule === 'orders' && <OrdersModule />}
            {activeModule === 'earnings' && <EarningsModule />}
            {activeModule === 'mlm' && <MLMModule />}
            {activeModule === 'messages' && <MessagesModule />}
            {activeModule === 'settings' && <SettingsModule />}
          </div>
        </main>
      </div>

      {/* Dock */}
      <div className="h-[var(--dock-h)] shrink-0 z-40">
        <Dock />
      </div>
    </div>
  );
}

// Module Components (Placeholders)
function OverviewModule() {
  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Overview</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <MetricCard title="Total Revenue" value="$42,350" />
        <MetricCard title="Active Listings" value="23" />
        <MetricCard title="Pending Orders" value="5" />
      </div>
    </div>
  );
}

function BusinessModule() {
  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Business Management</h1>
      <p className="text-muted-foreground">Manage your business profiles and settings.</p>
    </div>
  );
}

function StallionsModule() {
  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Stallions</h1>
      <p className="text-muted-foreground">View and manage your stallion roster.</p>
    </div>
  );
}

function IncentivesModule() {
  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Incentives</h1>
      <p className="text-muted-foreground">Track breeder incentive programs and nominations.</p>
    </div>
  );
}

function FarmOpsModule() {
  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Farm Operations</h1>
      <p className="text-muted-foreground">Manage daily farm tasks and operations.</p>
    </div>
  );
}

function EventsModule() {
  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Events</h1>
      <p className="text-muted-foreground">Upcoming events and calendar.</p>
    </div>
  );
}

function OrdersModule() {
  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Orders</h1>
      <p className="text-muted-foreground">View and manage marketplace orders.</p>
    </div>
  );
}

function EarningsModule() {
  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Earnings</h1>
      <p className="text-muted-foreground">Track your earnings and payouts.</p>
    </div>
  );
}

function MLMModule() {
  const MLM = lazy(() => import('../dashboard/modules/MLM'));
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <MLM />
    </Suspense>
  );
}

function MessagesModule() {
  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Messages</h1>
      <p className="text-muted-foreground">View and respond to messages.</p>
    </div>
  );
}

function SettingsModule() {
  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Settings</h1>
      <p className="text-muted-foreground">Configure your dashboard preferences.</p>
    </div>
  );
}

function MetricCard({ title, value }: { title: string; value: string }) {
  return (
    <div className="p-4 border rounded-lg bg-card">
      <p className="text-sm text-muted-foreground mb-1">{title}</p>
      <p className="text-2xl font-bold">{value}</p>
    </div>
  );
}
