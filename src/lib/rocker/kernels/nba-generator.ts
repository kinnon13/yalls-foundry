/**
 * Next Best Actions Generator
 * Rocker AI kernel for dashboard suggestions
 */

import { rocker } from '../event-bus';

export interface NextBestAction {
  id: string;
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  category: 'crm' | 'listings' | 'events' | 'earnings' | 'farm-ops';
  actionId: string;
  params?: Record<string, any>;
}

/**
 * Generate next best actions based on context and recent activity
 */
export async function generateNextBestActions(
  userId: string,
  contextType: string,
  contextId: string
): Promise<NextBestAction[]> {
  try {
    const response = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/rocker-nba`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ userId, contextType, contextId }),
      }
    );

    const data = await response.json();
    const actions = data.actions || [];

    rocker.emit('nba_generated', { metadata: { userId, count: actions.length } });
    
    return actions;
  } catch (error) {
    console.error('[Rocker] Failed to generate NBA:', error);
    
    // Fallback to mock data on error
    const mockActions: NextBestAction[] = [
      {
        id: 'nba-1',
        title: 'Follow up with John Doe',
        description: 'Last contact was 7 days ago',
        priority: 'high',
        category: 'crm',
        actionId: 'schedule_followup',
        params: { contactId: 'mock-contact-1' },
      },
      {
        id: 'nba-2',
        title: 'Update listing prices',
        description: '3 listings have outdated pricing',
        priority: 'medium',
        category: 'listings',
        actionId: 'update_listing',
      },
    ];

    return mockActions;
  }
}
