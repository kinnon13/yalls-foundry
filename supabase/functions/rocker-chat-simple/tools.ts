/**
 * Rocker Tool Definitions for AI
 * Subset of most useful tools for chat context
 */

export const rockerTools = [
  {
    type: "function",
    name: "navigate",
    description: "Navigate to a different page. Use when user asks to go somewhere.",
    parameters: {
      type: "object",
      properties: {
        path: {
          type: "string",
          description: "Path to navigate to (e.g., /dashboard, /profile, /marketplace)",
        }
      },
      required: ["path"]
    }
  },
  {
    type: "function",
    name: "search_memory",
    description: "Search user's memory/preferences. Use when user asks about their past info, preferences, or what you know about them.",
    parameters: {
      type: "object",
      properties: {
        query: {
          type: "string",
          description: "What to search for in memory",
        },
        tags: {
          type: "array",
          items: { type: "string" },
          description: "Optional filter tags"
        }
      },
      required: ["query"]
    }
  },
  {
    type: "function",
    name: "write_memory",
    description: "Save information about the user for future reference. Use when learning new preferences, facts, or goals.",
    parameters: {
      type: "object",
      properties: {
        type: {
          type: "string",
          enum: ["preference", "fact", "goal", "note"],
          description: "Type of memory to save"
        },
        key: {
          type: "string",
          description: "Memory key (e.g., 'favorite_color', 'workout_goal')"
        },
        value: {
          type: "string",
          description: "The value to remember"
        }
      },
      required: ["type", "key", "value"]
    }
  },
  {
    type: "function",
    name: "create_task",
    description: "Create a task for the user. Use when user asks to remind them or track something.",
    parameters: {
      type: "object",
      properties: {
        title: {
          type: "string",
          description: "Task title"
        },
        priority: {
          type: "string",
          enum: ["low", "medium", "high"],
          description: "Task priority"
        }
      },
      required: ["title"]
    }
  },
  {
    type: "function",
    name: "search_entities",
    description: "Search for businesses, people, or organizations on the platform.",
    parameters: {
      type: "object",
      properties: {
        query: {
          type: "string",
          description: "What to search for"
        },
        type: {
          type: "string",
          enum: ["business", "person", "org"],
          description: "Type of entity"
        }
      },
      required: ["query"]
    }
  },
  {
    type: "function",
    name: "get_user_profile",
    description: "Get user's profile information. Use when user asks about their account or profile.",
    parameters: {
      type: "object",
      properties: {},
      required: []
    }
  }
];
