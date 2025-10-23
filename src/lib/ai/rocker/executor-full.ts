/**
 * Full Rocker Tool Executor - All 60 Tools
 * Database queries, API calls, frontend actions, AI invocations
 */

import { supabase } from '@/integrations/supabase/client';
import { invokeAction, type AppAction } from '@/apps/actions';

export type ToolName = 
  // Database (15 tools)
  | 'db.query_profiles' | 'db.query_events' | 'db.query_listings' | 'db.query_posts'
  | 'db.query_businesses' | 'db.query_tasks' | 'db.query_calendar'
  | 'db.create_task' | 'db.update_task' | 'db.create_event' | 'db.create_listing'
  | 'db.create_post' | 'db.update_profile' | 'db.create_business' | 'db.query_messages'
  // Services (20 tools)
  | 'svc.andy_chat' | 'svc.andy_learn' | 'svc.andy_embed' | 'svc.andy_enhance'
  | 'svc.classify_business' | 'svc.generate_bio' | 'svc.scan_site' | 'svc.ghost_match'
  | 'svc.ai_curate_feed' | 'svc.ai_rank_search' | 'svc.gap_finder' | 'svc.mdr_orchestrate'
  | 'svc.perceive_tick' | 'svc.self_improve' | 'svc.red_team' | 'svc.fine_tune_cohort'
  | 'svc.user_rag_index' | 'svc.analyze_traces' | 'svc.aggregate_learnings' | 'svc.kb_search'
  // Frontend (15 tools)
  | 'fe.navigate' | 'fe.open_app' | 'fe.search' | 'fe.type' | 'fe.click' | 'fe.scroll'
  | 'fe.speak' | 'fe.toast' | 'fe.open_profile' | 'fe.open_event' | 'fe.open_listing'
  | 'fe.open_business' | 'fe.open_post' | 'fe.open_message' | 'fe.open_calendar'
  // AI (10 tools)
  | 'ai.generate_text' | 'ai.generate_embeddings' | 'ai.classify' | 'ai.summarize'
  | 'ai.translate' | 'ai.analyze_sentiment' | 'ai.extract_entities' | 'ai.generate_image'
  | 'ai.analyze_image' | 'ai.transcribe_audio';

export interface ToolCall {
  tool: ToolName;
  params: Record<string, any>;
}

export interface ToolResult {
  success: boolean;
  data?: any;
  error?: string;
}

/**
 * Execute a single tool call
 */
