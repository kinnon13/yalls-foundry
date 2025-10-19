/**
 * Mock Adapter
 * Default adapter for all app actions (demo mode)
 */

import type { CommandResult } from '@/kernel/types';

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
const generateId = () => crypto.randomUUID();

class MockAdapter {
  async execute(
    appId: string,
    actionId: string,
    params: Record<string, any>,
    context: any
  ): Promise<CommandResult> {
    console.log(`[MockAdapter] ${appId}.${actionId}`, params);

    // Simulate network delay
    await delay(300 + Math.random() * 200);

    // Mock responses by app
    const mockId = generateId();

    switch (appId) {
      case 'crm':
        return this.mockCRM(actionId, params, mockId);
      case 'marketplace':
        return this.mockMarketplace(actionId, params, mockId);
      case 'calendar':
        return this.mockCalendar(actionId, params, mockId);
      case 'messages':
        return this.mockMessages(actionId, params, mockId);
      default:
        return {
          success: true,
          data: { id: mockId, ...params, _mock: true },
        };
    }
  }

  private mockCRM(actionId: string, params: any, mockId: string): CommandResult {
    switch (actionId) {
      case 'create_contact':
        return {
          success: true,
          data: {
            id: mockId,
            name: params.name,
            phone: params.phone || null,
            email: params.email || null,
            createdAt: new Date().toISOString(),
          },
        };
      case 'schedule_followup':
        return {
          success: true,
          data: {
            id: mockId,
            contactId: params.contactId,
            date: params.date,
            status: 'scheduled',
          },
        };
      default:
        return { success: false, error: `Unknown CRM action: ${actionId}` };
    }
  }

  private mockMarketplace(actionId: string, params: any, mockId: string): CommandResult {
    switch (actionId) {
      case 'create_listing':
        return {
          success: true,
          data: {
            id: mockId,
            title: params.title,
            price: params.price,
            status: 'draft',
            createdAt: new Date().toISOString(),
          },
        };
      case 'publish_listing':
        return {
          success: true,
          data: { id: params.listingId, status: 'active' },
        };
      default:
        return { success: false, error: `Unknown marketplace action: ${actionId}` };
    }
  }

  private mockCalendar(actionId: string, params: any, mockId: string): CommandResult {
    switch (actionId) {
      case 'create_event':
        return {
          success: true,
          data: {
            id: mockId,
            title: params.title,
            startAt: params.startAt,
            endAt: params.endAt,
            createdAt: new Date().toISOString(),
          },
        };
      default:
        return { success: false, error: `Unknown calendar action: ${actionId}` };
    }
  }

  private mockMessages(actionId: string, params: any, mockId: string): CommandResult {
    switch (actionId) {
      case 'send_message':
        return {
          success: true,
          data: {
            id: mockId,
            recipientId: params.recipientId,
            body: params.body,
            sentAt: new Date().toISOString(),
          },
        };
      default:
        return { success: false, error: `Unknown messages action: ${actionId}` };
    }
  }
}

export const mockAdapter = new MockAdapter();
