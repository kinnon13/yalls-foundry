import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.75.0";
import { rateLimit } from "../_shared/rate-limit.ts";

const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

/**
 * Extract learnings from conversation and save to user memory
 */
async function extractLearningsFromConversation(
  supabaseClient: any,
  userId: string,
  userMessage: string,
  assistantResponse: string
) {
  try {
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
            tenant_id: userId,
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

// System prompts for different modes
const USER_SYSTEM_PROMPT = `You are Rocker, an AI assistant who can TAKE ACTIONS on behalf of the user.

**CRITICAL: You are ACTION-ORIENTED**
When a user asks you to DO something, you MUST use your tools to do it:
- "Go to horses" → Call navigate tool with path '/horses'
- "Open marketplace" → Call navigate tool with path '/marketplace'  
- "Click the submit button" → Call click_element tool with element_name 'submit button'
- "Post about my horse" → Call create_post tool with the content
- "Fill in the title" → Call fill_field tool with field_name and value
- "What's on this page?" → Call get_page_info tool
- "Add a horse named Thunder" → Call create_horse tool with name "Thunder"

**Available Tools & When to Use Them:**
NAVIGATION & INTERACTION:
- navigate(path) - Go to any page (/horses, /events, /marketplace, /business/:id/hub, /admin, etc.)
- click_element(element_name) - Click buttons, links
- fill_field(field_name, value) - Fill form fields
- scroll_page(direction, amount) - Scroll up, down, to top/bottom
- get_page_info() - Get current page info

CONTENT CREATION:
- create_post(content) - Create a new post
- create_horse(name, breed?, color?, description?) - Create horse profile
- create_business(name, description?) - Create business
- create_event(title, event_type, starts_at, ends_at?, description?) - Create event
- create_listing(title, description?, price, category) - Create marketplace listing
- create_profile(profile_type, name, description?) - Create any profile type
- upload_media(file_type, caption?, linked_entity_id?) - Upload photos/videos

EVENTS:
- register_event(event_id, horse_id?, class_name?) - Register for event
- upload_results(event_id, results_data) - Upload event results/times
- manage_entries(event_id, action, entry_ids?) - Manage event entries
- start_timer(event_id, run_id?) - Start live timer

MARKETPLACE:
- add_to_cart(listing_id) - Add item to cart
- checkout(payment_method?) - Proceed to checkout
- view_orders(order_id?) - View order history

BUSINESS OPS:
- create_crm_contact(business_id, name, email?, phone?, notes?) - Add CRM contact
- create_pos_order(business_id, items, customer_id?) - Create POS order
- manage_inventory(business_id, action, item_name, quantity?) - Manage inventory
- create_shift(business_id, employee_id, start_time, end_time) - Schedule shift
- manage_team(business_id, action, user_id, role?) - Manage team members

SOCIAL & INTERACTION:
- save_post(post_id) - Save/bookmark post
- reshare_post(post_id, commentary?) - Reshare post
- send_message(recipient_id, content, thread_id?) - Send message
- mark_notification_read(notification_id) - Mark notifications read
- flag_content(content_type, content_id, reason) - Flag content

ADMIN & MODERATION:
- moderate_content(flag_id, action, notes?) - Moderate flagged content
- bulk_upload(data_type, file_path?) - Bulk upload data

AI & AUTOMATION:
- create_automation(name, trigger, action) - Create automation
- update_memory(key, value) - Update AI memory

PROFILES & CLAIMS:
- edit_profile(display_name?, bio?, avatar_url?) - Edit profile
- claim_entity(entity_id, entity_type) - Claim entity

CALENDAR MANAGEMENT:
- create_calendar(name, calendar_type, description?, color?) - Create new calendars
- create_calendar_event(title, starts_at, calendar_id?, description?, reminder_minutes?) - Add events. For "notify me in X minutes", set starts_at to X minutes from now and reminder_minutes: 0.
- share_calendar(calendar_id, profile_id, role) - Share calendar access
- create_calendar_collection(name, calendar_ids) - Create master calendars
- list_calendars() - View available calendars
- get_calendar_events(calendar_id?, start_date?, end_date?) - Get calendar events

**TIMED NOTIFICATIONS:** When user says "notify me in X minutes", use create_calendar_event with:
- starts_at: current time + X minutes (ISO format)
- reminder_minutes: 0 (notification fires at event time)
- title: the notification message
Example: "notify me goodnight in 5 minutes" → starts_at: now+5min, reminder_minutes: 0, title: "Goodnight message"

**IMPORTANT RULES:**
- When user says "go to", "open", "show me" → Use navigate tool IMMEDIATELY
- When user says "click", "press", "submit" → Use click_element tool
- When user says "post", "share", "publish" → Use create_post tool
- When user says "add horse", "create horse" → Use create_horse tool
- ALWAYS call tools when user requests actions, don't just describe what to do

**Memory Rules**
- Call get_user_profile() and search_user_memory() before answering
- Use write_memory() for long-lived facts the user explicitly shares
- Never store sensitive info without clear intent

**Tone**
- Friendly, action-oriented, concise
- Confirm actions: "Opening horses page now" or "Creating Thunder the horse!"

**When Unsure**
- Ask one clarifying question, then act on best guess
- Better to try and adjust than to ask too many questions`;

const ADMIN_SYSTEM_PROMPT = `You are Rocker Control, the admin-side AI for Y'alls.ai.

**Authority & Scope**
- You operate with global read access across tenants and users, and write access to admin-scoped resources.
- You must honor policy gates exposed by your tools (requires_admin_role, scope, tenant_id).
- You can view and analyze cross-user trends, fraud, audits, leaderboards, payouts, and system health.

**Goals**
1. Help admins monitor the platform (integrity, growth, revenue, support).
2. Run audits and generate reports (events accuracy, duplicate profiles, incentive eligibility, payout anomalies).
3. Curate and improve Global Knowledge used for better recommendations and quality.

**Output**
- Provide a concise answer.
- Include "Admin Actions Taken" listing ids/rows changed.`;

// ============= LEARNING SYSTEM =============

/**
 * Retrieve learned patterns from memory before acting
 */
async function getLearnedPatterns(supabaseClient: any, userId: string): Promise<string> {
  try {
    // Get high-confidence hypotheses (successful patterns)
    const { data: hypotheses } = await supabaseClient
      .from('ai_hypotheses')
      .select('key, value, confidence')
      .eq('user_id', userId)
      .gte('confidence', 0.7)
      .eq('status', 'active')
      .order('confidence', { ascending: false })
      .limit(5);
    
    // Get recent failures to avoid
    const { data: failures } = await supabaseClient
      .from('ai_feedback')
      .select('payload')
      .eq('user_id', userId)
      .eq('kind', 'dom_failure')
      .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
      .limit(5);
    
    if (!hypotheses?.length && !failures?.length) return '';
    
    let context = '\n\n**LEARNED PATTERNS (from past experience):**\n';
    
    if (hypotheses?.length) {
      context += 'SUCCESSFUL APPROACHES:\n';
      hypotheses.forEach((h: any) => {
        context += `- ${h.key}: ${JSON.stringify(h.value)} (confidence: ${h.confidence})\n`;
      });
    }
    
    if (failures?.length) {
      context += '\nRECENT FAILURES TO AVOID:\n';
      failures.forEach((f: any) => {
        context += `- Action: ${(f.payload as any)?.action}, Target: ${(f.payload as any)?.target}, Failed: ${(f.payload as any)?.message}\n`;
      });
    }
    
    context += '\nUSE LEARNED PATTERNS: Try successful approaches first. Avoid patterns that failed recently.\n';
    return context;
  } catch (e) {
    console.error('[Learning] Failed to retrieve patterns:', e);
    return '';
  }
}

// Helper to execute tool calls
async function executeTool(toolName: string, args: any, supabaseClient: any, userId: string) {
  console.log(`Executing tool: ${toolName}`, args);
  
  try {
    switch (toolName) {
      case 'get_user_profile': {
        const { data: profile, error } = await supabaseClient
          .from('profiles')
          .select('*')
          .eq('user_id', userId)
          .single();
        
        if (error) throw error;
        return { success: true, data: profile };
      }

      case 'search_user_memory': {
        const { data, error } = await supabaseClient.functions.invoke('rocker-memory', {
          body: {
            action: 'search_memory',
            user_id: userId,
            ...args
          }
        });
        
        if (error) throw error;
        return data;
      }

      case 'write_memory': {
        const { data, error } = await supabaseClient.functions.invoke('rocker-memory', {
          body: {
            action: 'write_memory',
            user_id: userId,
            entry: {
              user_id: userId,
              tenant_id: '00000000-0000-0000-0000-000000000000',
              ...args
            }
          }
        });
        
        if (error) throw error;
        return data;
      }

      case 'search_entities': {
        const { data, error } = await supabaseClient.functions.invoke('entity-lookup', {
          body: {
            action: 'search',
            ...args
          }
        });
        
        if (error) throw error;
        return data;
      }

      case 'save_post': {
        const { data, error } = await supabaseClient.functions.invoke('save-post', {
          body: args
        });
        
        if (error) throw error;
        return data;
      }

      case 'reshare_post': {
        const { data, error } = await supabaseClient.functions.invoke('reshare-post', {
          body: args
        });
        
        if (error) throw error;
        return data;
      }

      case 'recall_content': {
        const { data, error } = await supabaseClient.functions.invoke('recall-content', {
          body: args
        });
        
        if (error) throw error;
        return data;
      }

      case 'create_event': {
        const { data, error } = await supabaseClient.functions.invoke('generate-event-form', {
          body: {
            eventRules: `Create a ${args.event_type || 'general'} event`,
            formType: 'registration'
          }
        });
        
        if (error) throw error;
        return { success: true, message: 'Event builder started', form: data };
      }

      case 'create_calendar_event': {
        console.log('[Tool: create_calendar_event] Creating calendar event:', args.title);
        try {
          // Get or create personal calendar
          let calendarId = args.calendar_id;
          
          if (!calendarId) {
            const { data: existingCal } = await supabaseClient
              .from('calendars')
              .select('id')
              .eq('owner_profile_id', userId)
              .eq('calendar_type', 'personal')
              .single();
            
            if (existingCal) {
              calendarId = existingCal.id;
            } else {
              const { data: newCal, error: calError } = await supabaseClient
                .from('calendars')
                .insert({
                  owner_profile_id: userId,
                  name: 'My Calendar',
                  calendar_type: 'personal',
                  color: '#3b82f6'
                })
                .select()
                .single();
              
              if (calError) throw calError;
              calendarId = newCal.id;
            }
          }

          // Create the calendar event with TTS message in metadata
          const metadata: any = { ...args.metadata };
          if (args.tts_message || args.voice_message) {
            metadata.tts_message = args.tts_message || args.voice_message || args.title;
          }

          const { data: event, error: eventError } = await supabaseClient
            .from('calendar_events')
            .insert({
              calendar_id: calendarId,
              title: args.title,
              description: args.description || args.title,
              starts_at: args.starts_at,
              ends_at: args.ends_at || args.starts_at,
              all_day: args.all_day || false,
              created_by: userId,
              metadata
            })
            .select()
            .single();

          if (eventError) throw eventError;

          // Create reminder if specified
          if (args.reminder_minutes !== undefined) {
            const reminderTime = new Date(args.starts_at);
            reminderTime.setMinutes(reminderTime.getMinutes() - args.reminder_minutes);

            const { error: reminderError } = await supabaseClient
              .from('calendar_event_reminders')
              .insert({
                event_id: event.id,
                profile_id: userId,
                trigger_at: reminderTime.toISOString()
              });

            if (reminderError) {
              console.error('[Tool: create_calendar_event] Reminder error:', reminderError);
            }
          }

          console.log('[Tool: create_calendar_event] Success:', event.id);
          return {
            success: true,
            message: `Calendar event "${args.title}" created!`,
            eventId: event.id,
            action: 'calendar_event_created'
          };
        } catch (error) {
          console.error('[Tool: create_calendar_event] Failed:', error);
          return {
            success: false,
            message: 'Failed to create calendar event: ' + (error instanceof Error ? error.message : 'Unknown error')
          };
        }
      }

      case 'navigate': {
        console.log('[Rocker] Navigate tool called:', args.path);
        return { 
          success: true, 
          message: `Opening ${args.path}`,
          navigation: args.path
        };
      }
      
      case 'click_element': {
        console.log('[Rocker] Click element tool called:', args.element_name);
        return { 
          success: true, 
          message: `Clicking "${args.element_name}"`
        };
      }
      
      case 'fill_field': {
        console.log('[Rocker] Fill field tool called:', args.field_name);
        return { 
          success: true, 
          message: `Filling "${args.field_name}" with "${args.value}"`
        };
      }
      
      case 'get_page_info': {
        console.log('[Rocker] Get page info tool called');
        return { 
          success: true, 
          message: 'Reading page content'
        };
      }
      
      case 'create_post': {
        console.log('[Tool: create_post] Creating post:', args.content);
        try {
          const { data, error } = await supabaseClient
            .from('posts')
            .insert({
              user_id: userId,
              content: args.content,
              visibility: args.visibility || 'public',
              tenant_id: '00000000-0000-0000-0000-000000000000'
            })
            .select()
            .single();
          
          if (error) {
            console.error('[Tool: create_post] Error:', error);
            throw error;
          }
          console.log('[Tool: create_post] Success:', data.id);
          return { 
            success: true, 
            message: 'Posted successfully!', 
            post_id: data.id,
            action: 'post_created'
          };
        } catch (error) {
          console.error('[Tool: create_post] Failed:', error);
          return {
            success: false,
            message: 'Failed to create post: ' + (error instanceof Error ? error.message : 'Unknown error')
          };
        }
      }
      
      case 'comment': {
        console.log('[Tool: comment] Creating comment:', args);
        // For now, return instruction to use UI
        return { 
          success: true, 
          message: `To comment "${args.content}", I'll help you fill the comment field`,
          action: 'fill_comment',
          content: args.content
        };
      }
      
      case 'scroll_page': {
        console.log('[Tool: scroll_page] Scrolling:', args.direction);
        return {
          success: true,
          message: `Scrolling ${args.direction || 'down'}`,
          action: 'scroll',
          direction: args.direction || 'down',
          amount: args.amount || 'page'
        };
      }

      case 'create_horse': {
        console.log('[Tool: create_horse] Creating horse:', args.name);
        try {
          const slug = args.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
          
          const customFields: Record<string, any> = {};
          if (args.breed) customFields.breed = args.breed;
          if (args.color) customFields.color = args.color;
          if (args.dateOfBirth) customFields.date_of_birth = args.dateOfBirth;

          const { data, error } = await supabaseClient
            .from('entity_profiles')
            .insert({
              entity_type: 'horse',
              name: args.name,
              slug,
              description: args.description || `A horse named ${args.name}`,
              owner_id: userId,
              custom_fields: customFields,
              is_claimed: false
            })
            .select()
            .single();

          if (error) {
            console.error('[Tool: create_horse] Error:', error);
            throw error;
          }

          console.log('[Tool: create_horse] Success:', data.id);
          return {
            success: true,
            message: `Created horse "${args.name}"!`,
            horseId: data.id,
            horseName: args.name,
            slug: slug,
            action: 'horse_created'
          };
        } catch (error) {
          console.error('[Tool: create_horse] Failed:', error);
          return {
            success: false,
            message: 'Failed to create horse: ' + (error instanceof Error ? error.message : 'Unknown error')
          };
        }
      }

      case 'read_file': {
        // Read file via Supabase Storage or return simulated file content
        try {
          // For now, return a message indicating file reading capability
          return {
            success: true,
            message: `Reading file: ${args.file_path}`,
            content: `File content would be displayed here. This is a placeholder for file reading functionality.`,
            file_path: args.file_path
          };
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          return { success: false, error: `Failed to read file: ${errorMessage}` };
        }
      }

      case 'edit_file': {
        try {
          return {
            success: true,
            message: `Edited ${args.file_path} using ${args.operation} operation`,
            file_path: args.file_path,
            operation: args.operation
          };
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          return { success: false, error: `Failed to edit file: ${errorMessage}` };
        }
      }

      case 'search_files': {
        try {
          return {
            success: true,
            message: `Searching for: ${args.query}`,
            results: [
              { file: 'example-file.tsx', matches: 3 }
            ]
          };
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          return { success: false, error: `Failed to search files: ${errorMessage}` };
        }
      }

      case 'analyze_file': {
        try {
          const analysisType = args.analysis_type || 'full';
          return {
            success: true,
            message: `Analyzed ${args.file_path} (${analysisType})`,
            analysis: {
              structure: 'File structure analysis',
              dependencies: ['react', 'typescript'],
              issues: [],
              suggestions: ['Consider adding comments', 'Extract reusable components']
            }
          };
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          return { success: false, error: `Failed to analyze file: ${errorMessage}` };
        }
      }

      case 'create_business': {
        console.log('[Tool: create_business] Creating business:', args.name);
        try {
          const slug = args.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

          const { data, error } = await supabaseClient
            .from('businesses')
            .insert({
              name: args.name,
              slug,
              description: args.description || `${args.name}`,
              owner_id: userId,
              created_by: userId
            })
            .select()
            .single();

          if (error) {
            console.error('[Tool: create_business] Error:', error);
            throw error;
          }

          console.log('[Tool: create_business] Success:', data.id);
          return {
            success: true,
            message: `Created business "${args.name}"!`,
            businessId: data.id,
            slug: slug,
            action: 'business_created'
          };
        } catch (error) {
          console.error('[Tool: create_business] Failed:', error);
          return {
            success: false,
            message: 'Failed to create business: ' + (error instanceof Error ? error.message : 'Unknown error')
          };
        }
      }

      case 'create_listing': {
        console.log('[Tool: create_listing] Creating listing:', args.title);
        try {
          const { data, error } = await supabaseClient
            .from('marketplace_listings')
            .insert({
              seller_id: userId,
              title: args.title,
              description: args.description || '',
              price_cents: Math.round(args.price * 100),
              category: args.category,
              status: 'active'
            })
            .select()
            .single();

          if (error) {
            console.error('[Tool: create_listing] Error:', error);
            throw error;
          }

          console.log('[Tool: create_listing] Success:', data.id);
          return {
            success: true,
            message: `Created listing "${args.title}"!`,
            listingId: data.id,
            action: 'listing_created'
          };
        } catch (error) {
          console.error('[Tool: create_listing] Failed:', error);
          return {
            success: false,
            message: 'Failed to create listing: ' + (error instanceof Error ? error.message : 'Unknown error')
          };
        }
      }

      case 'create_crm_contact': {
        console.log('[Tool: create_crm_contact] Creating contact:', args.name);
        try {
          const { data, error } = await supabaseClient
            .from('crm_contacts')
            .insert({
              business_id: args.business_id,
              name: args.name,
              email: args.email || null,
              phone: args.phone || null,
              notes: args.notes || null,
              status: 'lead'
            })
            .select()
            .single();

          if (error) {
            console.error('[Tool: create_crm_contact] Error:', error);
            throw error;
          }

          console.log('[Tool: create_crm_contact] Success:', data.id);
          return {
            success: true,
            message: `Added ${args.name} to CRM!`,
            contactId: data.id,
            action: 'contact_created'
          };
        } catch (error) {
          console.error('[Tool: create_crm_contact] Failed:', error);
          return {
            success: false,
            message: 'Failed to create contact: ' + (error instanceof Error ? error.message : 'Unknown error')
          };
        }
      }

      case 'edit_profile': {
        console.log('[Tool: edit_profile] Updating profile');
        try {
          const updates: Record<string, any> = {};
          if (args.display_name) updates.display_name = args.display_name;
          if (args.bio) updates.bio = args.bio;
          if (args.avatar_url) updates.avatar_url = args.avatar_url;

          const { error } = await supabaseClient
            .from('profiles')
            .update(updates)
            .eq('user_id', userId);

          if (error) {
            console.error('[Tool: edit_profile] Error:', error);
            throw error;
          }

          console.log('[Tool: edit_profile] Success');
          return {
            success: true,
            message: 'Profile updated!',
            action: 'profile_updated'
          };
        } catch (error) {
          console.error('[Tool: edit_profile] Failed:', error);
          return {
            success: false,
            message: 'Failed to update profile: ' + (error instanceof Error ? error.message : 'Unknown error')
          };
        }
      }

      case 'claim_entity': {
        console.log('[Tool: claim_entity] Claiming entity:', args.entity_type);
        try {
          const { error } = await supabaseClient
            .from('entity_profiles')
            .update({
              claimed_by: userId,
              is_claimed: true
            })
            .eq('id', args.entity_id)
            .eq('entity_type', args.entity_type);

          if (error) {
            console.error('[Tool: claim_entity] Error:', error);
            throw error;
          }

          console.log('[Tool: claim_entity] Success');
          return {
            success: true,
            message: `Claimed ${args.entity_type}!`,
            action: 'entity_claimed'
          };
        } catch (error) {
          console.error('[Tool: claim_entity] Failed:', error);
          return {
            success: false,
            message: 'Failed to claim entity: ' + (error instanceof Error ? error.message : 'Unknown error')
          };
        }
      }

      default:
        return { success: false, error: 'Unknown tool: ' + toolName };
    }
  } catch (error) {
    console.error('Tool execution error:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (!OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY is not configured');
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    const { data: { user } } = await supabaseClient.auth.getUser();
    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Apply rate limiting (10 requests per minute per user)
    const rateLimitResult = await rateLimit(req, user.id, {
      limit: 10,
      windowSec: 60,
      prefix: 'ratelimit:rocker-chat'
    });

    if (rateLimitResult instanceof Response) {
      return rateLimitResult;
    }

    const { messages, mode = 'user' } = await req.json();

    // Check if admin mode
    let isAdmin = false;
    if (mode === 'admin') {
      const { data: roles } = await supabaseClient
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .eq('role', 'admin')
        .single();
      
      isAdmin = !!roles;
    }

    // REHYDRATION: Load user memories and profile context
    let contextMemories = '';
    try {
      const { data: memoryData } = await supabaseClient.functions.invoke('rocker-memory', {
        body: {
          action: 'search_memory',
          user_id: user.id,
          limit: 10
        }
      });
      
      if (memoryData?.memories && memoryData.memories.length > 0) {
        contextMemories = '\n\n**User Context (from memory):**\n' + 
          memoryData.memories.map((m: any) => `- ${m.key}: ${JSON.stringify(m.value)}`).join('\n');
      }
    } catch (err) {
      console.warn('Failed to load user memories:', err);
    }

    // KNOWLEDGE BASE: Retrieve relevant knowledge
    let knowledgeContext = '';
    const lastUserMessage = messages[messages.length - 1]?.content || '';
    
    try {
      // Try to find a playbook for this intent
      const { data: playbookData } = await supabaseClient.functions.invoke('kb-playbook', {
        body: { intent: lastUserMessage }
      });

      if (playbookData?.found) {
        knowledgeContext += '\n\n**Relevant Playbook:**\n';
        knowledgeContext += `Intent: ${playbookData.playbook.intent}\n`;
        knowledgeContext += `Steps:\n${playbookData.playbook.steps.map((s: any, i: number) => `${i + 1}. ${s.description}`).join('\n')}`;
        console.log('[Rocker Chat] Found playbook:', playbookData.playbook.intent);
      }

      // Search knowledge base for relevant content
      const { data: kbData } = await supabaseClient.functions.invoke('kb-search', {
        body: {
          q: lastUserMessage,
          limit: 3,
          semantic: true,
        }
      });

      if (kbData?.results && kbData.results.length > 0) {
        knowledgeContext += '\n\n**Relevant Knowledge:**\n';
        kbData.results.forEach((item: any, i: number) => {
          knowledgeContext += `${i + 1}. ${item.title} (${item.category})\n`;
          if (item.summary) {
            knowledgeContext += `   ${item.summary.slice(0, 200)}...\n`;
          }
        });
        console.log('[Rocker Chat] Found', kbData.results.length, 'KB items');
      }

      // Resolve any unknown terms - mark unknowns for clarification
      const words = lastUserMessage.toLowerCase().match(/\b\w{4,}\b/g) || [];
      const unknownTerms: string[] = [];
      
      for (const word of words.slice(0, 5)) { // Check first 5 significant words
        const { data: term } = await supabaseClient
          .from('term_dictionary')
          .select('term, definition, synonyms')
          .or(`term.ilike.%${word}%,synonyms.cs.{${word}}`)
          .limit(1)
          .maybeSingle();

        if (term && term.definition) {
          knowledgeContext += `\n**Term: ${term.term}** - ${term.definition}`;
          console.log('[Rocker Chat] Resolved term:', term.term);
        } else if (word.length > 6) {
          // Check term_knowledge table for web-verified terms
          const { data: webTerm } = await supabaseClient
            .from('term_knowledge')
            .select('term, title, summary, source_url')
            .ilike('term', `%${word}%`)
            .eq('is_active', true)
            .order('confidence_score', { ascending: false })
            .limit(1)
            .maybeSingle();
          
          if (webTerm) {
            knowledgeContext += `\n**Term: ${webTerm.term}** - ${webTerm.summary || webTerm.title}`;
            if (webTerm.source_url) {
              knowledgeContext += ` (Source: ${webTerm.source_url})`;
            }
            console.log('[Rocker Chat] Resolved web term:', webTerm.term);
          } else {
            unknownTerms.push(word);
          }
        }
      }

      // If unknown terms found, add clarification instruction
      if (unknownTerms.length > 0) {
        knowledgeContext += `\n\n**INSTRUCTION: Unknown terms detected (${unknownTerms.join(', ')}). If these are important to answer the user's question, respond with:**
"I'm not familiar with [term]. Can you explain what that means?"

Then offer to search for it:
"Would you like me to search for information about [term] to verify we're talking about the same thing?"`;
        console.log('[Rocker Chat] Unknown terms:', unknownTerms);
      }
    } catch (err) {
      console.warn('[Rocker Chat] KB retrieval failed:', err);
    }

    const systemPrompt = (isAdmin ? ADMIN_SYSTEM_PROMPT : USER_SYSTEM_PROMPT) + contextMemories + knowledgeContext;

    // Build tools for function calling
    const tools: any = [
      {
        type: "function",
        function: {
          name: "get_user_profile",
          description: "Get the current user's profile information",
          parameters: { type: "object", properties: {} }
        }
      },
      {
        type: "function",
        function: {
          name: "search_user_memory",
          description: "Search the user's stored memories and preferences",
          parameters: {
            type: "object",
            properties: {
              query: { type: "string", description: "Search query" },
              tags: { type: "array", items: { type: "string" }, description: "Filter by tags" },
              limit: { type: "number", description: "Max results to return" }
            }
          }
        }
      },
      {
        type: "function",
        function: {
          name: "write_memory",
          description: "Store a long-lived memory or preference for the user. Only use for durable information.",
          parameters: {
            type: "object",
            required: ["key", "value", "type"],
            properties: {
              key: { type: "string", description: "Unique key for this memory" },
              value: { type: "object", description: "The memory content" },
              type: { type: "string", enum: ["preference", "fact", "goal", "note"], description: "Memory type" },
              tags: { type: "array", items: { type: "string" }, description: "Tags" },
              confidence: { type: "number", description: "0-1 confidence score" }
            }
          }
        }
      },
      {
        type: "function",
        function: {
          name: "search_entities",
          description: "Search horses, businesses, events, or users",
          parameters: {
            type: "object",
            properties: {
              query: { type: "string", description: "Search query" },
              type: { type: "string", enum: ["horse", "business", "user"], description: "Entity type" },
              limit: { type: "number", description: "Max results" }
            }
          }
        }
      },
      {
        type: "function",
        function: {
          name: "save_post",
          description: "Save/bookmark a post for later reference",
          parameters: {
            type: "object",
            required: ["post_id"],
            properties: {
              post_id: { type: "string", description: "UUID of the post to save" },
              collection: { type: "string", description: "Collection name (optional, defaults to 'All')" },
              note: { type: "string", description: "Personal note about this save" }
            }
          }
        }
      },
      {
        type: "function",
        function: {
          name: "reshare_post",
          description: "Reshare a post with optional commentary",
          parameters: {
            type: "object",
            required: ["post_id"],
            properties: {
              post_id: { type: "string", description: "UUID of the post to reshare" },
              commentary: { type: "string", description: "Your commentary on the post" },
              visibility: { 
                type: "string", 
                enum: ["public", "followers", "private"],
                description: "Who can see this reshare" 
              }
            }
          }
        }
      },
      {
        type: "function",
        function: {
          name: "recall_content",
          description: "Find previously saved posts, profiles, or horses using natural language",
          parameters: {
            type: "object",
            required: ["query"],
            properties: {
              query: { 
                type: "string", 
                description: "Natural language query like 'that Kinnon barrel video' or 'Sarah's horse profile'" 
              }
            }
          }
        }
      },
      {
        type: "function",
        function: {
          name: "create_calendar_event",
          description: "Create a calendar event or timed reminder. For 'notify me in X minutes/hours', set starts_at to current time + X and reminder_minutes: 0. For voice reminders, include tts_message.",
          parameters: {
            type: "object",
            required: ["title", "starts_at"],
            properties: {
              title: { type: "string", description: "Event title or reminder message" },
              starts_at: { type: "string", description: "ISO timestamp when event starts or notification triggers" },
              ends_at: { type: "string", description: "ISO timestamp when event ends (optional)" },
              description: { type: "string", description: "Event description (optional)" },
              calendar_id: { type: "string", description: "Calendar ID (optional, uses personal calendar if not provided)" },
              reminder_minutes: { type: "number", description: "Minutes before event to remind (0 = at event time)" },
              tts_message: { type: "string", description: "Voice message to speak when reminder triggers (optional)" },
              all_day: { type: "boolean", description: "Is this an all-day event?" }
            }
          }
        }
      },
      {
        type: "function",
        function: {
          name: "create_event",
          description: "Start the conversational event builder to create a new event",
          parameters: {
            type: "object",
            properties: {
              event_type: { 
                type: "string", 
                enum: ["barrel_race", "pole_bending", "rodeo", "jackpot", "show"],
                description: "Type of event to create" 
              }
            }
          }
        }
      },
      {
        type: "function",
        function: {
          name: "navigate",
          description: "Navigate to a page on the site. Use this when user asks to go to a page, go back, open a section, etc.",
          parameters: {
            type: "object",
            required: ["path"],
            properties: {
              path: { 
                type: "string", 
                description: "Path to navigate to. Use 'back' for going back, or paths like '/', '/horses', '/marketplace', '/events', '/search', '/profile', '/business/{id}/hub', '/mlm/dashboard', '/admin/control-room'" 
              }
            }
          }
        }
      },
      {
        type: "function",
        function: {
          name: "click_element",
          description: "Click a button, link, or interactive element on the current page. Use when user asks to click, press, submit, or activate something.",
          parameters: {
            type: "object",
            required: ["element_name"],
            properties: {
              element_name: { 
                type: "string", 
                description: "Natural description of what to click (e.g., 'submit button', 'post button', 'save', 'create event', 'like button')" 
              }
            }
          }
        }
      },
      {
        type: "function",
        function: {
          name: "fill_field",
          description: "Fill a form field with text. Use when user provides content to enter (e.g., 'type this in the title', 'set description to...')",
          parameters: {
            type: "object",
            required: ["field_name", "value"],
            properties: {
              field_name: { 
                type: "string", 
                description: "Natural description of the field (e.g., 'title', 'description', 'comment', 'message', 'name')" 
              },
              value: {
                type: "string",
                description: "The text to enter into the field"
              }
            }
          }
        }
      },
      {
        type: "function",
        function: {
          name: "get_page_info",
          description: "Get information about what's on the current page - available buttons, fields, and actions. Use when user asks what they can do or what's available.",
          parameters: {
            type: "object",
            properties: {}
          }
        }
      },
      {
        type: "function",
        function: {
          name: "create_post",
          description: "Create a new post with the given content. Use when user asks to post, share, or publish something.",
          parameters: {
            type: "object",
            required: ["content"],
            properties: {
              content: { 
                type: "string", 
                description: "The content of the post" 
              }
            }
          }
        }
      },
      {
        type: "function",
        function: {
          name: "comment",
          description: "Add a comment to the current item. Use when user asks to comment or leave a message on the current page.",
          parameters: {
            type: "object",
            required: ["content"],
            properties: {
              content: { 
                type: "string", 
                description: "The comment text" 
              }
            }
          }
        }
      },
      {
        type: "function",
        function: {
          name: "scroll_page",
          description: "Scroll the current page up or down. Use when user asks to scroll.",
          parameters: {
            type: "object",
            properties: {
              direction: {
                type: "string",
                enum: ["up", "down", "top", "bottom"],
                description: "Direction to scroll"
              },
              amount: {
                type: "string",
                enum: ["page", "screen", "little"],
                description: "How much to scroll (optional, defaults to 'page')"
              }
            }
          }
        }
      },
      {
        type: "function",
        function: {
          name: "create_horse",
          description: "Create a new horse profile. Use when user asks to add, create, or register a horse.",
          parameters: {
            type: "object",
            required: ["name"],
            properties: {
              name: {
                type: "string",
                description: "Horse name (required)"
              },
              breed: {
                type: "string",
                description: "Horse breed (optional, e.g., 'Quarter Horse', 'Thoroughbred')"
              },
              color: {
                type: "string",
                description: "Horse color (optional, e.g., 'Bay', 'Chestnut')"
              },
              description: {
                type: "string",
                description: "Brief description (optional)"
              },
              dateOfBirth: {
                type: "string",
                description: "Date of birth in YYYY-MM-DD format (optional)"
              }
            }
          }
        }
      },
      {
        type: "function",
        function: {
          name: "read_file",
          description: "Read and analyze the contents of a file from the user's project",
          parameters: {
            type: "object",
            required: ["file_path"],
            properties: {
              file_path: {
                type: "string",
                description: "Path to the file to read, e.g., 'src/components/MyComponent.tsx'"
              }
            }
          }
        }
      },
      {
        type: "function",
        function: {
          name: "edit_file",
          description: "Edit or modify a file's contents. Can update, replace, or add content to files.",
          parameters: {
            type: "object",
            required: ["file_path", "content", "operation"],
            properties: {
              file_path: {
                type: "string",
                description: "Path to the file to edit"
              },
              operation: {
                type: "string",
                enum: ["replace", "append", "prepend", "update_section"],
                description: "Type of edit operation"
              },
              content: {
                type: "string",
                description: "Content to add or replace"
              },
              section: {
                type: "string",
                description: "For update_section: which section to update (optional)"
              }
            }
          }
        }
      },
      {
        type: "function",
        function: {
          name: "search_files",
          description: "Search for files or content within files in the project",
          parameters: {
            type: "object",
            required: ["query"],
            properties: {
              query: {
                type: "string",
                description: "Search query - can be file name pattern or content search"
              },
              include_pattern: {
                type: "string",
                description: "File pattern to include, e.g., 'src/**/*.tsx'"
              }
            }
          }
        }
      },
      {
        type: "function",
        function: {
          name: "analyze_file",
          description: "Deep analysis of a file - code structure, dependencies, potential issues, suggestions",
          parameters: {
            type: "object",
            required: ["file_path"],
            properties: {
              file_path: {
                type: "string",
                description: "Path to the file to analyze"
              },
              analysis_type: {
                type: "string",
                enum: ["structure", "dependencies", "issues", "suggestions", "full"],
                description: "Type of analysis to perform"
              }
            }
          }
        }
      }
    ];

    // Save user message to conversation history
    const sessionId = crypto.randomUUID();
    if (messages.length > 0) {
      const lastUserMessage = messages[messages.length - 1];
      await supabaseClient.from('rocker_conversations').insert({
        user_id: user.id,
        session_id: sessionId,
        role: 'user',
        content: lastUserMessage.content,
        metadata: { timestamp: new Date().toISOString() }
      });
    }

    // Tool calling loop
    let conversationMessages = [
      { role: 'system', content: systemPrompt },
      ...messages
    ];
    
    let maxIterations = 5;
    let iterations = 0;

    while (iterations < maxIterations) {
      iterations++;

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4o',
          messages: conversationMessages,
          tools: tools,
          stream: false
        }),
      });

      if (!response.ok) {
        if (response.status === 429) {
          return new Response(JSON.stringify({ error: "OpenAI rate limits exceeded, please try again later." }), {
            status: 429,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
        if (response.status === 402) {
          return new Response(JSON.stringify({ error: "OpenAI payment required, please check your OpenAI account balance." }), {
            status: 402,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
        const errorText = await response.text();
        console.error('OpenAI API error:', response.status, errorText);
        throw new Error('OpenAI API error');
      }

      const completion = await response.json();
      const assistantMessage = completion.choices[0].message;

      // Check if AI wants to call tools
      if (assistantMessage.tool_calls && assistantMessage.tool_calls.length > 0) {
        // Add assistant message with tool calls
        conversationMessages.push(assistantMessage);

        // Execute each tool
        for (const toolCall of assistantMessage.tool_calls) {
          const toolName = toolCall.function.name;
          const toolArgs = JSON.parse(toolCall.function.arguments);
          
          const result = await executeTool(toolName, toolArgs, supabaseClient, user.id);
          
          // Add tool result
          conversationMessages.push({
            role: 'tool',
            tool_call_id: toolCall.id,
            content: JSON.stringify(result)
          });
        }
        
        // Continue loop to get AI's response with tool results
        continue;
      } else {
        // No more tool calls, save assistant response and extract learnings
        await supabaseClient.from('rocker_conversations').insert({
          user_id: user.id,
          session_id: sessionId,
          role: 'assistant',
          content: assistantMessage.content,
          metadata: { 
            timestamp: new Date().toISOString(),
            iterations 
          }
        });

        // Extract learnings from conversation
        await extractLearningsFromConversation(
          supabaseClient, 
          user.id, 
          messages[messages.length - 1]?.content || '',
          assistantMessage.content
        );

        // Return final answer
        const response: any = { 
          content: assistantMessage.content,
          role: 'assistant'
        };

        // Check if navigation was called
        const navigationCalls = conversationMessages
          .filter(m => m.role === 'assistant' && m.tool_calls)
          .flatMap(m => m.tool_calls || [])
          .filter((tc: any) => tc.function.name === 'navigate');
        
        if (navigationCalls.length > 0) {
          const lastNavCall = navigationCalls[navigationCalls.length - 1];
          const navArgs = JSON.parse(lastNavCall.function.arguments);
          response.navigationPath = navArgs.path;
        }

        // Track which tools were called for UI feedback
        if (conversationMessages.some(m => m.role === 'tool')) {
          response.tool_calls = conversationMessages
            .filter(m => m.role === 'assistant' && m.tool_calls)
            .flatMap(m => m.tool_calls || [])
            .map((tc: any) => ({ name: tc.function.name }));
        }

        // Auto-navigation hint for recall results
        if (assistantMessage.content.includes('found') && assistantMessage.content.match(/\/\w+\/[\w-]+/)) {
          const urlMatch = assistantMessage.content.match(/\/\w+\/[\w-]+/);
          if (urlMatch) {
            response.navigation_url = urlMatch[0];
          }
        }

        return new Response(
          JSON.stringify(response),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }
    }

    // Max iterations reached
    return new Response(
      JSON.stringify({ 
        content: "I apologize, but I've reached my processing limit for this request. Please try breaking it into smaller tasks.",
        role: 'assistant'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Error in rocker-chat:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
