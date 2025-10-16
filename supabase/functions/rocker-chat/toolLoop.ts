import { executeTool } from "./tools/executor.ts";
import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.75.0";

export async function executeToolLoop(
  messages: any[],
  toolCalls: any[],
  supabaseClient: SupabaseClient,
  userId: string,
  actorRole: 'user' | 'admin' = 'user'
): Promise<any[]> {
  const results: any[] = [];

  for (const toolCall of toolCalls) {
    const toolName = toolCall.function.name;
    const toolArgs = JSON.parse(toolCall.function.arguments);

    const result = await executeTool(toolName, toolArgs, supabaseClient, userId, actorRole);

    results.push({
      role: 'tool',
      tool_call_id: toolCall.id,
      content: JSON.stringify(result)
    });
  }

  return results;
}
