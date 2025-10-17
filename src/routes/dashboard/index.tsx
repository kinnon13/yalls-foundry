/**
 * Unified Dashboard - Owner HQ
 * Single dashboard with left-rail navigation for all management
 */

import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { GlobalHeader } from '@/components/layout/GlobalHeader';
import { LeftRail } from '@/components/dashboard/LeftRail';
import { Overview } from './modules/Overview';
import { Accounts } from './modules/Accounts';
import { Stallions } from './modules/Stallions';
import { FarmOps } from './modules/FarmOps';
import { Incentives } from './modules/Incentives';
import { Events } from './modules/Events';
import { Orders } from './modules/Orders';
import { Earnings } from './modules/Earnings';
import { Settings } from './modules/Settings';
import Approvals from './approvals';

type Module = 'overview' | 'accounts' | 'stallions' | 'farm-ops' | 'incentives' | 'events' | 'orders' | 'earnings' | 'approvals' | 'settings';

export default function Dashboard() {
  const [searchParams, setSearchParams] = useSearchParams();
  const module = (searchParams.get('module') || 'overview') as Module;

  const setModule = (m: Module) => {
    setSearchParams({ module: m });
  };

  return (
    <div className="min-h-screen bg-background">
      <GlobalHeader />
      
      <div className="flex h-[calc(100vh-4rem)]">
        <LeftRail activeModule={module} onModuleChange={setModule} />
        
        <main className="flex-1 overflow-y-auto">
          <div className="container mx-auto py-8 px-4 max-w-7xl">
            {module === 'overview' && <Overview />}
            {module === 'accounts' && <Accounts />}
            {module === 'stallions' && <Stallions />}
            {module === 'farm-ops' && <FarmOps />}
            {module === 'incentives' && <Incentives />}
            {module === 'events' && <Events />}
            {module === 'orders' && <Orders />}
            {module === 'earnings' && <Earnings />}
            {module === 'approvals' && <Approvals />}
            {module === 'settings' && <Settings />}
          </div>
        </main>
      </div>
    </div>
  );
}
