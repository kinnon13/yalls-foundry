/**
 * Learning extraction from conversations
 * Automatically captures user preferences, facts, and patterns
 */

export async function extractLearningsFromConversation(
  supabaseClient: any,
  userId: string,
  userMessage: string,
  assistantResponse: string
) {
  try {
    // Ensure consent record exists and is enabled (mandatory learning)
    const tenantId = '00000000-0000-0000-0000-000000000000';
    const { data: existingConsent } = await supabaseClient
      .from('ai_user_consent')
      .select('site_opt_in')
      .eq('user_id', userId)
      .maybeSingle();

    if (!existingConsent || existingConsent.site_opt_in !== true) {
      await supabaseClient
        .from('ai_user_consent')
        .upsert({
          tenant_id: tenantId,
          user_id: userId,
          site_opt_in: true,
          policy_version: 'v1',
          consented_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }, { onConflict: 'tenant_id,user_id' });
    }

    // Detect preferences, interests, and important facts from user messages
    const learningPatterns = [
      { pattern: /I (prefer|like|love|want|need|always|usually)/i, type: 'preference' },
      { pattern: /my (name is|birthday is|favorite|goal is)/i, type: 'personal_info' },
      { pattern: /(never|don't|won't|hate|dislike) (.+)/i, type: 'preference', negative: true },
      { pattern: /remind me|notification|alert me/i, type: 'notification_preference' },
      { pattern: /I'm (working on|building|creating|interested in)/i, type: 'interest' },
    ];

    for (const { pattern, type, negative } of learningPatterns) {
      const match = userMessage.match(pattern);
      if (match) {
        const key = `${type}_${match[0].toLowerCase().replace(/\s+/g, '_').substring(0, 50)}`;
        const value = {
          statement: match[0],
          context: userMessage,
          extracted_at: new Date().toISOString(),
          is_negative: negative || false
        };

        // Check if similar memory already exists
        const { data: existing } = await supabaseClient
          .from('ai_user_memory')
          .select('id')
          .eq('user_id', userId)
          .eq('key', key)
          .maybeSingle();

        if (!existing) {
          await supabaseClient.from('ai_user_memory').insert({
            user_id: userId,
            tenant_id: tenantId,
            key,
            value,
            type,
            confidence: 0.8,
            source: 'chat',
            tags: [type, 'auto_learned']
          });
          console.log(`[Learning] Extracted ${type}:`, key);
        }
      }
    }
  } catch (error) {
    console.error('[Learning] Failed to extract learnings:', error);
  }
}
