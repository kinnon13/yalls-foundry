/**
 * Voice Intent Parser
 * 
 * Parses voice transcripts to extract user intent for post creation
 */

export type VoiceIntent =
  | { kind: 'post'; content: string; visibility?: 'public' | 'followers' | 'private' }
  | { kind: 'unknown' };

/**
 * Parse voice transcript for post intent
 * 
 * Examples:
 * - "post: headed to the jackpot #barrels"
 * - "publish private: meeting notes"
 * - "share public: check out my new horse"
 */
export function parseVoiceIntent(text: string): VoiceIntent {
  const t = text.trim();
  
  // Match patterns like: "post: content", "publish visibility: content"
  const m = t.match(/^(post|publish|share)\s*(public|followers|private)?[:\-]?\s*(.*)$/i);
  
  if (m) {
    const visibility = (m[2]?.toLowerCase() as 'public' | 'followers' | 'private') || 'public';
    const content = (m[3] || '').trim();
    
    if (content) {
      return { kind: 'post', content, visibility };
    }
  }
  
  return { kind: 'unknown' };
}

/**
 * Check if transcript matches confirmation keywords
 */
export function isConfirmation(text: string): boolean {
  const t = text.toLowerCase().trim();
  return /^(post it|yes|yeah|yep|confirm|send|do it)$/i.test(t);
}

/**
 * Check if transcript matches edit/cancel keywords
 */
export function isCancel(text: string): boolean {
  const t = text.toLowerCase().trim();
  return /^(edit|cancel|no|nope|nevermind|never mind)$/i.test(t);
}