export async function executeTool(call: ToolCall): Promise<ToolResult> {
  const { tool, params } = call;

  try {
    // Database Tools (15)
    if (tool.startsWith('db.')) {
      return await executeDbTool(tool, params);
    }
    
    // Service Tools (20)
    if (tool.startsWith('svc.')) {
      return await executeSvcTool(tool, params);
    }
    
    // Frontend Tools (15)
    if (tool.startsWith('fe.')) {
      return await executeFeTool(tool, params);
    }
    
    // AI Tools (10)
    if (tool.startsWith('ai.')) {
      return await executeAiTool(tool, params);
    }

    return { success: false, error: `Unknown tool: ${tool}` };
  } catch (error) {
    console.error(`Tool execution failed: ${tool}`, error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

/**
 * Database Tools (15)
 */
async function executeDbTool(tool: string, params: any): Promise<ToolResult> {
  switch (tool) {
    case 'db.query_profiles': {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .limit(params.limit || 10);
      return { success: !error, data, error: error?.message };
    }
    
    case 'db.query_events': {
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .limit(params.limit || 10);
      return { success: !error, data, error: error?.message };
    }
    
    case 'db.query_listings': {
      const { data, error } = await supabase
        .from('listings' as any)
        .select('*')
        .limit(params.limit || 10);
      return { success: !error, data, error: error?.message };
    }
    
    case 'db.query_posts': {
      const { data, error } = await supabase
        .from('posts')
        .select('*')
        .limit(params.limit || 10);
      return { success: !error, data, error: error?.message };
    }
    
    case 'db.query_businesses': {
      const { data, error } = await supabase
        .from('businesses')
        .select('*')
        .limit(params.limit || 10);
      return { success: !error, data, error: error?.message };
    }
    
    case 'db.query_tasks': {
      const { data, error } = await supabase
        .from('andy_tasks' as any)
        .select('*')
        .limit(params.limit || 10);
      return { success: !error, data, error: error?.message };
    }
    
    case 'db.query_calendar': {
      const { data, error } = await supabase
        .from('calendar_events' as any)
        .select('*')
        .limit(params.limit || 10);
      return { success: !error, data, error: error?.message };
    }
    
    case 'db.create_task': {
      const { data, error } = await supabase
        .from('andy_tasks' as any)
        .insert(params)
        .select()
        .single();
      return { success: !error, data, error: error?.message };
    }
    
    case 'db.update_task': {
      const { data, error } = await supabase
        .from('andy_tasks' as any)
        .update(params.updates)
        .eq('id', params.id)
        .select()
        .single();
      return { success: !error, data, error: error?.message };
    }
    
    case 'db.create_event': {
      const { data, error } = await supabase
        .from('events')
        .insert(params)
        .select()
        .single();
      return { success: !error, data, error: error?.message };
    }
    
    case 'db.create_listing': {
      const { data, error } = await supabase
        .from('listings' as any)
        .insert(params)
        .select()
        .single();
      return { success: !error, data, error: error?.message };
    }
    
    case 'db.create_post': {
      const { data, error } = await supabase
        .from('posts')
        .insert(params)
        .select()
        .single();
      return { success: !error, data, error: error?.message };
    }
    
    case 'db.update_profile': {
      const { data, error } = await supabase
        .from('profiles')
        .update(params.updates)
        .eq('id', params.id)
        .select()
        .single();
      return { success: !error, data, error: error?.message };
    }
    
    case 'db.create_business': {
      const { data, error } = await supabase
        .from('businesses')
        .insert(params)
        .select()
        .single();
      return { success: !error, data, error: error?.message };
    }
    
    case 'db.query_messages': {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .limit(params.limit || 10);
      return { success: !error, data, error: error?.message };
    }
    
    default:
      return { success: false, error: `Unknown db tool: ${tool}` };
  }
}

/**
 * Service Tools (20) - Edge Function Invocations
 */
async function executeSvcTool(tool: string, params: any): Promise<ToolResult> {
  const toolToFunction: Record<string, string> = {
    'svc.andy_chat': 'andy-chat',
    'svc.andy_learn': 'andy-learn-from-message',
    'svc.andy_embed': 'andy-embed-knowledge',
    'svc.andy_enhance': 'andy-enhance-memories',
    'svc.classify_business': 'ai-classify-business',
    'svc.generate_bio': 'business-generate-bio',
    'svc.scan_site': 'business-scan-site',
    'svc.ghost_match': 'business-ghost-match',
    'svc.ai_curate_feed': 'ai-curate-feed',
    'svc.ai_rank_search': 'ai-rank-search',
    'svc.gap_finder': 'gap_finder',
    'svc.mdr_orchestrate': 'mdr_orchestrate',
    'svc.perceive_tick': 'perceive_tick',
    'svc.self_improve': 'self_improve_tick',
    'svc.red_team': 'red_team_tick',
    'svc.fine_tune_cohort': 'fine_tune_cohort',
    'svc.user_rag_index': 'user_rag_index',
    'svc.analyze_traces': 'analyze-traces',
    'svc.aggregate_learnings': 'aggregate-learnings',
    'svc.kb_search': 'kb-search',
  };

  const functionName = toolToFunction[tool];
  if (!functionName) {
    return { success: false, error: `Unknown service tool: ${tool}` };
  }

  const { data, error } = await supabase.functions.invoke(functionName, {
    body: params
  });

  return { success: !error, data, error: error?.message };
}

/**
 * Frontend Tools (15) - UI Actions
 */
async function executeFeTool(tool: string, params: any): Promise<ToolResult> {
  switch (tool) {
    case 'fe.navigate': {
      const action: AppAction = { kind: 'navigate', path: params.path };
      await invokeAction(action);
      return { success: true, data: { navigated: params.path } };
    }
    
    case 'fe.open_app': {
      const action: AppAction = { kind: 'open-app', app: params.app, params: params.params };
      await invokeAction(action);
      return { success: true, data: { opened: params.app } };
    }
    
    case 'fe.search': {
      const action: AppAction = { kind: 'search-yallbrary', query: params.query };
      await invokeAction(action);
      return { success: true, data: { searched: params.query } };
    }
    
    case 'fe.type': {
      const action: AppAction = { kind: 'type', target: params.target, text: params.text };
      await invokeAction(action);
      return { success: true };
    }
    
    case 'fe.click': {
      const action: AppAction = { kind: 'click', target: params.target };
      await invokeAction(action);
      return { success: true };
    }
    
    case 'fe.scroll': {
      const action: AppAction = { kind: 'scroll', target: params.target, behavior: params.behavior };
      await invokeAction(action);
      return { success: true };
    }
    
    case 'fe.speak': {
      const action: AppAction = { kind: 'speak', text: params.text };
      await invokeAction(action);
      return { success: true };
    }
    
    case 'fe.toast': {
      // Import toast dynamically to avoid circular deps
      const { toast } = await import('@/hooks/use-toast');
      toast({
        title: params.title,
        description: params.description,
        variant: params.variant || 'default'
      });
      return { success: true };
    }
    
    case 'fe.open_profile':
    case 'fe.open_event':
    case 'fe.open_listing':
    case 'fe.open_business':
    case 'fe.open_post':
    case 'fe.open_message':
    case 'fe.open_calendar': {
      const entityMap: Record<string, string> = {
        'fe.open_profile': '/profile',
        'fe.open_event': '/events',
        'fe.open_listing': '/listings',
        'fe.open_business': '/businesses',
        'fe.open_post': '/posts',
        'fe.open_message': '/messages',
        'fe.open_calendar': '/calendar'
      };
      const action: AppAction = { 
        kind: 'navigate', 
        path: `${entityMap[tool]}/${params.id}` 
      };
      await invokeAction(action);
      return { success: true };
    }
    
    default:
      return { success: false, error: `Unknown frontend tool: ${tool}` };
  }
}

/**
 * AI Tools (10) - AI Operations via Edge Functions
 */
async function executeAiTool(tool: string, params: any): Promise<ToolResult> {
  switch (tool) {
    case 'ai.generate_text': {
      const { data, error } = await supabase.functions.invoke('andy-chat', {
        body: { message: params.prompt }
      });
      return { success: !error, data: data?.reply, error: error?.message };
    }
    
    case 'ai.generate_embeddings': {
      const { data, error } = await supabase.functions.invoke('generate-embeddings', {
        body: { text: params.text }
      });
      return { success: !error, data, error: error?.message };
    }
    
    case 'ai.classify':
    case 'ai.summarize':
    case 'ai.translate':
    case 'ai.analyze_sentiment':
    case 'ai.extract_entities': {
      // Use andy-chat for text operations
      const { data, error } = await supabase.functions.invoke('andy-chat', {
        body: { 
          message: `${tool.split('.')[1]}: ${params.text}`,
          mode: tool.split('.')[1]
        }
      });
      return { success: !error, data: data?.reply, error: error?.message };
    }
    
    case 'ai.generate_image':
    case 'ai.analyze_image':
    case 'ai.transcribe_audio': {
      // Placeholder for future media AI tools
      return { 
        success: false, 
        error: `${tool} not implemented yet - coming soon` 
      };
    }
    
    default:
      return { success: false, error: `Unknown AI tool: ${tool}` };
  }
}

/**
 * Execute multiple tools in sequence
 */
export async function executeTools(calls: ToolCall[]): Promise<ToolResult[]> {
  const results: ToolResult[] = [];
  
  for (const call of calls) {
    const result = await executeTool(call);
    results.push(result);
    
    // Stop on first failure unless continue_on_error is set
    if (!result.success && !call.params.continue_on_error) {
      break;
    }
  }
  
  return results;
}
