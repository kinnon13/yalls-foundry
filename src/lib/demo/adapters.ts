/**
 * Demo Mode Adapters
 * Thin wrappers that return fixtures in demo mode, otherwise call real APIs
 */

import { isDemo } from '../env';
import type { FeedItem } from '@/types/feed';
import { generateHomeForYou, generateHomeFollowing, generateHomeShop } from './fixtures/home';
import { generateDiscoverForYou, generateDiscoverTrending, generateDiscoverLatest } from './fixtures/discover';
import { generateMarketplaceListings, type DemoListing } from './fixtures/marketplace';
import { generateEvents, type DemoEvent } from './fixtures/events';
import { generateThreads, generateMessages, type DemoThread, type DemoMessage } from './fixtures/messages';
import { generateNotifications, type DemoNotification } from './fixtures/notifications';
import { generateDashboardOverview, type DemoOverview } from './fixtures/dashboard';
import { generatePublicCalendarEvents, generatePrivateCalendarEvents, type DemoCalendarEvent } from './fixtures/calendar';
import { read, write, demoKeys } from './storage';

/**
 * Feed API Adapter
 */
export const FeedAPI = {
  async getHome(params: { lane: 'for_you' | 'following' | 'shop'; cursor?: string; userId?: string }): Promise<{ items: FeedItem[]; nextCursor?: string }> {
    if (!isDemo()) {
      // TODO: Call real Supabase RPC
      throw new Error('Real feed API not implemented');
    }
    
    const { lane, userId = 'guest' } = params;
    let items: FeedItem[] = [];
    
    switch (lane) {
      case 'for_you':
        items = generateHomeForYou(userId);
        break;
      case 'following':
        items = generateHomeFollowing(userId);
        break;
      case 'shop':
        items = generateHomeShop(userId);
        break;
    }
    
    return { items, nextCursor: undefined };
  },
};

/**
 * Discover API Adapter
 */
export const DiscoverAPI = {
  async getIndex(params: { tab: 'for_you' | 'trending' | 'latest'; cursor?: string }): Promise<{ items: FeedItem[]; nextCursor?: string }> {
    if (!isDemo()) {
      throw new Error('Real discover API not implemented');
    }
    
    const { tab } = params;
    let items: FeedItem[] = [];
    
    switch (tab) {
      case 'for_you':
        items = generateDiscoverForYou();
        break;
      case 'trending':
        items = generateDiscoverTrending();
        break;
      case 'latest':
        items = generateDiscoverLatest();
        break;
    }
    
    return { items, nextCursor: undefined };
  },
};

/**
 * Listings API Adapter
 */
export const ListingsAPI = {
  async getIndex(params?: { q?: string; page?: number }): Promise<DemoListing[]> {
    if (!isDemo()) {
      throw new Error('Real listings API not implemented');
    }
    
    return generateMarketplaceListings();
  },
};

/**
 * Events API Adapter
 */
export const EventsAPI = {
  async getIndex(): Promise<DemoEvent[]> {
    if (!isDemo()) {
      throw new Error('Real events API not implemented');
    }
    
    return generateEvents();
  },
};

/**
 * Messages API Adapter
 */
export const MessagesAPI = {
  async getThreads(): Promise<DemoThread[]> {
    if (!isDemo()) {
      throw new Error('Real messages API not implemented');
    }
    
    const stored = read<DemoThread[]>(demoKeys.messages, []);
    return stored.length > 0 ? stored : generateThreads();
  },
  
  async getMessages(threadId: string): Promise<DemoMessage[]> {
    if (!isDemo()) {
      throw new Error('Real messages API not implemented');
    }
    
    return generateMessages(threadId);
  },
  
  async sendMessage(threadId: string, text: string): Promise<DemoMessage> {
    if (!isDemo()) {
      throw new Error('Real send message API not implemented');
    }
    
    const message: DemoMessage = {
      id: `msg-${Date.now()}`,
      threadId,
      text,
      sentBy: 'me',
      sentAt: new Date().toISOString(),
    };
    
    // Append to stored messages
    const threads = await this.getThreads();
    const thread = threads.find(t => t.id === threadId);
    if (thread) {
      thread.lastMessage = {
        id: message.id,
        text: message.text,
        sentBy: message.sentBy,
        sentAt: message.sentAt,
      };
      write(demoKeys.messages, threads);
    }
    
    return message;
  },
};

/**
 * Notifications API Adapter
 */
export const NotificationsAPI = {
  async getLane(lane?: string): Promise<DemoNotification[]> {
    if (!isDemo()) {
      throw new Error('Real notifications API not implemented');
    }
    
    const stored = read<DemoNotification[]>(demoKeys.notifications, []);
    const all = stored.length > 0 ? stored : generateNotifications();
    
    return lane ? all.filter(n => n.lane === lane) : all;
  },
  
  async markRead(ids: string[]): Promise<void> {
    if (!isDemo()) {
      throw new Error('Real mark read API not implemented');
    }
    
    const all = await this.getLane();
    const updated = all.map(n => ids.includes(n.id) ? { ...n, read: true } : n);
    write(demoKeys.notifications, updated);
  },
  
  async markAllRead(): Promise<void> {
    if (!isDemo()) {
      throw new Error('Real mark all read API not implemented');
    }
    
    const all = await this.getLane();
    const updated = all.map(n => ({ ...n, read: true }));
    write(demoKeys.notifications, updated);
  },
};

