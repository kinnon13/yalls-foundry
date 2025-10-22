/**
 * Resume Suggestions
 * Builds suggestions for resuming previous work
 */

import { supabase } from '@/integrations/supabase/client';

export interface ResumeSuggestion {
  type: 'goal' | 'bookmark';
  id: string;
  title: string;
  context?: any;
  priority?: number;
  createdAt: Date;
}

/**
 * Build resume suggestions for user re-entry
 */
export async function buildResumeSuggestions(
  tenantId: string,
  userId: string,
  limit: number = 5
): Promise<ResumeSuggestion[]> {
  const suggestions: ResumeSuggestion[] = [];
  
  try {
    // Get pending goals
    const { data: goals } = await supabase
      .from('ai_goals')
      .select('id, title, priority, created_at, description')
      .eq('tenant_id', tenantId)
      .eq('user_id', userId)
      .in('status', ['pending', 'in_progress'])
      .order('priority', { ascending: true })
      .order('created_at', { ascending: false })
      .limit(limit);
    
    if (goals) {
      for (const goal of goals) {
        suggestions.push({
          type: 'goal',
          id: goal.id,
          title: goal.title,
          priority: goal.priority,
          context: { description: goal.description },
          createdAt: new Date(goal.created_at),
        });
      }
    }
    
    // Get unresolved bookmarks
    const { data: bookmarks } = await supabase
      .from('ai_bookmarks')
      .select(`
        id,
        label,
        resume_hint,
        created_at,
        conversation:ai_conversations(id, title)
      `)
      .is('resumed_at', null)
      .order('created_at', { ascending: false })
      .limit(3);
    
    if (bookmarks) {
      for (const mark of bookmarks) {
        suggestions.push({
          type: 'bookmark',
          id: mark.id,
          title: mark.label,
          context: {
            hint: mark.resume_hint,
            conversation: mark.conversation,
          },
          createdAt: new Date(mark.created_at),
        });
      }
    }
  } catch (error) {
    console.error('[Resume] Error building suggestions:', error);
  }
  
  // Sort by priority (goals) and recency
  return suggestions.sort((a, b) => {
    if (a.type === 'goal' && b.type === 'goal') {
      return (a.priority || 5) - (b.priority || 5);
    }
    return b.createdAt.getTime() - a.createdAt.getTime();
  }).slice(0, limit);
}

/**
 * Mark bookmark as resumed
 */
export async function markBookmarkResumed(bookmarkId: string): Promise<void> {
  try {
    await supabase
      .from('ai_bookmarks')
      .update({ resumed_at: new Date().toISOString() })
      .eq('id', bookmarkId);
  } catch (error) {
    console.error('[Resume] Error marking bookmark resumed:', error);
  }
}

/**
 * Load context snapshot for resuming
 */
export async function loadContextSnapshot(snapshotId: string): Promise<any> {
  try {
    const { data } = await supabase
      .from('ai_context_snapshots')
      .select('snapshot')
      .eq('id', snapshotId)
      .single();
    
    return data?.snapshot || null;
  } catch (error) {
    console.error('[Resume] Error loading snapshot:', error);
    return null;
  }
}
