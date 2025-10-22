/**
 * CTM Summarizer Worker
 * Periodically summarizes idle conversations
 */

import { supabase } from '@/integrations/supabase/client';
import { summarizeConversation } from '@/ai/shared/conversation/summarize';

const IDLE_THRESHOLD_MINUTES = 5;

/**
 * Find idle conversations needing summarization
 */
async function findIdleConversations(): Promise<any[]> {
  const idleThreshold = new Date(Date.now() - IDLE_THRESHOLD_MINUTES * 60 * 1000);
  
  try {
    const { data } = await (supabase as any)
      .from('ai_conversations')
      .select('id, tenant_id, user_id, title, updated_at')
      .eq('status', 'active')
      .lt('updated_at', idleThreshold.toISOString())
      .is('summary', null)
      .limit(50);
    
    return data || [];
  } catch (error) {
    console.error('[Summarizer] Error finding idle conversations:', error);
    return [];
  }
}

/**
 * Summarize a conversation
 */
async function summarizeOne(conversationId: string): Promise<boolean> {
  try {
    // Get messages
    const { data: messages } = await (supabase as any)
      .from('ai_messages')
      .select('role, content, created_at')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });
    
    if (!messages || messages.length === 0) {
      return false;
    }
    
    // Generate summary
    const summary = await summarizeConversation(messages);
    
    // Store summary
    await (supabase as any)
      .from('ai_conversations')
      .update({
        summary,
        updated_at: new Date().toISOString(),
      })
      .eq('id', conversationId);
    
    return true;
  } catch (error) {
    console.error('[Summarizer] Error summarizing conversation:', error);
    return false;
  }
}

/**
 * Run summarizer worker
 */
export async function runSummarizer(): Promise<number> {
  console.log('[Summarizer] Starting run...');
  
  const conversations = await findIdleConversations();
  let summarized = 0;
  
  for (const conv of conversations) {
    const success = await summarizeOne(conv.id);
    if (success) {
      summarized++;
    }
  }
  
  if (summarized > 0) {
    console.log(`[Summarizer] Summarized ${summarized} conversations`);
  }
  
  return summarized;
}

// For standalone execution
if (typeof require !== 'undefined' && require.main === module) {
  runSummarizer().then(count => {
    console.log(`[Summarizer] Completed: ${count} conversations`);
  });
}
