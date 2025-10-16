/**
 * Learning extraction from conversations
 * Automatically captures user preferences, facts, and patterns using AI
 */

const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');

export async function extractLearningsFromConversation(
  supabaseClient: any,
  userId: string,
  userMessage: string,
  assistantResponse: string
) {
  try {
    console.log(`[Learning] Starting extraction for user ${userId}`);
    console.log(`[Learning] Message: "${userMessage.substring(0, 150)}..."`);
    
    // Get tenant from user context or default to user_id
    const { data: profile, error: profileErr } = await supabaseClient
      .from('profiles')
      .select('tenant_id, user_id')
      .eq('user_id', userId)
      .maybeSingle();
    
    if (profileErr) {
      console.error('[Learning] Profile fetch error:', profileErr);
    }
    
    const tenantId = profile?.tenant_id || userId;
    console.log(`[Learning] Using tenant_id: ${tenantId}`);
    // Ensure consent exists
    const { error: consentErr } = await supabaseClient
      .from('ai_user_consent')
      .upsert({
        tenant_id: tenantId,
        user_id: userId,
        site_opt_in: true,
        policy_version: 'v1',
        consented_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }, { onConflict: 'tenant_id,user_id' });
    
    if (consentErr) {
      console.error('[Learning] Consent upsert failed:', consentErr);
    } else {
      console.log('[Learning] Consent verified/created');
    }
    
    // Use AI to extract structured memories (more accurate than regex)
    if (LOVABLE_API_KEY && userMessage.length > 10) {
      await extractWithAI(supabaseClient, userId, tenantId, userMessage, assistantResponse);
    }

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
    
    console.log(`[Learning] Regex extraction: ${extractedCount} memories`);

  } catch (error) {
    console.error('[Learning] Failed to extract learnings:', error);
    console.error('[Learning] Error details:', error instanceof Error ? error.message : String(error));
  }
}

/**
 * Use AI to extract structured memories from conversation
 */
async function extractWithAI(
  supabaseClient: any,
  userId: string,
  tenantId: string,
  userMessage: string,
  assistantResponse: string
) {
  try {
    console.log('[Learning] Starting AI extraction...');
    
    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'system',
            content: `Extract memorable facts from this conversation. Focus on:
- Personal information (name, age, location, job, family members)
- Preferences (likes, dislikes, habits)
- Goals and plans
- Relationships and important people
- Projects and work
- Skills and expertise

Return ONLY a JSON array of memories, each with:
{
  "key": "short_descriptive_key",
  "type": "personal_info|preference|goal|relationship|project|skill|family",
  "value": "the actual information",
  "confidence": 0.7-1.0
}

If nothing memorable, return empty array [].`
          },
          {
            role: 'user',
            content: `User said: "${userMessage}"\n\nAssistant replied: "${assistantResponse}"`
          }
        ],
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      console.error('[Learning] AI extraction failed:', response.status, await response.text());
      return;
    }

    const completion = await response.json();
    const content = completion.choices[0]?.message?.content;
    
    if (!content) {
      console.log('[Learning] No AI response content');
      return;
    }

    // Parse JSON response
    let memories: any[] = [];
    try {
      // Try to extract JSON from markdown code blocks or plain text
      const jsonMatch = content.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        memories = JSON.parse(jsonMatch[0]);
      }
    } catch (parseErr) {
      console.error('[Learning] Failed to parse AI response:', parseErr);
      console.log('[Learning] Raw AI response:', content);
      return;
    }

    console.log(`[Learning] AI extracted ${memories.length} memories`);

    // Store each memory
    let stored = 0;
    for (const mem of memories) {
      if (!mem.key || !mem.value || !mem.type) {
        console.log('[Learning] Skipping invalid memory:', mem);
        continue;
      }

      const { error: insertErr } = await supabaseClient.from('ai_user_memory').insert({
        user_id: userId,
        tenant_id: tenantId,
        key: mem.key.toLowerCase().replace(/\s+/g, '_'),
        value: {
          content: mem.value,
          extracted_from: userMessage.substring(0, 200),
          confidence: mem.confidence || 0.8,
          extracted_at: new Date().toISOString()
        },
        type: mem.type,
        confidence: mem.confidence || 0.8,
        source: 'chat',
        tags: [mem.type, 'ai_extracted']
      });

      if (insertErr) {
        console.error(`[Learning] Failed to store memory "${mem.key}":`, insertErr);
        console.error('[Learning] Insert error code:', insertErr.code);
        console.error('[Learning] Insert error details:', insertErr.details);
        console.error('[Learning] Insert error hint:', insertErr.hint);
      } else {
        console.log(`[Learning] ✅ Stored: ${mem.key} (${mem.type})`);
        stored++;
      }
    }

    console.log(`[Learning] Successfully stored ${stored}/${memories.length} AI-extracted memories`);

  } catch (error) {
    console.error('[Learning] AI extraction error:', error);
    console.error('[Learning] Error details:', error instanceof Error ? error.stack : String(error));
  }
}
