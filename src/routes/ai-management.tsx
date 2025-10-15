/**
 * AI Management Dashboard
 * Complete user-facing AI interface matching SpaceX-level spec
 */

import { useState } from 'react';
import { GlobalHeader } from '@/components/layout/GlobalHeader';
import { Button } from '@/components/ui/button';
import { Home, MessageSquare, Search, Brain, AlertCircle, TrendingUp, Link2, Shield, Settings, Share2 } from 'lucide-react';
import { cn } from '@/lib/utils';

// Import all panels
import { HomePanel } from '@/components/ai/HomePanel';
import { ChatPanel } from '@/components/ai/ChatPanel';
import { WhatIKnowPanel } from '@/components/ai/WhatIKnowPanel';
import { MemoriesPanel } from '@/components/ai/MemoriesPanel';
import { UnknownsPanel } from '@/components/ai/UnknownsPanel';
import { LearningPanel } from '@/components/ai/LearningPanel';
import { ConnectedAccountsPanel } from '@/components/ai/ConnectedAccountsPanel';
import { PrivacyPanel } from '@/components/ai/PrivacyPanel';
import { SettingsPanel } from '@/components/ai/SettingsPanel';
import { SharedMemoriesPanel } from '@/components/ai/SharedMemoriesPanel';

type Section = 'home' | 'chat' | 'know' | 'memories' | 'unknowns' | 'learning' | 'accounts' | 'privacy' | 'settings' | 'shared';

export default function AIManagement() {
  const [activeSection, setActiveSection] = useState<Section>('home');

  const navigation = [
    { id: 'home' as Section, label: 'Home', icon: Home },
    { id: 'chat' as Section, label: 'Chat', icon: MessageSquare },
    { id: 'know' as Section, label: 'What I Know', icon: Search },
    { id: 'memories' as Section, label: 'Memories', icon: Brain },
    { id: 'shared' as Section, label: 'Shared', icon: Share2 },
    { id: 'unknowns' as Section, label: 'Unknowns', icon: AlertCircle },
    { id: 'learning' as Section, label: 'Learning', icon: TrendingUp },
    { id: 'accounts' as Section, label: 'Accounts', icon: Link2 },
    { id: 'privacy' as Section, label: 'Privacy', icon: Shield },
    { id: 'settings' as Section, label: 'Settings', icon: Settings },
  ];

  return (
    <>
      <GlobalHeader />
      <div className="min-h-screen bg-background">
        <div className="flex">
          {/* Left Sidebar Navigation */}
          <div className="w-64 border-r bg-card/50 min-h-screen p-4">
            <div className="mb-6">
              <h1 className="text-xl font-bold">My AI</h1>
              <p className="text-xs text-muted-foreground mt-1">Rocker Control Center</p>
            </div>
            
            <nav className="space-y-1">
              {navigation.map(item => {
                const Icon = item.icon;
                return (
                  <Button
                    key={item.id}
                    variant={activeSection === item.id ? 'default' : 'ghost'}
                    className={cn(
                      "w-full justify-start",
                      activeSection === item.id && "bg-primary text-primary-foreground"
                    )}
                    onClick={() => setActiveSection(item.id)}
                  >
                    <Icon className="h-4 w-4 mr-3" />
                    {item.label}
                  </Button>
                );
              })}
            </nav>
          </div>

          {/* Main Content */}
          <div className="flex-1 p-6">
            {activeSection === 'home' && <HomePanel onNavigate={setActiveSection} />}
            {activeSection === 'chat' && <ChatPanel />}
            {activeSection === 'know' && <WhatIKnowPanel />}
            {activeSection === 'memories' && <MemoriesPanel />}
            {activeSection === 'shared' && <SharedMemoriesPanel />}
            {activeSection === 'unknowns' && <UnknownsPanel />}
            {activeSection === 'learning' && <LearningPanel />}
            {activeSection === 'accounts' && <ConnectedAccountsPanel />}
            {activeSection === 'privacy' && <PrivacyPanel />}
            {activeSection === 'settings' && <SettingsPanel />}
          </div>
        </div>
      </div>
    </>
  );
}
