/**
 * Process Inbound Email
 * 
 * Takes emails from emails_inbound and:
 * - Classifies them (task, lead, question, etc.)
 * - Extracts entities (contacts, dates, amounts)
 * - Creates Rocker thread or adds to existing
 * - Generates suggested actions
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface EmailClassification {
  category: 'task' | 'lead' | 'question' | 'notification' | 'spam';
  priority: 'low' | 'medium' | 'high';
  sentiment: 'positive' | 'neutral' | 'negative';
  actions: string[];
  entities: {
    people?: string[];
    dates?: string[];
    amounts?: string[];
  };
}

async function classifyEmail(from: string, subject: string, body: string): Promise<EmailClassification> {
  if (!LOVABLE_API_KEY) {
    // Fallback classification
    return {
      category: 'notification',
      priority: 'medium',
      sentiment: 'neutral',
      actions: ['Review email'],
      entities: {}
    };
  }

  try {
    const prompt = `Analyze this email and extract:
1. Category (task/lead/question/notification/spam)
2. Priority (low/medium/high)
3. Sentiment (positive/neutral/negative)
4. Suggested actions
5. Key entities (people, dates, amounts)

From: ${from}
Subject: ${subject}
Body: ${body.substring(0, 1000)}`;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [{ role: 'user', content: prompt }],
        tools: [{
          type: 'function',
          function: {
            name: 'classify_email',
            parameters: {
              type: 'object',
              properties: {
                category: { type: 'string', enum: ['task', 'lead', 'question', 'notification', 'spam'] },
                priority: { type: 'string', enum: ['low', 'medium', 'high'] },
                sentiment: { type: 'string', enum: ['positive', 'neutral', 'negative'] },
                actions: { type: 'array', items: { type: 'string' } },
                entities: {
                  type: 'object',
                  properties: {
                    people: { type: 'array', items: { type: 'string' } },
                    dates: { type: 'array', items: { type: 'string' } },
                    amounts: { type: 'array', items: { type: 'string' } }
                  }
                }
              },
              required: ['category', 'priority', 'sentiment', 'actions']
            }
          }
        }],
        tool_choice: { type: 'function', function: { name: 'classify_email' } }
      })
    });

    if (!response.ok) {
      throw new Error(`AI API error: ${response.status}`);
    }

    const data = await response.json();
    const toolCall = data.choices[0]?.message?.tool_calls?.[0];
    
    if (toolCall) {
      return JSON.parse(toolCall.function.arguments);
    }

    throw new Error('No classification returned');

  } catch (error) {
    console.error('[Process Email] Classification error:', error);
    return {
      category: 'notification',
      priority: 'medium',
      sentiment: 'neutral',
      actions: ['Review email'],
      entities: {}
    };
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { email_id } = await req.json();

    // Fetch email
    const { data: email, error: fetchError } = await supabase
      .from('emails_inbound')
      .select('*')
      .eq('id', email_id)
      .eq('processed', false)
      .single();

    if (fetchError || !email) {
      return new Response(JSON.stringify({ error: 'Email not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log('[Process Email] Processing:', email.id);

    // Classify email
    const classification = await classifyEmail(
      email.from_addr,
      email.subject || '',
      email.text_body || email.html_body || ''
    );

    console.log('[Process Email] Classification:', classification);

    // Create or find Rocker thread
    const threadSubject = email.subject || `Email from ${email.from_addr}`;
    
    const { data: thread, error: threadError } = await supabase
      .from('rocker_threads')
      .insert({
        user_id: null, // System thread
        subject: threadSubject,
        metadata: {
          source: 'email',
          email_id: email.id,
          from: email.from_addr,
          classification
        }
      })
      .select()
      .single();

    if (threadError) {
      console.error('[Process Email] Thread creation error:', threadError);
    } else {
      console.log('[Process Email] Created thread:', thread.id);

      // Add email content as first message
      await supabase.from('rocker_messages').insert({
        thread_id: thread.id,
        role: 'user',
        content: `Email received from ${email.from_addr}\n\nSubject: ${email.subject}\n\n${email.text_body || email.html_body}`,
        metadata: {
          email_id: email.id,
          classification
        }
      });
    }

    // Mark as processed
    await supabase
      .from('emails_inbound')
      .update({
        processed: true,
        processed_at: new Date().toISOString(),
        rocker_thread_id: thread?.id
      })
      .eq('id', email.id);

    return new Response(JSON.stringify({ 
      success: true, 
      thread_id: thread?.id,
      classification 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('[Process Email] Error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
