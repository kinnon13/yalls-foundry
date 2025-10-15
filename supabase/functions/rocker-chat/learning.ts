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
    // Automatically create consent record for mandatory learning (no blocking)
    // Get tenant from user context or default to user_id
    const { data: profile } = await supabaseClient
      .from('profiles')
      .select('tenant_id')
      .eq('user_id', userId)
      .maybeSingle();
    
    const tenantId = profile?.tenant_id || userId;
    await supabaseClient
      .from('ai_user_consent')
      .upsert({
        tenant_id: tenantId,
        user_id: userId,
        site_opt_in: true,  // Mandatory for platform use
        policy_version: 'v1',
        consented_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }, { onConflict: 'tenant_id,user_id' });

    // Detect preferences, interests, and important facts from user messages
    const learningPatterns = [
      // Family & relationships (NEW - captures "my mom is X", "my dad is Y")
      { pattern: /my (mom|mother|dad|father|sister|brother|son|daughter|wife|husband|partner|spouse|grandmother|grandfather|grandma|grandpa|aunt|uncle|cousin) (is|was|works as|lives in|named) ([^.,!?]+)/i, type: 'family_member' },
      { pattern: /(mom|mother|dad|father|sister|brother)['']s name is ([^.,!?]+)/i, type: 'family_member' },
      
      // Preferences
      { pattern: /I (prefer|like|love|want|need|always|usually|enjoy|favor)/i, type: 'preference' },
      { pattern: /(never|don't|won't|hate|dislike|avoid|can't stand) (.+)/i, type: 'preference', negative: true },
      
      // Personal information
      { pattern: /my (name is|birthday is|favorite|goal is|age is|location is|job is|occupation is)/i, type: 'personal_info' },
      { pattern: /I (am|work as|live in|study|am studying)/i, type: 'personal_info' },
      
      // Interests & hobbies
      { pattern: /I'm (working on|building|creating|interested in|learning|studying)/i, type: 'interest' },
      { pattern: /I (enjoy|love to|like to) (play|read|watch|listen to|code|write)/i, type: 'hobby' },
      
      // Notification preferences
      { pattern: /remind me|notification|alert me|let me know|notify me/i, type: 'notification_preference' },
      
      // Goals & plans
      { pattern: /I (want to|plan to|hope to|aim to|need to|will)/i, type: 'goal' },
      { pattern: /my (goal|plan|dream|aspiration) (is|was)/i, type: 'goal' },
      
      // Context about projects/work
      { pattern: /I'm (developing|designing|managing|running|building) (a|an|the)/i, type: 'project_context' },
      
      // Relationships & contacts
      { pattern: /my (friend|colleague|partner|boss|team|family)/i, type: 'relationship' },
      
      // Skills & expertise
      { pattern: /I (know|understand|am good at|am experienced in|specialize in)/i, type: 'skill' },
      { pattern: /I (don't know|need help with|struggle with)/i, type: 'skill', negative: true },
    ];

    console.log(`[Learning] Analyzing message: "${userMessage.substring(0, 100)}..."`);



    let extractedCount = 0;
    for (const { pattern, type, negative } of learningPatterns) {
      const match = userMessage.match(pattern);
      if (match) {
        console.log(`[Learning] Pattern matched! Type: ${type}, Match: ${match[0]}`);
        
        // For family members, create a cleaner key
        let key: string;
        let value: any;
        
        if (type === 'family_member') {
          const relation = match[1]?.toLowerCase() || 'relative';
          const detail = match[3] || match[2] || '';
          key = `family_${relation}`;
          value = {
            relationship: relation,
            detail: detail.trim(),
            full_statement: match[0],
            context: userMessage,
            extracted_at: new Date().toISOString()
          };
        } else {
          key = `${type}_${match[0].toLowerCase().replace(/\s+/g, '_').substring(0, 50)}`;
          value = {
            statement: match[0],
            context: userMessage,
            extracted_at: new Date().toISOString(),
            is_negative: negative || false
          };
        }

        // Check if similar memory already exists
        const { data: existing } = await supabaseClient
          .from('ai_user_memory')
          .select('id')
          .eq('user_id', userId)
          .eq('key', key)
          .maybeSingle();

        if (!existing) {
          const { error: insertErr } = await supabaseClient.from('ai_user_memory').insert({
            user_id: userId,
            tenant_id: tenantId,
            key,
            value,
            type,
            confidence: 0.8,
            source: 'chat',
            tags: [type, 'auto_learned']
          });
          
          if (insertErr) {
            console.error(`[Learning] Failed to insert memory:`, insertErr);
          } else {
            console.log(`[Learning] ✅ Extracted ${type}: ${key} = ${JSON.stringify(value).substring(0, 100)}`);
            extractedCount++;
          }
        } else {
          console.log(`[Learning] Memory already exists for key: ${key}`);
        }
      }
    }
    
    console.log(`[Learning] Total memories extracted: ${extractedCount}`);

  } catch (error) {
    console.error('[Learning] Failed to extract learnings:', error);
  }
}
