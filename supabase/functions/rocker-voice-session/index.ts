import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { withRateLimit, RateLimits } from "../_shared/rate-limit-wrapper.ts";
import { createLogger } from "../_shared/logger.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const limited = await withRateLimit(req, 'rocker-voice-session', RateLimits.expensive);
  if (limited) return limited;

  const log = createLogger('rocker-voice-session');
  log.startTimer();

  try {
    // Get user session
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    const { alwaysListening } = await req.json();

    const baseInstructions = `You are Rocker, an ACTION-TAKING voice AI assistant for Yall's Foundry.

**CRITICAL: You are ACTION-ORIENTED via Voice**
When users speak a command, you MUST use your tools immediately:
- "Go to horses" → navigate({path: "/horses"})
- "Open marketplace" → navigate({path: "/marketplace"})
- "Click submit" → click_element({element_name: "submit button"})
- "Post this: Hello world" → create_post({content: "Hello world"})
- "Fill title with My Horse" → fill_field({field_name: "title", value: "My Horse"})
- "Add a horse named Thunder" → create_horse({name: "Thunder"})
- "Create event called Summer Rodeo" → create_event({title: "Summer Rodeo", event_type: "rodeo", starts_at: "2025-06-01"})
- "Add listing for saddle" → create_listing({title: "Saddle", price: 500, category: "tack"})
- "Send message to John" → send_message({recipient_id: "john", content: "Hey!"})

**Your Tools (Voice Commands):**
NAVIGATION & PAGES: navigate, click_element, fill_field, scroll_page, get_page_info
CONTENT: create_post, create_horse, create_business, create_event, create_listing, create_profile, upload_media
EVENTS: register_event, upload_results, manage_entries, start_timer
CALENDAR: create_calendar, create_calendar_event, share_calendar, create_calendar_collection, list_calendars, get_calendar_events
MARKETPLACE: add_to_cart, checkout, view_orders
BUSINESS: create_crm_contact, create_pos_order, manage_inventory, create_shift, manage_team
SOCIAL: save_post, reshare_post, send_message, mark_notification_read, flag_content
ADMIN: moderate_content, bulk_upload
AI: create_automation, update_memory
PROFILES: edit_profile, claim_entity
SEARCH: search
EXPORTS: export_data, request_category, submit_feedback

**Navigation Commands:**
- "show unclaimed entities" → navigate({path: "/entities/unclaimed"})
- "open my businesses" → navigate({path: "/ai-management"}) then click Connected Entities tab
- "go to horses" → navigate({path: "/horses"})
- "show marketplace" → navigate({path: "/marketplace"})
- "open calendar" → navigate({path: "/calendar"})
- "show my profile" → navigate({path: "/profile"})
- "go to events" → navigate({path: "/events"})
- "open dashboard" → navigate({path: "/dashboard"})
- "show MLM tree" → navigate({path: "/mlm/tree"})

**Voice Command Patterns:**
- Navigation: "go to", "open", "show me", "take me to"
- Clicking: "click", "press", "hit", "tap"
- Posting: "post", "share", "publish", "say"
- Filling: "type", "enter", "fill", "set"
- Creating: "add", "create", "register", "new", "make"

**IMPORTANT:**
- Call tools IMMEDIATELY when you detect action words
- Confirm actions verbally: "Opening horses now" or "Creating Summer Rodeo event"
- Keep responses VERY brief - users are speaking, not reading
- If stop command ("stop", "stop talking"), end immediately
- Stay friendly and enthusiastic about horses!`;

    const alwaysListeningInstructions = alwaysListening 
      ? `\n\nIMPORTANT: You are in "always listening" mode. Only respond when the user addresses you by saying "Rocker" or "Hey Rocker" at the start of their message. If they speak without saying your name, stay silent and wait. When they do say "Rocker", respond helpfully to their request.`
      : '';

    // Tool definitions for voice commands
    const tools = [
      {
        type: "function" as const,
        name: "navigate",
        description: "Navigate to a different page. Use when user asks to open, go to, or view a page.",
        parameters: {
          type: "object",
          properties: {
            path: {
              type: "string",
              description: "Path to navigate to. Available pages: /horses, /horses/create, /events, /events/create, /marketplace, /profile, /dashboard, /search, /entities/unclaimed, /ai-management, /calendar, /business/[id]/hub, /mlm/dashboard, /mlm/tree, /cart, /checkout",
            }
          },
          required: ["path"]
        }
      },
      {
        type: "function" as const,
        name: "click_element",
        description: "Click a button or element on the current page.",
        parameters: {
          type: "object",
          properties: {
            element_name: {
              type: "string",
              description: "What to click (e.g., 'submit button', 'post button', 'save')",
            }
          },
          required: ["element_name"]
        }
      },
      {
        type: "function" as const,
        name: "fill_field",
        description: "Fill in a form field.",
        parameters: {
          type: "object",
          properties: {
            field_name: {
              type: "string",
              description: "Field to fill (e.g., 'title', 'description', 'message')",
            },
            value: {
              type: "string",
              description: "Value to enter",
            }
          },
          required: ["field_name", "value"]
        }
      },
      {
        type: "function" as const,
        name: "create_post",
        description: "Create a new post with the given content.",
        parameters: {
          type: "object",
          properties: {
            content: {
              type: "string",
              description: "Post content",
            }
          },
          required: ["content"]
        }
      },
      {
        type: "function" as const,
        name: "scroll_page",
        description: "Scroll the page up or down.",
        parameters: {
          type: "object",
          properties: {
            direction: {
              type: "string",
              enum: ["up", "down", "top", "bottom"],
              description: "Direction to scroll",
            },
            amount: {
              type: "string",
              enum: ["page", "screen", "little"],
              description: "How much to scroll",
            }
          }
        }
      },
      {
        type: "function" as const,
        name: "create_horse",
        description: "Create a new horse profile. Use when user says to add, create, or register a horse.",
        parameters: {
          type: "object",
          properties: {
            name: {
              type: "string",
              description: "Horse name (required)",
            },
            breed: {
              type: "string",
              description: "Horse breed (optional)",
            },
            color: {
              type: "string",
              description: "Horse color (optional)",
            },
            description: {
              type: "string",
              description: "Brief description (optional)",
            }
          },
          required: ["name"]
        }
      },
      {
        type: "function" as const,
        name: "create_business",
        description: "Create a business profile.",
        parameters: {
          type: "object",
          properties: {
            name: { type: "string", description: "Business name" },
            description: { type: "string", description: "Business description" }
          },
          required: ["name"]
        }
      },
      {
        type: "function" as const,
        name: "create_listing",
        description: "Create a marketplace listing.",
        parameters: {
          type: "object",
          properties: {
            title: { type: "string" },
            description: { type: "string" },
            price: { type: "number" },
            category: { type: "string" }
          },
          required: ["title", "price", "category"]
        }
      },
      {
        type: "function" as const,
        name: "create_crm_contact",
        description: "Add a CRM contact.",
        parameters: {
          type: "object",
          properties: {
            business_id: { type: "string" },
            name: { type: "string" },
            email: { type: "string" },
            phone: { type: "string" }
          },
          required: ["business_id", "name"]
        }
      },
      {
        type: "function" as const,
        name: "create_calendar",
        description: "Create a new calendar for a profile (personal, business, horse, etc.)",
        parameters: {
          type: "object",
          properties: {
            owner_profile_id: { type: "string", description: "Profile ID that owns the calendar" },
            name: { type: "string", description: "Calendar name" },
            calendar_type: { type: "string", enum: ["personal", "business", "horse", "event", "custom"], description: "Type of calendar" },
            description: { type: "string", description: "Calendar description" },
            color: { type: "string", description: "Calendar color (hex)" }
          },
          required: ["owner_profile_id", "name"]
        }
      },
      {
        type: "function" as const,
        name: "create_calendar_event",
        description: "Create an event in a calendar. For timed notifications like 'notify me in X minutes', create an event starting at that future time with reminder_minutes: 0. For scheduled events, use appropriate reminder_minutes (e.g., 5 for 5 minutes before).",
        parameters: {
          type: "object",
          properties: {
            calendar_id: { type: "string", description: "Calendar to add event to (optional, will use personal calendar if not provided)" },
            title: { type: "string", description: "Event title" },
            description: { type: "string", description: "Event description" },
            location: { type: "string", description: "Event location" },
            starts_at: { type: "string", description: "Start date/time (ISO 8601). For 'notify me in X minutes', this should be X minutes from now." },
            ends_at: { type: "string", description: "End date/time (ISO 8601, optional)" },
            all_day: { type: "boolean", description: "Is this an all-day event?" },
            visibility: { type: "string", enum: ["public", "private", "busy"], description: "Event visibility" },
            event_type: { type: "string", description: "Type of event: notification, vet, farrier, show, training, meeting, etc." },
            reminder_minutes: { type: "number", description: "Minutes before event to send reminder. Use 0 for notification at event time." }
          },
          required: ["title", "starts_at"]
        }
      },
      {
        type: "function" as const,
        name: "share_calendar",
        description: "Share a calendar with someone (give them owner/writer/reader access)",
        parameters: {
          type: "object",
          properties: {
            calendar_id: { type: "string", description: "Calendar to share" },
            profile_id: { type: "string", description: "Profile to share with" },
            role: { type: "string", enum: ["owner", "writer", "reader"], description: "Access level" },
            busy_only: { type: "boolean", description: "If true, they only see busy/free times, not details" }
          },
          required: ["calendar_id", "profile_id", "role"]
        }
      },
      {
        type: "function" as const,
        name: "create_calendar_collection",
        description: "Create a master calendar that aggregates multiple calendars (e.g., 'My Master', 'Barn Ops', 'Horse Master')",
        parameters: {
          type: "object",
          properties: {
            owner_profile_id: { type: "string", description: "Profile ID that owns the collection" },
            name: { type: "string", description: "Collection name" },
            description: { type: "string", description: "Collection description" },
            color: { type: "string", description: "Collection color (hex)" },
            calendar_ids: { type: "array", items: { type: "string" }, description: "Initial calendars to include" }
          },
          required: ["owner_profile_id", "name"]
        }
      },
      {
        type: "function" as const,
        name: "list_calendars",
        description: "List calendars accessible to a profile",
        parameters: {
          type: "object",
          properties: {
            profile_id: { type: "string", description: "Profile ID to list calendars for" }
          },
          required: ["profile_id"]
        }
      },
      {
        type: "function" as const,
        name: "get_calendar_events",
        description: "Get events from a calendar or collection for a date range",
        parameters: {
          type: "object",
          properties: {
            calendar_id: { type: "string", description: "Calendar ID (optional if using collection_id)" },
            collection_id: { type: "string", description: "Collection ID (optional if using calendar_id)" },
            starts_at: { type: "string", description: "Start date (ISO 8601)" },
            ends_at: { type: "string", description: "End date (ISO 8601)" }
          }
        }
      }
    ];

    // Note: Realtime API requires OpenAI - no gateway abstraction yet
    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
    if (!OPENAI_API_KEY) {
      throw new Error('Voice sessions require OPENAI_API_KEY (Realtime API not abstracted)');
    }

    // Create ephemeral token for Realtime API
    const response = await fetch("https://api.openai.com/v1/realtime/sessions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-realtime-preview-2024-12-17",
        voice: "alloy",
        instructions: baseInstructions + alwaysListeningInstructions,
        tools: tools,
        tool_choice: "auto"
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      log.error("OpenAI session error", null, { error });
      throw new Error(`Failed to create session: ${response.statusText}`);
    }

    const data = await response.json();
    log.info("Session created successfully");

    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    log.error("Voice session error", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
