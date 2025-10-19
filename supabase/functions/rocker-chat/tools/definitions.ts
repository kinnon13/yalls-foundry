/**
 * Tool definitions for OpenAI function calling
 * Describes all available tools the AI can use across different modes
 */

export const TOOL_DEFINITIONS = [
  {
    type: "function",
    function: {
      name: "start_tour",
      description: "Start a guided tour of the platform. Use when user says 'show me around', 'give me a tour', or wants to learn about the platform features.",
      parameters: {
        type: "object",
        properties: {}
      }
    }
  },
  {
    type: "function",
    function: {
      name: "navigate_to_tour_stop",
      description: "Navigate to and explain a specific section during the tour",
      parameters: {
        type: "object",
        required: ["section"],
        properties: {
          section: {
            type: "string",
            enum: ["home", "marketplace", "calendar", "horses", "dashboard", "ai-management", "admin"],
            description: "The platform section to visit and explain"
          }
        }
      }
    }
  },
  {
    type: "function",
    function: {
      name: "get_page_elements",
      description: "Get a detailed list of all interactive elements (buttons, links, form fields) on the current page with their attributes. Use when asked to see what elements are available or to audit page structure.",
      parameters: {
        type: "object",
        properties: {
          element_type: {
            type: "string",
            enum: ["all", "buttons", "fields", "links"],
            description: "Type of elements to list (default: all)"
          }
        }
      }
    }
  },
  {
    type: "function",
    function: {
      name: "navigate",
      description: "Navigate the user to a specific page in the application",
      parameters: {
        type: "object",
        required: ["path"],
        properties: {
          path: {
            type: "string",
            description: "The route path to navigate to, e.g., '/calendar', '/events', '/horses/123'"
          }
        }
      }
    }
  },
  {
    type: "function",
    function: {
      name: "get_current_user",
      description: "Get information about the current authenticated user including their profile, email, and display name",
      parameters: {
        type: "object",
        properties: {}
      }
    }
  },
  {
    type: "function",
    function: {
      name: "write_memory",
      description: "Store information about the user for future recall. Use proactively whenever you learn something about them.",
      parameters: {
        type: "object",
        required: ["key", "value", "type"],
        properties: {
          key: {
            type: "string",
            description: "Unique identifier for this memory"
          },
          value: {
            type: "string",
            description: "The information to store"
          },
          type: {
            type: "string",
            enum: ["preference", "fact", "goal", "note", "family", "family_member", "personal_info", "interest", "hobby", "skill", "project", "project_context", "relationship", "notification_preference"],
            description: "Category of the memory"
          }
        }
      }
    }
  },
  {
    type: "function",
    function: {
      name: "recall_user_context",
      description: "Retrieve stored information about the user, their businesses, and preferences",
      parameters: {
        type: "object",
        properties: {
          include_memory: {
            type: "boolean",
            description: "Include user memories and preferences"
          },
          include_analytics: {
            type: "boolean",
            description: "Include usage analytics and patterns"
          }
        }
      }
    }
  },
  {
    type: "function",
    function: {
      name: "search_entities",
      description: "Search for horses, trainers, facilities, or other entities on the platform",
      parameters: {
        type: "object",
        required: ["query"],
        properties: {
          query: {
            type: "string",
            description: "Search query"
          },
          entity_type: {
            type: "string",
            enum: ["horse", "trainer", "facility", "organization"],
            description: "Filter by entity type"
          }
        }
      }
    }
  },
  {
    type: "function",
    function: {
      name: "get_business_data",
      description: "Get information about a specific business including team, metrics, and capabilities",
      parameters: {
        type: "object",
        required: ["business_id"],
        properties: {
          business_id: {
            type: "string",
            description: "The business UUID"
          }
        }
      }
    }
  },
  {
    type: "function",
    function: {
      name: "get_mlm_stats",
      description: "Get MLM network statistics for the current user",
      parameters: {
        type: "object",
        properties: {}
      }
    }
  },
  {
    type: "function",
    function: {
      name: "recall_content",
      description: "Search and recall marketplace listings, posts, or other content",
      parameters: {
        type: "object",
        required: ["query"],
        properties: {
          query: {
            type: "string",
            description: "Search query for content"
          },
          content_type: {
            type: "string",
            enum: ["marketplace", "post", "event"],
            description: "Type of content to search"
          }
        }
      }
    }
  },
  {
    type: "function",
    function: {
      name: "create_event",
      description: "Create a new platform event (competition, clinic, etc.)",
      parameters: {
        type: "object",
        required: ["title"],
        properties: {
          title: {
            type: "string",
            description: "Event title"
          },
          event_type: {
            type: "string",
            enum: ["competition", "clinic", "social", "other"],
            description: "Type of event"
          }
        }
      }
    }
  },
  {
    type: "function",
    function: {
      name: "create_calendar_event",
      description: "Create a calendar event with optional reminders",
      parameters: {
        type: "object",
        required: ["title", "starts_at"],
        properties: {
          title: { type: "string", description: "Event title" },
          description: { type: "string", description: "Event description" },
          starts_at: { type: "string", description: "ISO 8601 start time" },
          ends_at: { type: "string", description: "ISO 8601 end time" },
          all_day: { type: "boolean", description: "All-day event" },
          reminder_minutes: { type: "number", description: "Minutes before to remind" },
          tts_message: { type: "string", description: "Custom TTS message for voice reminder" }
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
          file_path: { type: "string", description: "Path to the file to edit" },
          operation: {
            type: "string",
            enum: ["replace", "append", "prepend", "update_section"],
            description: "Type of edit operation"
          },
          content: { type: "string", description: "Content to add or replace" },
          section: { type: "string", description: "For update_section: which section to update (optional)" }
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
          query: { type: "string", description: "Search query - can be file name pattern or content search" },
          include_pattern: { type: "string", description: "File pattern to include, e.g., 'src/**/*.tsx'" }
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
          file_path: { type: "string", description: "Path to the file to analyze" },
          analysis_type: {
            type: "string",
            enum: ["structure", "dependencies", "issues", "suggestions", "full"],
            description: "Type of analysis to perform"
          }
        }
      }
    }
  },
  {
    type: "function",
    function: {
      name: "create_or_find_profile",
      description: "Create or find a PUBLIC platform profile for trainers, horses, or businesses. DO NOT use for family members or personal relationships - those belong in memory only. Only use when the person/entity should have a discoverable profile on yalls.ai",
      parameters: {
        type: "object",
        required: ["name", "entity_type"],
        properties: {
          name: {
            type: "string",
            description: "Name of the trainer/professional, horse, or business"
          },
          entity_type: {
            type: "string",
            enum: ["user", "horse", "business"],
            description: "Type of entity - use 'user' only for trainers/professionals with public profiles"
          },
          relationship: {
            type: "string",
            description: "Professional relationship to user (e.g., 'trainer', 'farrier', 'vet')"
          },
          contact_info: {
            type: "object",
            properties: {
              email: { type: "string" },
              phone: { type: "string" }
            },
            description: "Optional contact information if provided"
          }
        }
      }
    }
  },
  {
    type: "function",
    function: {
      name: "create_memory_share_request",
      description: "Create a request to share a memory with another user. ALWAYS check safety first with moderate_memory_content before calling this. Only call after user confirms they want to share.",
      parameters: {
        type: "object",
        required: ["memory_id", "to_profile_id"],
        properties: {
          memory_id: {
            type: "string",
            description: "UUID of the memory to share"
          },
          to_profile_id: {
            type: "string",
            description: "UUID of the profile to share with"
          },
          moderation_result: {
            type: "object",
            description: "Result from moderate_memory_content call",
            properties: {
              decision: { type: "string" },
              toxicity_score: { type: "number" },
              safety_category: { type: "string" }
            }
          }
        }
      }
    }
  },
  {
    type: "function",
    function: {
      name: "respond_to_share_request",
      description: "Accept or decline a memory share request. Call this when user responds to a share notification.",
      parameters: {
        type: "object",
        required: ["request_id", "action"],
        properties: {
          request_id: {
            type: "string",
            description: "UUID of the share request"
          },
          action: {
            type: "string",
            enum: ["accept", "decline"],
            description: "User's decision"
          }
        }
      }
    }
  },
  {
    type: "function",
    function: {
      name: "get_pending_share_requests",
      description: "Get pending memory share requests for the current user (both sent and received)",
      parameters: {
        type: "object",
        properties: {
          direction: {
            type: "string",
            enum: ["received", "sent", "all"],
            description: "Filter by direction (default: all)"
          }
        }
      }
    }
  },
  {
    type: "function",
    function: {
      name: "revoke_memory_share",
      description: "Revoke a previously shared memory, removing recipient's access",
      parameters: {
        type: "object",
        required: ["memory_id", "revoke_from_profile_id"],
        properties: {
          memory_id: {
            type: "string",
            description: "UUID of the memory"
          },
          revoke_from_profile_id: {
            type: "string",
            description: "UUID of the profile to revoke access from"
          }
        }
      }
    }
  },
  {
    type: "function",
    function: {
      name: "generate_invite_link",
      description: "Generate a personalized invite link with affiliate tracking for family/friends. Use when user mentions someone who doesn't have a profile and would benefit from joining. The link includes the user's referral code so they get credit and can connect memories.",
      parameters: {
        type: "object",
        required: ["invitee_name", "relationship"],
        properties: {
          invitee_name: {
            type: "string",
            description: "Name of the person being invited (e.g., 'Clay Peck', 'Mom')"
          },
          relationship: {
            type: "string",
            description: "Relationship to user (e.g., 'father', 'mother', 'friend')"
          },
          message: {
            type: "string",
            description: "Optional custom message to include with the invite"
          }
        }
      }
    }
  },
  {
    type: "function",
    function: {
      name: "search_user_conversations",
      description: "Search and analyze conversations from users on the platform. Use to answer questions like 'what did you learn about user X today?' or 'what are people saying about Y?'. Respects privacy - regular admins can only see non-private conversations.",
      parameters: {
        type: "object",
        properties: {
          user_id: {
            type: "string",
            description: "Specific user ID to search conversations for (optional)"
          },
          query: {
            type: "string",
            description: "Search query for conversation content (optional)"
          },
          time_range: {
            type: "string",
            enum: ["today", "this_week", "this_month", "all_time"],
            description: "Time range to search (default: today)"
          },
          limit: {
            type: "number",
            description: "Maximum number of conversations to return (default: 10)"
          }
        }
      }
    }
  },
  {
    type: "function",
    function: {
      name: "analyze_conversation_insights",
      description: "Get aggregated insights and learnings from conversations. Use to answer questions like 'what are the main topics people discuss?' or 'what patterns do you see?'. Returns anonymized insights.",
      parameters: {
        type: "object",
        properties: {
          topic: {
            type: "string",
            description: "Specific topic to analyze (optional)"
          },
          time_range: {
            type: "string",
            enum: ["today", "this_week", "this_month", "all_time"],
            description: "Time range to analyze (default: this_week)"
          },
          insight_type: {
            type: "string",
            enum: ["topics", "trends", "user_interests", "common_questions", "all"],
            description: "Type of insights to return (default: all)"
          }
        }
      }
    }
  },
  {
    type: "function",
    function: {
      name: "send_voice_message",
      description: "Send a voice message to the super admin. Use for non-urgent updates or when voice communication is preferred. Converts text to natural-sounding speech.",
      parameters: {
        type: "object",
        required: ["message"],
        properties: {
          message: {
            type: "string",
            description: "Text message to convert to voice (will be spoken naturally)"
          },
          phone_number: {
            type: "string",
            description: "Optional phone number (uses user's default if not provided)"
          }
        }
      }
    }
  },
  {
    type: "function",
    function: {
      name: "initiate_voice_call",
      description: "Call the super admin for URGENT matters requiring immediate attention (approvals, critical decisions). Respects quiet hours and user preferences. Only use when absolutely necessary.",
      parameters: {
        type: "object",
        required: ["message"],
        properties: {
          message: {
            type: "string",
            description: "Brief summary of why you're calling (will be spoken)"
          },
          phone_number: {
            type: "string",
            description: "Optional phone number (uses user's default if not provided)"
          },
          approval_id: {
            type: "string",
            description: "If calling about an approval, include the approval ID"
          }
        }
      }
    }
  }
];
