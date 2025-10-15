/**
 * Rocker Tool Definitions
 * 
 * Defines all tools available to Rocker for interacting with the site.
 */

export const rockerTools = [
  {
    type: "function",
    name: "navigate",
    description: "Navigate to a different page on the site. Use this when user asks to open, go to, or view a specific page.",
    parameters: {
      type: "object",
      properties: {
        path: {
          type: "string",
          description: "The path to navigate to (e.g., /dashboard, /horses, /marketplace, /events, /profile, /business/:id/hub, /mlm/dashboard)",
        }
      },
      required: ["path"]
    }
  },
  {
    type: "function",
    name: "click_element",
    description: "Click a button, link, or other interactive element on the current page. Use when user asks to click, press, or activate something.",
    parameters: {
      type: "object",
      properties: {
        element_name: {
          type: "string",
          description: "Natural description of what to click (e.g., 'submit button', 'post button', 'save', 'create event')",
        }
      },
      required: ["element_name"]
    }
  },
  {
    type: "function",
    name: "fill_field",
    description: "Fill in a form field with text. Use when user provides content to enter into a field.",
    parameters: {
      type: "object",
      properties: {
        field_name: {
          type: "string",
          description: "Natural description of the field (e.g., 'title', 'description', 'comment', 'message')",
        },
        value: {
          type: "string",
          description: "The text to enter into the field",
        }
      },
      required: ["field_name", "value"]
    }
  },
  {
    type: "function",
    name: "create_post",
    description: "Create a new post with the given content. Use when user asks to post, share, or publish something.",
    parameters: {
      type: "object",
      properties: {
        content: {
          type: "string",
          description: "The content of the post",
        }
      },
      required: ["content"]
    }
  },
  {
    type: "function",
    name: "create_horse",
    description: "Create a new horse profile. Use when user asks to add a horse, create a horse profile, or register a horse.",
    parameters: {
      type: "object",
      properties: {
        name: {
          type: "string",
          description: "The horse's name",
        },
        breed: {
          type: "string",
          description: "The horse's breed (optional)",
        },
        color: {
          type: "string",
          description: "The horse's color (optional)",
        },
        description: {
          type: "string",
          description: "Description of the horse (optional)",
        }
      },
      required: ["name"]
    }
  },
  {
    type: "function",
    name: "create_business",
    description: "Create a new business profile. Use when user wants to create a business, register a company, or start a business account.",
    parameters: {
      type: "object",
      properties: {
        name: {
          type: "string",
          description: "The business name",
        },
        description: {
          type: "string",
          description: "Description of the business (optional)",
        }
      },
      required: ["name"]
    }
  },
  {
    type: "function",
    name: "create_listing",
    description: "Create a marketplace listing. Use when user wants to sell something, create a listing, or post an item for sale.",
    parameters: {
      type: "object",
      properties: {
        title: {
          type: "string",
          description: "Title of the listing",
        },
        description: {
          type: "string",
          description: "Description of the item",
        },
        price: {
          type: "number",
          description: "Price in dollars",
        },
        category: {
          type: "string",
          description: "Category (e.g., 'tack', 'equipment', 'services')",
        }
      },
      required: ["title", "price", "category"]
    }
  },
  {
    type: "function",
    name: "add_to_cart",
    description: "Add an item to the shopping cart. Use when user wants to buy something or add to cart.",
    parameters: {
      type: "object",
      properties: {
        listing_id: {
          type: "string",
          description: "The ID of the listing to add (if known), or 'current' for currently viewed item",
        }
      },
      required: ["listing_id"]
    }
  },
  {
    type: "function",
    name: "upload_file",
    description: "Upload and process a file (image, CSV, PDF, document). Use when user mentions uploading or analyzing a file.",
    parameters: {
      type: "object",
      properties: {
        instruction: {
          type: "string",
          description: "What to do with the file after upload (e.g., 'analyze this CSV', 'extract text from PDF', 'describe this image')"
        }
      }
    }
  },
  {
    type: "function",
    name: "fetch_url",
    description: "Fetch and analyze content from a website URL. Use when user provides a link or asks to check a website.",
    parameters: {
      type: "object",
      properties: {
        url: {
          type: "string",
          description: "The URL to fetch and analyze"
        },
        action: {
          type: "string",
          description: "What to do with the content (e.g., 'summarize', 'extract data', 'analyze')"
        }
      },
      required: ["url"]
    }
  },
  {
    type: "function",
    name: "connect_google_drive",
    description: "Connect to user's Google Drive to access their files. Opens authorization window.",
    parameters: {
      type: "object",
      properties: {},
      required: []
    }
  },
  {
    type: "function",
    name: "list_google_drive_files",
    description: "List files from connected Google Drive. Can search for specific file types or names.",
    parameters: {
      type: "object",
      properties: {
        query: {
          type: "string",
          description: "Optional search query (e.g., 'name contains \"report\"')"
        }
      },
      required: []
    }
  },
  {
    type: "function",
    name: "download_google_drive_file",
    description: "Download and process a specific file from Google Drive.",
    parameters: {
      type: "object",
      properties: {
        fileId: {
          type: "string",
          description: "The Google Drive file ID"
        },
        fileName: {
          type: "string",
          description: "The name of the file"
        }
      },
      required: ["fileId", "fileName"]
    }
  },
  {
    type: "function",
    name: "create_crm_contact",
    description: "Create a new CRM contact for a business. Use when user wants to add a contact, create a lead, or add someone to CRM.",
    parameters: {
      type: "object",
      properties: {
        business_id: {
          type: "string",
          description: "The business ID",
        },
        name: {
          type: "string",
          description: "Contact's name",
        },
        email: {
          type: "string",
          description: "Contact's email (optional)",
        },
        phone: {
          type: "string",
          description: "Contact's phone (optional)",
        },
        notes: {
          type: "string",
          description: "Notes about the contact (optional)",
        }
      },
      required: ["business_id", "name"]
    }
  },
  {
    type: "function",
    name: "edit_profile",
    description: "Edit user profile information. Use when user wants to update their profile, change bio, or edit profile details.",
    parameters: {
      type: "object",
      properties: {
        display_name: {
          type: "string",
          description: "Display name (optional)",
        },
        bio: {
          type: "string",
          description: "Biography text (optional)",
        },
        avatar_url: {
          type: "string",
          description: "Avatar URL (optional)",
        }
      },
      required: []
    }
  },
  {
    type: "function",
    name: "claim_entity",
    description: "Claim ownership of a horse, business, or other entity profile. Use when user wants to claim a profile.",
    parameters: {
      type: "object",
      properties: {
        entity_id: {
          type: "string",
          description: "The entity ID to claim, or 'current' for currently viewed entity",
        },
        entity_type: {
          type: "string",
          description: "Type of entity (horse, business, event)",
        }
      },
      required: ["entity_id", "entity_type"]
    }
  },
  {
    type: "function",
    name: "search",
    description: "Search for horses, events, users, or businesses on the site. Use when user asks to find or search for something.",
    parameters: {
      type: "object",
      properties: {
        query: {
          type: "string",
          description: "What to search for",
        },
        type: {
          type: "string",
          enum: ["horse", "event", "user", "business", "all"],
          description: "Type of content to search for",
        }
      },
      required: ["query"]
    }
  },
  {
    type: "function",
    name: "save_post",
    description: "Save/bookmark a post for later. Use when user asks to save, bookmark, or remember a post.",
    parameters: {
      type: "object",
      properties: {
        post_id: {
          type: "string",
          description: "The ID of the post to save (if known), or 'current' for the currently viewed post",
        }
      },
      required: ["post_id"]
    }
  },
  {
    type: "function",
    name: "get_page_info",
    description: "Get information about the current page - what's on it, available actions, etc. Use when user asks what they can do or what's available.",
    parameters: {
      type: "object",
      properties: {},
      required: []
    }
  },
  {
    type: "function",
    name: "scroll_page",
    description: "Scroll the page up, down, to top, or to bottom.",
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
          enum: ["little", "screen", "page"],
          description: "How much to scroll"
        }
      },
      required: ["direction"]
    }
  },
  {
    type: "function",
    name: "create_event",
    description: "Create a new event. Use when user wants to create, schedule, or organize an event.",
    parameters: {
      type: "object",
      properties: {
        title: { type: "string", description: "Event name" },
        event_type: { type: "string", description: "Type of event (e.g., 'rodeo', 'barrel race', 'show')" },
        starts_at: { type: "string", description: "Start date/time" },
        ends_at: { type: "string", description: "End date/time (optional)" },
        description: { type: "string", description: "Event description (optional)" }
      },
      required: ["title", "event_type", "starts_at"]
    }
  },
  {
    type: "function",
    name: "register_event",
    description: "Register for an event or enter a horse in an event.",
    parameters: {
      type: "object",
      properties: {
        event_id: { type: "string", description: "Event ID or 'current'" },
        horse_id: { type: "string", description: "Horse ID (optional)" },
        class_name: { type: "string", description: "Class/division name (optional)" }
      },
      required: ["event_id"]
    }
  },
  {
    type: "function",
    name: "upload_results",
    description: "Upload event results or times. Use for adding run times, scores, or placements.",
    parameters: {
      type: "object",
      properties: {
        event_id: { type: "string", description: "Event ID" },
        results_data: { type: "object", description: "Results data (times, scores, placements)" }
      },
      required: ["event_id", "results_data"]
    }
  },
  {
    type: "function",
    name: "manage_entries",
    description: "Manage event entries - approve, reject, or organize entries.",
    parameters: {
      type: "object",
      properties: {
        event_id: { type: "string", description: "Event ID" },
        action: { type: "string", enum: ["approve", "reject", "organize"], description: "Action to perform" },
        entry_ids: { type: "array", items: { type: "string" }, description: "Entry IDs to manage" }
      },
      required: ["event_id", "action"]
    }
  },
  {
    type: "function",
    name: "start_timer",
    description: "Start event timer for live timing. Use during live events.",
    parameters: {
      type: "object",
      properties: {
        event_id: { type: "string", description: "Event ID" },
        run_id: { type: "string", description: "Run/entry ID" }
      },
      required: ["event_id"]
    }
  },
  {
    type: "function",
    name: "send_message",
    description: "Send a message to another user or start a conversation.",
    parameters: {
      type: "object",
      properties: {
        recipient_id: { type: "string", description: "Recipient user ID" },
        content: { type: "string", description: "Message content" },
        thread_id: { type: "string", description: "Thread ID for replies (optional)" }
      },
      required: ["recipient_id", "content"]
    }
  },
  {
    type: "function",
    name: "mark_notification_read",
    description: "Mark notifications as read or clear notifications.",
    parameters: {
      type: "object",
      properties: {
        notification_id: { type: "string", description: "Notification ID or 'all' for all notifications" }
      },
      required: ["notification_id"]
    }
  },
  {
    type: "function",
    name: "checkout",
    description: "Proceed to checkout with items in cart.",
    parameters: {
      type: "object",
      properties: {
        payment_method: { type: "string", description: "Payment method (optional)" }
      },
      required: []
    }
  },
  {
    type: "function",
    name: "view_orders",
    description: "View order history or order details.",
    parameters: {
      type: "object",
      properties: {
        order_id: { type: "string", description: "Specific order ID (optional)" }
      },
      required: []
    }
  },
  {
    type: "function",
    name: "create_pos_order",
    description: "Create a point-of-sale order for a business.",
    parameters: {
      type: "object",
      properties: {
        business_id: { type: "string", description: "Business ID" },
        items: { type: "array", items: { type: "object" }, description: "Order items" },
        customer_id: { type: "string", description: "Customer ID (optional)" }
      },
      required: ["business_id", "items"]
    }
  },
  {
    type: "function",
    name: "manage_inventory",
    description: "Add, update, or check inventory for a business.",
    parameters: {
      type: "object",
      properties: {
        business_id: { type: "string", description: "Business ID" },
        action: { type: "string", enum: ["add", "update", "check"], description: "Action to perform" },
        item_name: { type: "string", description: "Item name" },
        quantity: { type: "number", description: "Quantity (optional)" }
      },
      required: ["business_id", "action", "item_name"]
    }
  },
  {
    type: "function",
    name: "create_shift",
    description: "Create or schedule an employee shift.",
    parameters: {
      type: "object",
      properties: {
        business_id: { type: "string", description: "Business ID" },
        employee_id: { type: "string", description: "Employee ID" },
        start_time: { type: "string", description: "Shift start time" },
        end_time: { type: "string", description: "Shift end time" }
      },
      required: ["business_id", "employee_id", "start_time", "end_time"]
    }
  },
  {
    type: "function",
    name: "manage_team",
    description: "Add or manage team members for a business.",
    parameters: {
      type: "object",
      properties: {
        business_id: { type: "string", description: "Business ID" },
        action: { type: "string", enum: ["add", "remove", "update_role"], description: "Action" },
        user_id: { type: "string", description: "User ID" },
        role: { type: "string", description: "Team role (optional)" }
      },
      required: ["business_id", "action", "user_id"]
    }
  },
  {
    type: "function",
    name: "flag_content",
    description: "Flag or report content for moderation.",
    parameters: {
      type: "object",
      properties: {
        content_type: { type: "string", description: "Type (post, listing, profile, etc.)" },
        content_id: { type: "string", description: "Content ID or 'current'" },
        reason: { type: "string", description: "Reason for flagging" }
      },
      required: ["content_type", "content_id", "reason"]
    }
  },
  {
    type: "function",
    name: "moderate_content",
    description: "Admin: Moderate flagged content - approve, remove, or warn.",
    parameters: {
      type: "object",
      properties: {
        flag_id: { type: "string", description: "Flag ID" },
        action: { type: "string", enum: ["approve", "remove", "warn"], description: "Moderation action" },
        notes: { type: "string", description: "Moderation notes (optional)" }
      },
      required: ["flag_id", "action"]
    }
  },
  {
    type: "function",
    name: "bulk_upload",
    description: "Admin: Bulk upload data (horses, events, users, etc.).",
    parameters: {
      type: "object",
      properties: {
        data_type: { type: "string", description: "Type of data (horses, events, users)" },
        file_path: { type: "string", description: "File path or 'browse' to select" }
      },
      required: ["data_type"]
    }
  },
  {
    type: "function",
    name: "create_automation",
    description: "Create an AI automation or workflow.",
    parameters: {
      type: "object",
      properties: {
        name: { type: "string", description: "Automation name" },
        trigger: { type: "string", description: "Trigger event" },
        action: { type: "string", description: "Action to perform" }
      },
      required: ["name", "trigger", "action"]
    }
  },
  {
    type: "function",
    name: "update_memory",
    description: "Update or add to AI memory/preferences.",
    parameters: {
      type: "object",
      properties: {
        key: { type: "string", description: "Memory key" },
        value: { type: "string", description: "Memory value" }
      },
      required: ["key", "value"]
    }
  },
  {
    type: "function",
    name: "create_profile",
    description: "Create any type of profile (rider, trainer, breeder, farm, facility, vendor, etc.).",
    parameters: {
      type: "object",
      properties: {
        profile_type: { type: "string", description: "Type (rider, trainer, owner, breeder, farm, facility, vendor, sponsor, photographer)" },
        name: { type: "string", description: "Profile name" },
        description: { type: "string", description: "Description (optional)" }
      },
      required: ["profile_type", "name"]
    }
  },
  {
    type: "function",
    name: "export_data",
    description: "Export data in various formats (CSV, JSON, PDF).",
    parameters: {
      type: "object",
      properties: {
        data_type: { type: "string", description: "What to export (orders, entries, results, etc.)" },
        format: { type: "string", enum: ["csv", "json", "pdf"], description: "Export format" },
        filters: { type: "object", description: "Filters to apply (optional)" }
      },
      required: ["data_type", "format"]
    }
  },
  {
    type: "function",
    name: "upload_media",
    description: "Upload photos, videos, or other media files.",
    parameters: {
      type: "object",
      properties: {
        file_type: { type: "string", description: "Type (photo, video, document)" },
        caption: { type: "string", description: "Caption or description (optional)" },
        linked_entity_id: { type: "string", description: "Link to horse, event, etc. (optional)" }
      },
      required: ["file_type"]
    }
  },
  {
    type: "function",
    name: "reshare_post",
    description: "Reshare or repost content with optional commentary.",
    parameters: {
      type: "object",
      properties: {
        post_id: { type: "string", description: "Post ID or 'current'" },
        commentary: { type: "string", description: "Additional commentary (optional)" }
      },
      required: ["post_id"]
    }
  },
  {
    type: "function",
    name: "request_category",
    description: "Request a new marketplace category or feature.",
    parameters: {
      type: "object",
      properties: {
        category_name: { type: "string", description: "Requested category name" },
        reason: { type: "string", description: "Why this category is needed" }
      },
      required: ["category_name", "reason"]
    }
  },
  {
    type: "function",
    name: "submit_feedback",
    description: "Submit feedback, bug report, or feature request.",
    parameters: {
      type: "object",
      properties: {
        type: { type: "string", enum: ["feedback", "bug", "feature"], description: "Type of submission" },
        content: { type: "string", description: "Feedback content" }
      },
      required: ["type", "content"]
    }
  },
  {
    type: "function",
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
    type: "function",
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
    type: "function",
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
    type: "function",
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
    type: "function",
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
    type: "function",
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

export type RockerTool = typeof rockerTools[number];
export type ToolName = RockerTool['name'];