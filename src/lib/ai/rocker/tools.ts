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
          description: "The path to navigate to (e.g., /dashboard, /horses, /marketplace, /events, /profile)",
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
    name: "comment",
    description: "Add a comment to the current item (post, horse profile, event, etc.). Use when user asks to comment or leave a message.",
    parameters: {
      type: "object",
      properties: {
        content: {
          type: "string",
          description: "The comment text",
        }
      },
      required: ["content"]
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
    name: "get_page_info",
    description: "Get information about the current page - what's on it, available actions, etc. Use when user asks what they can do or what's available.",
    parameters: {
      type: "object",
      properties: {},
      required: []
    }
  }
];

export type RockerTool = typeof rockerTools[number];
export type ToolName = RockerTool['name'];