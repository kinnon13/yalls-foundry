/**
 * Conversation State Management
 * Agenda stack for topic management and working memory
 */

export interface AgendaItem {
  goalId?: string;
  label: string;
  createdAt: string;
  context?: Record<string, any>;
}

export class Agenda {
  private stack: AgendaItem[] = [];

  push(item: AgendaItem): void {
    this.stack.push(item);
  }

  pop(): AgendaItem | undefined {
    return this.stack.pop();
  }

  peek(): AgendaItem | undefined {
    if (this.stack.length === 0) return undefined;
    return this.stack[this.stack.length - 1];
  }

  list(): AgendaItem[] {
    return [...this.stack].reverse();
  }

  clear(): void {
    this.stack = [];
  }

  get length(): number {
    return this.stack.length;
  }
}

// Singleton instance for global agenda
export const globalAgenda = new Agenda();
