/**
 * Rocker AI Event Bus
 * 
 * Central event system for tracking all user actions
 */

export interface RockerEvent {
  name: string;
  timestamp: number;
  method?: string;
  ids?: Record<string, string>;
  lane?: string;
  page?: string;
  demo?: boolean;
  metadata?: Record<string, any>;
}

type EventListener = (event: RockerEvent) => void;

class RockerEventBus {
  private listeners: Map<string, EventListener[]> = new Map();
  private allListeners: EventListener[] = [];
  private eventLog: RockerEvent[] = [];
  private maxLogSize = 1000;
  
  /**
   * Emit an event
   */
  emit(name: string, data?: Partial<Omit<RockerEvent, 'name' | 'timestamp'>>): void {
    const event: RockerEvent = {
      name,
      timestamp: Date.now(),
      ...data,
    };
    
    // Add to log
    this.eventLog.push(event);
    if (this.eventLog.length > this.maxLogSize) {
      this.eventLog.shift();
    }
    
    // Notify specific listeners
    const specificListeners = this.listeners.get(name) || [];
    specificListeners.forEach(listener => {
      try {
        listener(event);
      } catch (e) {
        console.error(`[RockerEventBus] Listener error for ${name}:`, e);
      }
    });
    
    // Notify wildcard listeners
    this.allListeners.forEach(listener => {
      try {
        listener(event);
      } catch (e) {
        console.error(`[RockerEventBus] Wildcard listener error:`, e);
      }
    });
    
    // Log in dev mode
    if (import.meta.env.DEV) {
      console.log(`[Rocker] ${name}`, data);
    }
  }
  
  /**
   * Listen to a specific event
   */
  on(eventName: string, listener: EventListener): () => void {
    if (!this.listeners.has(eventName)) {
      this.listeners.set(eventName, []);
    }
    
    this.listeners.get(eventName)!.push(listener);
    
    // Return unsubscribe function
    return () => {
      const listeners = this.listeners.get(eventName);
      if (listeners) {
        const index = listeners.indexOf(listener);
        if (index > -1) {
          listeners.splice(index, 1);
        }
      }
    };
  }
  
  /**
   * Listen to all events
   */
  onAny(listener: EventListener): () => void {
    this.allListeners.push(listener);
    
    return () => {
      const index = this.allListeners.indexOf(listener);
      if (index > -1) {
        this.allListeners.splice(index, 1);
      }
    };
  }
  
  /**
   * Get recent events
   */
  getLog(count?: number): RockerEvent[] {
    if (count) {
      return this.eventLog.slice(-count);
    }
    return [...this.eventLog];
  }
  
  /**
   * Clear event log
   */
  clearLog(): void {
    this.eventLog = [];
  }
  
  /**
   * Get events by name
   */
  getEventsByName(name: string, limit = 100): RockerEvent[] {
    return this.eventLog
      .filter(e => e.name === name)
      .slice(-limit);
  }
}

// Singleton instance
export const rockerEventBus = new RockerEventBus();

// Convenience exports
export const rocker = {
  emit: rockerEventBus.emit.bind(rockerEventBus),
  on: rockerEventBus.on.bind(rockerEventBus),
  onAny: rockerEventBus.onAny.bind(rockerEventBus),
  getLog: rockerEventBus.getLog.bind(rockerEventBus),
  clearLog: rockerEventBus.clearLog.bind(rockerEventBus),
  getEventsByName: rockerEventBus.getEventsByName.bind(rockerEventBus),
};
