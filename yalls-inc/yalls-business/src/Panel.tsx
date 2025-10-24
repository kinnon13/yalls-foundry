/**
 * Yalls-Business Panel Component
 * Sidebar panel for quick business metrics
 */

import { useEffect, useState } from 'react';
import { fetchRevenueSummary } from '../services/crm.service';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function BusinessPanel() {
  const [revenue, setRevenue] = useState({ total: 0, monthly: 0 });
  const businessId = 'default-business'; // Stub: Get from context

  useEffect(() => {
    loadRevenue();
  }, []);

  async function loadRevenue() {
    try {
      const data = await fetchRevenueSummary(businessId);
      setRevenue(data);
    } catch (error) {
      console.error('Failed to load revenue:', error);
    }
  }

  return (
    <div data-testid="panel-business" className="p-4 space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Revenue Summary</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div>
            <div className="text-xs text-muted-foreground">Total</div>
            <div className="text-lg font-bold">${revenue.total.toLocaleString()}</div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground">Monthly Avg</div>
            <div className="text-lg font-bold">${revenue.monthly.toLocaleString()}</div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
