/**
 * Event Conflict Detector Kernel
 * Detects scheduling conflicts and proposes alternatives
 */

interface KernelContext {
  events: {
    recent: (type: string, limit: number) => any[];
  };
  commands: {
    invoke: (app: string, action: string, params: any) => Promise<any>;
  };
}

export async function runEventConflictDetector(ctx: KernelContext) {
  const eventCreations = ctx.events.recent('calendar_create_event', 10);
  
  if (!eventCreations.length) {
    return;
  }

  for (const creation of eventCreations) {
    const { userId, eventId, startAt, endAt } = creation.detail || {};
    
    if (!userId || !eventId || !startAt || !endAt) continue;
    
    // Check for conflicts
    const conflicts = await findConflicts(userId, startAt, endAt, eventId);
    
    if (conflicts.length > 0) {
      // Flag conflict
      await ctx.commands.invoke('calendar', 'flag_conflict', {
        event_id: eventId,
        conflicting_events: conflicts.map(c => c.id),
        severity: calculateSeverity(conflicts)
      });
      
      // Generate alternatives
      const alternatives = generateAlternatives(startAt, endAt, conflicts);
      
      // Send notification
      await ctx.commands.invoke('messages', 'send_message', {
        recipient_id: userId,
        body: formatConflictMessage(conflicts, alternatives),
        metadata: {
          type: 'event_conflict',
          event_id: eventId,
          alternatives
        }
      });
    }
  }
}

async function findConflicts(userId: string, startAt: string, endAt: string, excludeId: string): Promise<any[]> {
  // TODO: Query events table for overlapping time ranges
  return [];
}

function calculateSeverity(conflicts: any[]): 'low' | 'medium' | 'high' {
  if (conflicts.length > 2) return 'high';
  if (conflicts.length > 1) return 'medium';
  return 'low';
}

function generateAlternatives(startAt: string, endAt: string, conflicts: any[]): any[] {
  const start = new Date(startAt);
  const end = new Date(endAt);
  const duration = end.getTime() - start.getTime();
  
  const alternatives: any[] = [];
  
  // Try 1 hour before
  const before = new Date(start.getTime() - 60 * 60 * 1000);
  alternatives.push({
    start_at: before.toISOString(),
    end_at: new Date(before.getTime() + duration).toISOString(),
    label: '1 hour earlier'
  });
  
  // Try 1 hour after
  const after = new Date(end.getTime() + 60 * 60 * 1000);
  alternatives.push({
    start_at: after.toISOString(),
    end_at: new Date(after.getTime() + duration).toISOString(),
    label: '1 hour later'
  });
  
  return alternatives;
}

function formatConflictMessage(conflicts: any[], alternatives: any[]): string {
  const conflictCount = conflicts.length;
  const altText = alternatives.map(a => a.label).join(' or ');
  
  return `⚠️ Schedule conflict detected with ${conflictCount} ${conflictCount === 1 ? 'event' : 'events'}. Consider ${altText}?`;
}
