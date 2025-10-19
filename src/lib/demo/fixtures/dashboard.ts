/**
 * Demo Fixtures: Dashboard Overview & KPIs
 */

import { createSeededRandom } from '../seed';

export interface DemoOverview {
  ownedPages: number;
  followers: number;
  orders: number;
  earnings: number;
  nextActions: Array<{
    id: string;
    title: string;
    description: string;
    priority: 'high' | 'medium' | 'low';
  }>;
}

export function generateDashboardOverview(userId: string = 'guest'): DemoOverview {
  const rng = createSeededRandom(`${userId}-dashboard`);
  
  return {
    ownedPages: rng.int(1, 5),
    followers: rng.int(50, 2000),
    orders: rng.int(0, 50),
    earnings: rng.int(0, 10000) * 100,
    nextActions: [
      {
        id: 'action-1',
        title: 'Complete your profile',
        description: 'Add bio and profile photo to increase engagement',
        priority: 'high',
      },
      {
        id: 'action-2',
        title: 'Claim your farm',
        description: 'Link your farm entity to manage operations',
        priority: 'medium',
      },
      {
        id: 'action-3',
        title: 'Create a listing',
        description: 'List your first product in the marketplace',
        priority: 'low',
      },
    ],
  };
}
