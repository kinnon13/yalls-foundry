/**
 * @feature(producer_console_overview)
 * Producer Console
 * Event producer dashboard
 */

import React from 'react';
import { ProducerDashboard } from '@/components/producer/ProducerDashboard';

export default function ProducerConsolePage() {
  return (
    <div className="container max-w-7xl py-8">
      <ProducerDashboard />
    </div>
  );
}
