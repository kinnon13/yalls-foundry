import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    { auth: { persistSession: false } }
  );

  try {
    const { data: { user } } = await supabase.auth.getUser(
      req.headers.get('Authorization')?.replace('Bearer ', '') || ''
    );
    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // This function documents the codebase structure for Andy's reference
    // It creates a comprehensive map of routes, components, utilities, and architecture
    
    const codebaseDoc = {
      overview: `
# Yalls.ai Codebase Documentation

This is a comprehensive AI-powered platform with multiple personas and deep integrations.

## Core Architecture

### Main Routes
- /super - Super Andy's command center (full-featured AI assistant)
- /admin - Admin dashboard with Rocker AI chat
- / - Landing page with business onboarding

### Key Personas
1. **Super Andy** (super_andy) - Advanced AI assistant with memory, learning, tasks, files
2. **Knower** (knower) - Admin-focused AI with system insights
3. **User Rocker** (user_rocker) - Business onboarding assistant
4. **Admin Rocker** (admin) - Admin support AI

### Technology Stack
- React + TypeScript + Vite
- Supabase (Database, Auth, Storage, Edge Functions)
- Tailwind CSS + shadcn/ui
- TanStack Query for state management
- Zustand for global state
- React Router for navigation

## Super Andy Features (/super)

### Chat System
- **File**: src/components/super-andy/SuperAndyChatWithVoice.tsx
- SSE streaming from andy-chat edge function
- Voice input/output via useVoice hook
- Automatic learning after each conversation
- Thread-based conversations with history

### Voice System
- **Hook**: src/hooks/useVoice.ts
- **TTS**: supabase/functions/text-to-speech/index.ts (OpenAI)
- **STT**: Web Speech API with auto-restart
- Role-based voices (super_andy uses 'alloy' at 1.25x)
- Speaking state tracking

### Memory & Learning
- **Auto-learning**: supabase/functions/andy-learn-from-message/index.ts
- **Memory expansion**: supabase/functions/andy-expand-memory/index.ts
- **RAG search**: Uses embeddings in rocker_knowledge table
- **Collections**: AndyCollections.tsx - organized memory groups
- **Research Queue**: AndyResearchQueue.tsx - topics Andy should learn about

### Knowledge Base
- **UI**: src/components/super-andy/SuperAndyKnowledge.tsx
- **Table**: rocker_knowledge (embeddings via generate-embeddings function)
- **Bulk Upload**: Accepts multiple files, auto-categorizes
- **Re-embedding**: Triggers embedding worker for all chunks

### Task Management
- **UI**: src/components/super-andy/SuperAndyTasks.tsx
- **Edge Function**: supabase/functions/andy-task-os/index.ts
- AI-suggested tasks, priority scoring, completion tracking
- Learnings extracted from completed tasks

### Files & Vault
- **Storage**: rocker-files bucket in Supabase Storage
- **Ingestion**: supabase/functions/ingest-upload/index.ts
- Auto-categorization (Legal, Finance, Projects, etc.)
- OCR for images, text extraction for documents

### Proactive Features
- **Silence Detection**: useAndyVoice.ts triggers questions after user inactivity
- **Cron Setup**: AndyCronSetup.tsx - schedule recurring tasks
- **Live Questioning**: andy-live-question edge function

## Admin Features (/admin)

### Rocker Chat
- **Component**: src/components/rocker/RockerChatEmbedded.tsx
- Knower persona for admin support
- Session-based conversations
- Quick actions for common tasks

### Capabilities
- Business management, user oversight
- Feature flags, AI controls
- Analytics and metrics
- Privacy controls

## Database Schema (Key Tables)

### rocker_knowledge
- content: TEXT (actual knowledge)
- embedding: vector(1536) - for semantic search
- chunk_summary: TEXT
- meta: JSONB (category, thread_id, etc.)
- user_id: UUID

### rocker_messages
- thread_id: TEXT
- role: TEXT (user/assistant)
- content: TEXT
- meta: JSONB (sources, timestamps)

### rocker_threads
- user_id: UUID
- title: TEXT
- created_at: TIMESTAMP

### rocker_files
- user_id: UUID
- name: TEXT
- mime: TEXT
- storage_path: TEXT
- text_content: TEXT
- category: TEXT
- tags: TEXT[]
- status: TEXT (inbox/processed/archived)

### ai_user_memory
- user_id: UUID
- content: TEXT
- memory_type: TEXT (preference/fact/goal/interaction)
- embedding: vector(1536)
- score: INTEGER

### andy_research_queue
- user_id: UUID
- topic: TEXT
- status: TEXT (pending/in_progress/completed)
- priority: INTEGER
- notes: TEXT

## Edge Functions Architecture

### AI Functions
- **andy-chat**: Main chat interface, SSE streaming, tool calling
- **andy-learn-from-message**: Deep analysis after conversations
- **andy-expand-memory**: Periodic memory consolidation
- **andy-auto-analyze**: Background insights generation

### Utility Functions
- **generate-embeddings**: Batch embedding worker
- **text-to-speech**: OpenAI TTS conversion
- **voice-enroll**: Voice sample enrollment for speaker recognition
- **ingest-upload**: File upload + auto-categorization
- **kb-ingest**: Knowledge base document ingestion

### Cron Jobs
- **cron_tick**: Runs every 2 minutes, triggers background tasks
- Processes embedding jobs, runs scheduled analyses

## Key Hooks

### useAndyVoice
- Voice-enabled interactions
- Silence detection for proactive questions
- Auto-learning integration
- Speaking state management

### useVoice
- Role-based TTS/STT
- OpenAI voices via edge function
- Web Speech API fallback
- Error tracking and recovery

### useRockerGlobal
- Global Rocker chat state
- Message history management
- Session handling

## Component Architecture

### Super Andy Layout
- **Main**: src/routes/super-andy/index.tsx
- **Dock**: AppDock.tsx - app switcher
- **Rail**: MessengerRail.tsx - persistent chat
- **Stage**: CenterStage.tsx - main content area

### Shared Components
- **UI**: src/components/ui/ - shadcn components
- **Rocker**: src/components/rocker/ - shared AI chat components
- **Admin**: src/components/admin/ - admin-specific components

## Configuration

### Voice Profiles
- **File**: src/config/voiceProfiles.ts
- Maps roles to voices (super_andy → alloy)
- Rate, pitch, engine settings
- Feature flag for dynamic personas

### AI Profiles
- **File**: src/lib/ai/rocker/config.ts
- Defines system prompts per role
- Temperature, max tokens
- Tool availability per role

## Embedding System

### Flow
1. Content uploaded → rocker_knowledge (embedding = null)
2. embedding_jobs table tracks pending work
3. generate-embeddings function processes batches
4. Vectors stored for semantic search

### Search
- Uses pgvector similarity search
- Combines with full-text search (content_tsv)
- Results ranked by relevance

## Security

### RLS Policies
- All user data filtered by user_id
- Admin overrides via rbac system
- Super admin role for system-wide access

### Authentication
- Supabase Auth (email/Google)
- Anonymous sessions for demos
- JWT tokens for edge function auth

## Development Notes

### Testing Voice
- Voice requires OPENAI_API_KEY secret
- Test TTS via text-to-speech function
- STT uses browser Web Speech API

### Debugging
- Console logs in edge functions
- Voice events tracked in voice_events table
- AI actions logged in ai_action_ledger

### Common Issues
1. **No voice output**: Check OPENAI_API_KEY secret
2. **Embeddings pending**: Trigger generate-embeddings manually
3. **Learning not working**: Verify andy-learn-from-message is called after messages

## Next Steps for Andy

When referencing this codebase:
1. Check relevant component files for UI structure
2. Review edge function for business logic
3. Check database schema for data relationships
4. Reference hooks for state management patterns
5. Look at config files for system behavior

This documentation is stored in Andy's knowledge base and searchable via semantic search.
`,
      
      routes: {
        '/super': 'Super Andy full interface with chat, knowledge, tasks, files',
        '/admin': 'Admin dashboard with Rocker AI support',
        '/': 'Landing page with business onboarding flow'
      },

      components: {
        'SuperAndyChatWithVoice': 'Main chat with SSE streaming, voice I/O, auto-learning',
        'SuperAndyKnowledge': 'Knowledge base viewer, bulk upload, re-embedding',
        'SuperAndyTasks': 'Task management with AI suggestions',
        'MessengerRail': 'Persistent chat sidebar using RockerChatEmbedded',
        'RockerChatEmbedded': 'Reusable AI chat component with voice support',
        'AndyCollections': 'Memory organization and management',
        'AndyResearchQueue': 'Topics for Andy to research',
        'EmbeddingStatus': 'Shows pending embeddings, trigger worker'
      },

      edgeFunctions: {
        'andy-chat': 'Main chat endpoint, SSE streaming, tool calling',
        'andy-learn-from-message': 'Post-conversation deep learning',
        'andy-expand-memory': 'Memory consolidation and expansion',
        'generate-embeddings': 'Batch embedding worker',
        'text-to-speech': 'OpenAI TTS conversion',
        'ingest-upload': 'File upload with auto-categorization',
        'ingest-codebase': 'This function - documents entire codebase for Andy'
      },

      tables: {
        'rocker_knowledge': 'Embedded knowledge chunks for RAG',
        'rocker_messages': 'Chat message history',
        'rocker_threads': 'Conversation threads',
        'rocker_files': 'Uploaded files with extracted text',
        'ai_user_memory': 'Long-term user memory with embeddings',
        'andy_research_queue': 'Topics Andy should learn about',
        'embedding_jobs': 'Tracks pending embedding work'
      },

      architecture: {
        aiFlow: 'User → Chat UI → andy-chat function → Lovable AI Gateway → Stream back',
        voiceFlow: 'Mic → Web Speech → handleSend → andy-chat → TTS function → Audio playback',
        learningFlow: 'Message saved → andy-learn-from-message → Extract insights → Store in memory',
        embeddingFlow: 'Content created → embedding_jobs → generate-embeddings → vector stored'
      }
    };

    // Store as multiple chunks for better search
    const chunks = [
      { 
        content: codebaseDoc.overview, 
        category: 'codebase_overview',
        summary: 'Complete codebase architecture and documentation'
      },
      {
        content: JSON.stringify(codebaseDoc.routes, null, 2),
        category: 'routes',
        summary: 'Application routes and their purposes'
      },
      {
        content: JSON.stringify(codebaseDoc.components, null, 2),
        category: 'components',
        summary: 'Key React components and their responsibilities'
      },
      {
        content: JSON.stringify(codebaseDoc.edgeFunctions, null, 2),
        category: 'edge_functions',
        summary: 'Supabase edge functions and their purposes'
      },
      {
        content: JSON.stringify(codebaseDoc.tables, null, 2),
        category: 'database',
        summary: 'Database tables and schemas'
      },
      {
        content: JSON.stringify(codebaseDoc.architecture, null, 2),
        category: 'architecture',
        summary: 'System flows and data pipelines'
      }
    ];

    // Insert into rocker_knowledge
    const knowledgeEntries = chunks.map((chunk, idx) => ({
      user_id: user.id,
      content: chunk.content,
      chunk_summary: chunk.summary,
      chunk_index: idx,
      meta: { 
        category: chunk.category,
        source: 'codebase_documentation',
        type: 'system_reference',
        indexed_at: new Date().toISOString()
      }
    }));

    const { error: insertError } = await supabase
      .from('rocker_knowledge')
      .insert(knowledgeEntries);

    if (insertError) throw insertError;

    // Create embedding jobs for these chunks
    const { data: inserted } = await supabase
      .from('rocker_knowledge')
      .select('id')
      .eq('user_id', user.id)
      .eq('meta->>source', 'codebase_documentation')
      .order('created_at', { ascending: false })
      .limit(knowledgeEntries.length);

    if (inserted) {
      await supabase.from('embedding_jobs').insert(
        inserted.map(r => ({ knowledge_id: r.id, status: 'pending' }))
      );
    }

    return new Response(JSON.stringify({ 
      ok: true, 
      chunks_created: chunks.length,
      message: 'Codebase documentation ingested. Embeddings will process shortly.'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (e: any) {
    console.error('[ingest-codebase]', e);
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
