/**
 * Rocker Tool Definitions
 * Minimal set for MVP - expand as needed
 */

export const rockerTools = [
  {
    name: 'db.create_task',
    description: 'Create a new task for the user',
    parameters: {
      type: 'object',
      properties: {
        title: { type: 'string', description: 'Task title' },
        description: { type: 'string', description: 'Task details' },
        priority: { type: 'string', enum: ['low', 'medium', 'high'], default: 'medium' },
        due_at: { type: 'string', description: 'ISO date string' }
      },
      required: ['title']
    }
  },
  {
    name: 'db.query_tasks',
    description: 'Get user tasks',
    parameters: {
      type: 'object',
      properties: {
        status: { type: 'string', enum: ['pending', 'done', 'cancelled'] },
        limit: { type: 'number', default: 10 }
      }
    }
  },
  {
    name: 'fe.navigate',
    description: 'Navigate user to a specific page',
    parameters: {
      type: 'object',
      properties: {
        path: { type: 'string', description: 'URL path (e.g., /dashboard)' }
      },
      required: ['path']
    }
  },
  {
    name: 'fe.toast',
    description: 'Show a notification to the user',
    parameters: {
      type: 'object',
      properties: {
        title: { type: 'string' },
        description: { type: 'string' },
        variant: { type: 'string', enum: ['default', 'destructive'], default: 'default' }
      },
      required: ['title']
    }
  }
];