/**
 * Dashboard API Adapter
 */
export const DashboardAPI = {
  async getOverview(userId?: string): Promise<DemoOverview> {
    if (!isDemo()) {
      throw new Error('Real dashboard API not implemented');
    }
    
    return generateDashboardOverview(userId);
  },
};

/**
 * Calendar API Adapter
 */
export const CalendarAPI = {
  async getPublicEvents(): Promise<DemoCalendarEvent[]> {
    if (!isDemo()) {
      throw new Error('Real public calendar API not implemented');
    }
    
    return generatePublicCalendarEvents();
  },
  
  async getPrivateEvents(): Promise<DemoCalendarEvent[]> {
    if (!isDemo()) {
      throw new Error('Real private calendar API not implemented');
    }
    
    return generatePrivateCalendarEvents();
  },
};

/**
 * Cart API Adapter (uses localStorage)
 */
export interface DemoCartItem {
  id: string;
  listingId: string;
  quantity: number;
  price: number;
}

export const CartAPI = {
  async getCart(): Promise<DemoCartItem[]> {
    if (!isDemo()) {
      throw new Error('Real cart API not implemented');
    }
    
    return read<DemoCartItem[]>(demoKeys.cart, []);
  },
  
  async addToCart(listingId: string, quantity: number = 1, price: number): Promise<void> {
    if (!isDemo()) {
      throw new Error('Real add to cart API not implemented');
    }
    
    const cart = await this.getCart();
    const existing = cart.find(item => item.listingId === listingId);
    
    if (existing) {
      existing.quantity += quantity;
    } else {
      cart.push({
        id: `cart-${Date.now()}`,
        listingId,
        quantity,
        price,
      });
    }
    
    write(demoKeys.cart, cart);
  },
  
  async removeFromCart(itemId: string): Promise<void> {
    if (!isDemo()) {
      throw new Error('Real remove from cart API not implemented');
    }
    
    const cart = await this.getCart();
    const updated = cart.filter(item => item.id !== itemId);
    write(demoKeys.cart, updated);
  },
  
  async clearCart(): Promise<void> {
    if (!isDemo()) {
      throw new Error('Real clear cart API not implemented');
    }
    
    write(demoKeys.cart, []);
  },
};

/**
 * Orders API Adapter
 */
export interface DemoOrder {
  id: string;
  items: DemoCartItem[];
  total: number;
  status: 'pending' | 'paid' | 'shipped' | 'completed';
  created_at: string;
}

export const OrdersAPI = {
  async getOrders(): Promise<DemoOrder[]> {
    if (!isDemo()) {
      throw new Error('Real orders API not implemented');
    }
    
    return read<DemoOrder[]>(demoKeys.orders, []);
  },
  
  async createOrder(cart: DemoCartItem[]): Promise<DemoOrder> {
    if (!isDemo()) {
      throw new Error('Real create order API not implemented');
    }
    
    const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const order: DemoOrder = {
      id: `order-${Date.now()}`,
      items: cart,
      total,
      status: 'paid',
      created_at: new Date().toISOString(),
    };
    
    const orders = await this.getOrders();
    orders.unshift(order);
    write(demoKeys.orders, orders);
    
    return order;
  },
};

/**
 * Pins API Adapter (favorites rail)
 */
export interface DemoPin {
  id: string;
  entityId: string;
  entityName: string;
  entityAvatar: string;
  sortIndex: number;
  isPublic: boolean;
}

export const PinsAPI = {
  async getPins(userId?: string): Promise<DemoPin[]> {
    if (!isDemo()) {
      throw new Error('Real pins API not implemented');
    }
    
    return read<DemoPin[]>(demoKeys.pins, []);
  },
  
  async addPin(entityId: string, entityName: string, entityAvatar: string, isPublic: boolean = false): Promise<DemoPin> {
    if (!isDemo()) {
      throw new Error('Real add pin API not implemented');
    }
    
    const pins = await this.getPins();
    const pin: DemoPin = {
      id: `pin-${Date.now()}`,
      entityId,
      entityName,
      entityAvatar,
      sortIndex: pins.length,
      isPublic,
    };
    
    pins.push(pin);
    write(demoKeys.pins, pins);
    return pin;
  },
  
  async removePin(pinId: string): Promise<void> {
    if (!isDemo()) {
      throw new Error('Real remove pin API not implemented');
    }
    
    const pins = await this.getPins();
    const updated = pins.filter(p => p.id !== pinId);
    write(demoKeys.pins, updated);
  },
};
