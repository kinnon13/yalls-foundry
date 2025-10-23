/**
 * Tool Executor for Rocker AI
 * Executes tools called by the AI and returns results
 */

export async function executeTool(
  supabase: any,
  userId: string,
  toolName: string,
  args: any
): Promise<any> {
  console.log(`[executor] Executing tool: ${toolName}`, args);

  try {
    switch (toolName) {
      case 'navigate':
        return { success: true, message: `Navigated to ${args.path}`, path: args.path };

      case 'search_memory': {
        const { data, error } = await supabase.functions.invoke('rocker-memory', {
          body: {
            action: 'search_memory',
            query: args.query,
            tags: args.tags,
            limit: 10
          }
        });
        if (error) throw error;
        return { success: true, memories: data.memories || [] };
      }

      case 'write_memory': {
        const { data, error } = await supabase.functions.invoke('rocker-memory', {
          body: {
            action: 'write_memory',
            entry: {
              tenant_id: userId,
              type: args.type,
              key: args.key,
              value: args.value
            }
          }
        });
        if (error) throw error;
        return { success: true, message: 'Memory saved', memory: data.memory };
      }

      case 'create_task': {
        const { data, error } = await supabase
          .from('rocker_tasks')
          .insert({
            user_id: userId,
            title: args.title,
            status: 'pending',
            priority: args.priority || 'medium',
            meta: { ai_created: true }
          })
          .select()
          .single();
        if (error) throw error;
        return { success: true, message: 'Task created', task: data };
      }

      case 'search_entities': {
        const { data, error } = await supabase.functions.invoke('rocker-memory', {
          body: {
            action: 'search_entities',
            query: args.query,
            type: args.type,
            limit: 20
          }
        });
        if (error) throw error;
        return { success: true, entities: data.entities || [] };
      }

      case 'get_user_profile': {
        const { data, error } = await supabase.functions.invoke('rocker-memory', {
          body: {
            action: 'get_profile'
          }
        });
        if (error) throw error;
        return { success: true, profile: data.profile };
      }

      default:
        return { success: false, error: `Unknown tool: ${toolName}` };
    }
  } catch (error) {
    console.error(`[executor] Tool ${toolName} failed:`, error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Tool execution failed' 
    };
  }
}
