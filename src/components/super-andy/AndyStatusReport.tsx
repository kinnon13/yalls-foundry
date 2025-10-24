/**
 * Andy Complete Status Report
 * Comprehensive breakdown of all features, capabilities, and their actual status
 */

import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, XCircle, AlertCircle, Code, Database, Zap } from 'lucide-react';

export function AndyStatusReport() {
  const features = [
    {
      category: 'Chat & Voice',
      items: [
        { name: 'Text Chat', status: 'working', location: 'SuperAndyChatWithVoice.tsx', notes: 'Grok-2, SSE streaming, Enter to send' },
        { name: 'Voice Input (STT)', status: 'working', location: 'useVoice.ts', notes: 'Browser Web Speech API, auto-sends on final phrase' },
        { name: 'Voice Output (TTS)', status: 'working', location: 'useVoice.ts + text-to-speech function', notes: 'OpenAI TTS via edge function' },
        { name: 'Mic Button Auto-Send', status: 'fixed', location: 'SuperAndyChatWithVoice.tsx:78', notes: 'listen() callback now calls handleSend(finalText)' },
      ]
    },
    {
      category: 'Internet & Search',
      items: [
        { name: 'Web Search (Serper)', status: 'working', location: 'super-andy-web-search function', notes: 'Real Google results via Serper API (key stored permanently)' },
        { name: 'AI Analysis (Grok)', status: 'working', location: 'super-andy-web-search function', notes: 'XAI Grok-2 analyzes search results (key stored permanently)' },
        { name: 'Automatic Learning', status: 'working', location: 'super-andy-web-search:98-109', notes: 'Stores insights in andy_external_knowledge after each search' },
      ]
    },
    {
      category: 'Memory & Learning',
      items: [
        { name: 'Chat Memory Storage', status: 'fixed', location: 'SuperAndyChatWithVoice.tsx:322-352', notes: 'Now stores messages in rocker_messages after each reply' },
        { name: 'Deep Analysis Trigger', status: 'fixed', location: 'SuperAndyChatWithVoice.tsx:344-352', notes: 'Calls andy-learn-from-message after assistant replies' },
        { name: 'Memory Viewer', status: 'working', location: 'AndyMemoryViewer.tsx', notes: 'Real-time updates, file export, search' },
        { name: 'Rules Editor', status: 'working', location: 'AndyRulesEditor.tsx', notes: 'Hardwired rules injected into system prompt' },
        { name: 'Rule Loading', status: 'working', location: 'andy-chat:187-198', notes: 'Loads active rules and injects into every prompt' },
        { name: 'Memory Expansion', status: 'broken', location: 'useAndyVoice.ts:97-102', notes: 'Triggers every 10 messages but NOT called from main chat' },
        { name: 'Auto Learning', status: 'broken', location: 'useAndyVoice.ts:81-106', notes: 'Hook exists but NOT used in SuperAndyChatWithVoice' },
      ]
    },
    {
      category: 'Learning Loops (Cron)',
      items: [
        { name: 'External Learning Loop', status: 'broken', location: 'super-andy-learn-external function', notes: 'Function exists but NO CRON JOB scheduled (should run every 4hrs)' },
        { name: 'Internal Learning Loop', status: 'broken', location: 'aggregate-learnings function', notes: 'Function exists but NO CRON JOB scheduled (should run every 2hrs)' },
        { name: 'Self Improvement', status: 'manual', location: 'SelfImproveLog.tsx', notes: 'Manual trigger only via "Run Now" button' },
      ]
    },
    {
      category: 'Context Loading',
      items: [
        { name: 'Chat History', status: 'working', location: 'andy-chat:60-75', notes: 'Loads last 20 messages from rocker_messages' },
        { name: 'User Memories', status: 'working', location: 'andy-chat:77-88', notes: 'Loads top 10 from ai_user_memory' },
        { name: 'Long Memory', status: 'working', location: 'andy-chat:90-104', notes: 'Loads facts/preferences from rocker_long_memory' },
        { name: 'Files/Knowledge', status: 'working', location: 'andy-chat:106-149', notes: 'Searches rocker_knowledge + rocker_files' },
        { name: 'Tasks', status: 'working', location: 'andy-chat:151-163', notes: 'Loads open/doing tasks' },
        { name: 'Calendar Events', status: 'working', location: 'andy-chat:165-176', notes: 'Loads upcoming events' },
        { name: 'Custom Rules', status: 'working', location: 'andy-chat:187-198', notes: 'Loads + injects andy_system_rules' },
      ]
    },
    {
      category: 'AI APIs',
      items: [
        { name: 'XAI Grok (Main Chat)', status: 'working', location: 'andy-chat:4,23-25,252-300', notes: 'XAI_API_KEY required, used for all chat' },
        { name: 'XAI Grok (Web Search)', status: 'working', location: 'super-andy-web-search:63-107', notes: 'Analyzes Serper results' },
        { name: 'Serper (Google Search)', status: 'working', location: 'super-andy-web-search:37-59', notes: 'SERPER_API_KEY required' },
        { name: 'Lovable AI', status: 'unused', location: 'super-andy-learn-external:47-67', notes: 'Used in external learning loop only' },
      ]
    },
    {
      category: 'Database Tables',
      items: [
        { name: 'rocker_messages', status: 'active', location: 'Chat history', notes: 'Stores all chat messages with thread_id' },
        { name: 'rocker_threads', status: 'active', location: 'Thread management', notes: 'Conversation threads' },
        { name: 'rocker_long_memory', status: 'active', location: 'Facts/preferences', notes: 'key-value storage for personal info' },
        { name: 'ai_user_memory', status: 'active', location: 'Structured memories', notes: 'Typed memories with scores' },
        { name: 'andy_external_knowledge', status: 'active', location: 'Web learning', notes: 'Data learned from web searches' },
        { name: 'andy_internal_knowledge', status: 'active', location: 'Platform patterns', notes: 'Patterns from user behavior' },
        { name: 'andy_system_rules', status: 'active', location: 'Hardwired rules', notes: 'User-defined behavior rules' },
        { name: 'ai_learning_metrics', status: 'active', location: 'Cycle tracking', notes: 'Logs learning loop executions' },
        { name: 'ai_self_improve_log', status: 'active', location: 'Self improvement', notes: 'Policy weight changes' },
      ]
    },
  ];

  const getStatusIcon = (status: string) => {
    switch(status) {
      case 'working': return <CheckCircle2 className="w-4 h-4 text-green-500" />;
      case 'fixed': return <CheckCircle2 className="w-4 h-4 text-blue-500" />;
      case 'broken': return <XCircle className="w-4 h-4 text-red-500" />;
      case 'manual': return <AlertCircle className="w-4 h-4 text-yellow-500" />;
      case 'unused': return <AlertCircle className="w-4 h-4 text-gray-500" />;
      case 'active': return <Database className="w-4 h-4 text-green-500" />;
      default: return <AlertCircle className="w-4 h-4" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      working: 'default',
      fixed: 'default',
      broken: 'destructive',
      manual: 'secondary',
      unused: 'outline',
      active: 'default',
    };
    return <Badge variant={variants[status] || 'outline'}>{status}</Badge>;
  };

  return (
    <Card className="p-6">
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold mb-2">Complete Andy Status Report</h2>
          <p className="text-sm text-muted-foreground">
            Comprehensive breakdown of every feature, where it lives, and whether it works
          </p>
        </div>

        {features.map((section) => (
          <div key={section.category} className="space-y-3">
            <h3 className="font-semibold text-lg flex items-center gap-2">
              <Code className="w-5 h-5" />
              {section.category}
            </h3>
            <div className="space-y-2">
              {section.items.map((item) => (
                <Card key={item.name} className="p-3">
                  <div className="flex items-start gap-3">
                    {getStatusIcon(item.status)}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-sm">{item.name}</span>
                        {getStatusBadge(item.status)}
                      </div>
                      <p className="text-xs text-muted-foreground mb-1">
                        <code className="bg-muted px-1 py-0.5 rounded">{item.location}</code>
                      </p>
                      <p className="text-xs">{item.notes}</p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        ))}

        <Card className="p-4 bg-destructive/10 border-destructive/20">
          <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
            <XCircle className="w-4 h-4 text-destructive" />
            Critical Missing Pieces
          </h4>
          <ul className="text-xs space-y-1 text-muted-foreground">
            <li>• No cron jobs = learning loops don't run automatically</li>
            <li>• useAndyVoice hook not integrated = memory expansion disabled</li>
            <li>• Proactive suggestions exist but unclear if functional</li>
            <li>• Calendar integration loads events but can't create/edit yet</li>
          </ul>
        </Card>

        <Card className="p-4 bg-green-500/10 border-green-500/20">
          <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-green-500" />
            What Actually Works Right Now
          </h4>
          <ul className="text-xs space-y-1">
            <li>✅ Chat with Grok-2 (streaming, fast, intelligent)</li>
            <li>✅ Voice input auto-sends (no click needed)</li>
            <li>✅ Voice output with OpenAI TTS</li>
            <li>✅ Web search with Serper + Grok analysis</li>
            <li>✅ Real-time memory viewer with export</li>
            <li>✅ Hardwired rules that persist forever</li>
            <li>✅ Full context loading (messages, memories, files, tasks, calendar)</li>
            <li>✅ Learning storage after searches</li>
            <li>✅ Manual self-improvement via "Run Now"</li>
          </ul>
        </Card>
      </div>
    </Card>
  );
}
