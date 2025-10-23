/**
 * Rocker Tool Definitions
 * Complete catalog of all 60+ executable tools
 */

export interface ToolParameter {
  type: string;
  description: string;
  enum?: string[];
  required?: boolean;
}

export interface ToolDefinition {
  name: string;
  description: string;
  parameters: {
    type: 'object';
    properties: Record<string, ToolParameter>;
    required: string[];
  };
}

export const rockerTools: ToolDefinition[] = [
  // ============= NAVIGATION & UI (7) =============
  {
    name: 'navigate',
    description: 'Navigate to a different page in the app',
    parameters: {
      type: 'object',
      properties: {
        path: { type: 'string', description: 'URL path to navigate to (e.g., /profile, /dashboard)' }
      },
      required: ['path']
    }
  },
  {
    name: 'start_tour',
    description: 'Start the platform tour for new users',
    parameters: {
      type: 'object',
      properties: {},
      required: []
    }
  },
  {
    name: 'navigate_to_tour_stop',
    description: 'Navigate to a specific section in the tour',
    parameters: {
      type: 'object',
      properties: {
        section: { type: 'string', description: 'Tour section to navigate to' }
      },
      required: ['section']
    }
  },
  {
    name: 'click_element',
    description: 'Click a UI element by name',
    parameters: {
      type: 'object',
      properties: {
        element_name: { type: 'string', description: 'Name or identifier of the element to click' }
      },
      required: ['element_name']
    }
  },
  {
    name: 'get_page_elements',
    description: 'Get list of interactive elements on current page',
    parameters: {
      type: 'object',
      properties: {
        element_type: { type: 'string', description: 'Filter by element type (button, link, input)' }
      },
      required: []
    }
  },
  {
    name: 'fill_field',
    description: 'Fill a form field with a value',
    parameters: {
      type: 'object',
      properties: {
        field_name: { type: 'string', description: 'Name or label of the field' },
        value: { type: 'string', description: 'Value to enter' }
      },
      required: ['field_name', 'value']
    }
  },
  {
    name: 'scroll_page',
    description: 'Scroll the page',
    parameters: {
      type: 'object',
      properties: {
        direction: { type: 'string', description: 'Direction to scroll', enum: ['up', 'down', 'top', 'bottom'] },
        amount: { type: 'number', description: 'Pixels to scroll (optional)' }
      },
      required: ['direction']
    }
  },

  // ============= MEMORY & PROFILE (4) =============
  {
    name: 'search_memory',
    description: 'Search user memories and preferences',
    parameters: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Search query' },
        tags: { type: 'array', description: 'Filter by tags' }
      },
      required: ['query']
    }
  },
  {
    name: 'write_memory',
    description: 'Save a new memory or preference for the user',
    parameters: {
      type: 'object',
      properties: {
        key: { type: 'string', description: 'Memory key/identifier' },
        value: { type: 'string', description: 'Memory value/content' },
        type: { type: 'string', description: 'Memory type', enum: ['preference', 'fact', 'goal', 'note'] }
      },
      required: ['key', 'value']
    }
  },
  {
    name: 'get_user_profile',
    description: 'Get current user profile information',
    parameters: {
      type: 'object',
      properties: {},
      required: []
    }
  },
  {
    name: 'get_page_info',
    description: 'Get information about the current page',
    parameters: {
      type: 'object',
      properties: {},
      required: []
    }
  },

  // ============= CONTENT CREATION (8) =============
  {
    name: 'create_post',
    description: 'Create a new post or content item',
    parameters: {
      type: 'object',
      properties: {
        content: { type: 'string', description: 'Post content' },
        visibility: { type: 'string', description: 'Post visibility', enum: ['public', 'private', 'friends'] }
      },
      required: ['content']
    }
  },
  {
    name: 'create_horse',
    description: 'Create a new horse profile',
    parameters: {
      type: 'object',
      properties: {
        name: { type: 'string', description: 'Horse name' },
        breed: { type: 'string', description: 'Horse breed' },
        color: { type: 'string', description: 'Horse color' },
        description: { type: 'string', description: 'Horse description' }
      },
      required: ['name']
    }
  },
  {
    name: 'create_business',
    description: 'Create a new business profile',
    parameters: {
      type: 'object',
      properties: {
        name: { type: 'string', description: 'Business name' },
        description: { type: 'string', description: 'Business description' }
      },
      required: ['name']
    }
  },
  {
    name: 'create_listing',
    description: 'Create a marketplace listing',
    parameters: {
      type: 'object',
      properties: {
        title: { type: 'string', description: 'Listing title' },
        price: { type: 'number', description: 'Price' },
        description: { type: 'string', description: 'Description' }
      },
      required: ['title', 'price']
    }
  },
  {
    name: 'create_event',
    description: 'Create an event',
    parameters: {
      type: 'object',
      properties: {
        title: { type: 'string', description: 'Event title' },
        date: { type: 'string', description: 'Event date' },
        location: { type: 'string', description: 'Event location' }
      },
      required: ['title', 'date']
    }
  },
  {
    name: 'create_profile',
    description: 'Create a new entity profile',
    parameters: {
      type: 'object',
      properties: {
        name: { type: 'string', description: 'Profile name' },
        profile_type: { type: 'string', description: 'Type of profile', enum: ['person', 'horse', 'business', 'property'] },
        description: { type: 'string', description: 'Profile description' }
      },
      required: ['name', 'profile_type']
    }
  },
  {
    name: 'create_crm_contact',
    description: 'Create a CRM contact',
    parameters: {
      type: 'object',
      properties: {
        name: { type: 'string', description: 'Contact name' },
        email: { type: 'string', description: 'Contact email' },
        phone: { type: 'string', description: 'Contact phone' }
      },
      required: ['name']
    }
  },
  {
    name: 'upload_media',
    description: 'Upload media file',
    parameters: {
      type: 'object',
      properties: {
        file_type: { type: 'string', description: 'Type of file', enum: ['image', 'video', 'document'] }
      },
      required: ['file_type']
    }
  },

  // ============= SEARCH & DISCOVERY (3) =============
  {
    name: 'search',
    description: 'Search across all platform content',
    parameters: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Search query' },
        type: { type: 'string', description: 'Filter by content type' }
      },
      required: ['query']
    }
  },
  {
    name: 'search_entities',
    description: 'Search for entities (profiles, businesses, horses)',
    parameters: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Search query' },
        type: { type: 'string', description: 'Entity type filter' }
      },
      required: ['query']
    }
  },
  {
    name: 'claim_entity',
    description: 'Claim ownership of an entity profile',
    parameters: {
      type: 'object',
      properties: {
        entity_id: { type: 'string', description: 'Entity ID to claim' },
        entity_type: { type: 'string', description: 'Type of entity' }
      },
      required: ['entity_id', 'entity_type']
    }
  },

  // ============= CALENDAR (6) =============
  {
    name: 'create_calendar',
    description: 'Create a new calendar',
    parameters: {
      type: 'object',
      properties: {
        name: { type: 'string', description: 'Calendar name' },
        color: { type: 'string', description: 'Calendar color' }
      },
      required: ['name']
    }
  },
  {
    name: 'create_calendar_event',
    description: 'Create a calendar event',
    parameters: {
      type: 'object',
      properties: {
        title: { type: 'string', description: 'Event title' },
        starts_at: { type: 'string', description: 'Start time (ISO format)' },
        ends_at: { type: 'string', description: 'End time (ISO format)' },
        calendar_id: { type: 'string', description: 'Calendar ID' }
      },
      required: ['title', 'starts_at']
    }
  },
  {
    name: 'share_calendar',
    description: 'Share a calendar with another user',
    parameters: {
      type: 'object',
      properties: {
        calendar_id: { type: 'string', description: 'Calendar to share' },
        profile_id: { type: 'string', description: 'User to share with' },
        role: { type: 'string', description: 'Permission role', enum: ['viewer', 'editor', 'owner'] }
      },
      required: ['calendar_id', 'profile_id', 'role']
    }
  },
  {
    name: 'list_calendars',
    description: 'List user calendars',
    parameters: {
      type: 'object',
      properties: {
        profile_id: { type: 'string', description: 'Profile ID (optional)' }
      },
      required: []
    }
  },
  {
    name: 'get_calendar_events',
    description: 'Get events from a calendar',
    parameters: {
      type: 'object',
      properties: {
        calendar_id: { type: 'string', description: 'Calendar ID' },
        start_date: { type: 'string', description: 'Start date filter' },
        end_date: { type: 'string', description: 'End date filter' }
      },
      required: []
    }
  },
  {
    name: 'create_calendar_collection',
    description: 'Create a calendar collection',
    parameters: {
      type: 'object',
      properties: {
        name: { type: 'string', description: 'Collection name' },
        calendar_ids: { type: 'array', description: 'Calendar IDs to include' }
      },
      required: ['name']
    }
  },

  // ============= TASKS & REMINDERS (2) =============
  {
    name: 'create_task',
    description: 'Create a task or todo item',
    parameters: {
      type: 'object',
      properties: {
        title: { type: 'string', description: 'Task title' },
        priority: { type: 'string', description: 'Priority level', enum: ['low', 'medium', 'high'] },
        due_date: { type: 'string', description: 'Due date (ISO format)' }
      },
      required: ['title']
    }
  },
  {
    name: 'set_reminder',
    description: 'Set a reminder for a specific time',
    parameters: {
      type: 'object',
      properties: {
        message: { type: 'string', description: 'Reminder message' },
        time: { type: 'string', description: 'Reminder time (ISO format)' }
      },
      required: ['message', 'time']
    }
  },

  // ============= COMMUNICATION (3) =============
  {
    name: 'send_message',
    description: 'Send a message to another user',
    parameters: {
      type: 'object',
      properties: {
        recipient_id: { type: 'string', description: 'Recipient user ID' },
        content: { type: 'string', description: 'Message content' }
      },
      required: ['recipient_id', 'content']
    }
  },
  {
    name: 'mark_notification_read',
    description: 'Mark notifications as read',
    parameters: {
      type: 'object',
      properties: {
        notification_id: { type: 'string', description: 'Notification ID or "all"' }
      },
      required: ['notification_id']
    }
  },
  {
    name: 'message_user',
    description: 'Send a direct message',
    parameters: {
      type: 'object',
      properties: {
        recipient_id: { type: 'string', description: 'Recipient ID' },
        content: { type: 'string', description: 'Message content' }
      },
      required: ['recipient_id', 'content']
    }
  },

  // ============= CONTENT INTERACTION (5) =============
  {
    name: 'save_post',
    description: 'Save a post for later',
    parameters: {
      type: 'object',
      properties: {
        post_id: { type: 'string', description: 'Post ID to save' }
      },
      required: ['post_id']
    }
  },
  {
    name: 'reshare_post',
    description: 'Reshare a post',
    parameters: {
      type: 'object',
      properties: {
        post_id: { type: 'string', description: 'Post ID to reshare' },
        commentary: { type: 'string', description: 'Optional commentary' }
      },
      required: ['post_id']
    }
  },
  {
    name: 'edit_profile',
    description: 'Edit user profile',
    parameters: {
      type: 'object',
      properties: {
        display_name: { type: 'string', description: 'Display name' },
        bio: { type: 'string', description: 'Bio text' },
        avatar_url: { type: 'string', description: 'Avatar URL' }
      },
      required: []
    }
  },
  {
    name: 'follow_user',
    description: 'Follow another user',
    parameters: {
      type: 'object',
      properties: {
        user_id: { type: 'string', description: 'User ID to follow' }
      },
      required: ['user_id']
    }
  },
  {
    name: 'unfollow_user',
    description: 'Unfollow a user',
    parameters: {
      type: 'object',
      properties: {
        user_id: { type: 'string', description: 'User ID to unfollow' }
      },
      required: ['user_id']
    }
  },

  // ============= ADMIN TOOLS (3) =============
  {
    name: 'flag_content',
    description: 'Flag content for moderation',
    parameters: {
      type: 'object',
      properties: {
        content_type: { type: 'string', description: 'Type of content' },
        content_id: { type: 'string', description: 'Content ID' },
        reason: { type: 'string', description: 'Flagging reason' }
      },
      required: ['content_type', 'content_id', 'reason']
    }
  },
  {
    name: 'moderate_content',
    description: 'Moderate flagged content (admin only)',
    parameters: {
      type: 'object',
      properties: {
        flag_id: { type: 'string', description: 'Flag ID' },
        action: { type: 'string', description: 'Moderation action', enum: ['approve', 'remove', 'warn'] },
        notes: { type: 'string', description: 'Moderator notes' }
      },
      required: ['flag_id', 'action']
    }
  },
  {
    name: 'submit_feedback',
    description: 'Submit feedback about the platform',
    parameters: {
      type: 'object',
      properties: {
        type: { type: 'string', description: 'Feedback type', enum: ['bug', 'feature', 'praise', 'other'] },
        content: { type: 'string', description: 'Feedback content' }
      },
      required: ['type', 'content']
    }
  }
];
