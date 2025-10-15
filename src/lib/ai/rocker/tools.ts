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
  }
];

export type RockerTool = typeof rockerTools[number];
export type ToolName = RockerTool['name'];