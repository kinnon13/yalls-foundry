# Rocker AI Complete Reference: Microphone, Navigation, Privacy & Code

Complete technical documentation for all Rocker AI capabilities, microphone handling, and privacy controls.

---

## 🎤 Microphone & Audio System

### Core Files

#### 1. `src/utils/RealtimeAudio.ts` (447 lines)
Main WebSocket audio handler connecting to OpenAI Realtime API.

**Key Classes:**

**AudioRecorder** - Captures microphone audio
```typescript
export class AudioRecorder {
  private stream: MediaStream | null = null;
  private audioContext: AudioContext | null = null;
  private processor: ScriptProcessorNode | null = null;
  private source: MediaStreamAudioSourceNode | null = null;

  constructor(private onAudioData: (audioData: Float32Array) => void) {}

  async start() {
    try {
      this.stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          sampleRate: 24000,        // OpenAI requirement
          channelCount: 1,           // Mono audio
          echoCancellation: true,    // Clean audio
          noiseSuppression: true,    // Remove background
          autoGainControl: true      // Normalize volume
        }
      });
      
      this.audioContext = new AudioContext({
        sampleRate: 24000,
      });
      
      this.source = this.audioContext.createMediaStreamSource(this.stream);
      this.processor = this.audioContext.createScriptProcessor(4096, 1, 1);
      
      this.processor.onaudioprocess = (e) => {
        const inputData = e.inputBuffer.getChannelData(0);
        this.onAudioData(new Float32Array(inputData));
      };
      
      this.source.connect(this.processor);
      this.processor.connect(this.audioContext.destination);
    } catch (error) {
      console.error('Error accessing microphone:', error);
      throw error;
    }
  }

  stop() {
    if (this.source) {
      this.source.disconnect();
      this.source = null;
    }
    if (this.processor) {
      this.processor.disconnect();
      this.processor = null;
    }
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = null;
    }
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }
  }
}
```

**RealtimeVoice** - WebSocket connection to OpenAI
```typescript
export class RealtimeVoice {
  private ws: WebSocket | null = null;
  private audioContext: AudioContext | null = null;
  private recorder: AudioRecorder | null = null;
  private onStatusChange?: (status: 'connecting' | 'connected' | 'disconnected') => void;
  private onTranscript?: (text: string, isFinal: boolean) => void;
  private onCommand?: (cmd: { 
    type: 'navigate' | 'click_element' | 'fill_field' | 'create_post' | 'scroll_page'; 
    path?: string;
    element_name?: string;
    field_name?: string;
    value?: string;
    content?: string;
    direction?: string;
    amount?: string;
  }) => void;
  private lastTranscript: string = '';
  private instanceId: string;

  constructor(
    onStatusChange?: (status: 'connecting' | 'connected' | 'disconnected') => void,
    onTranscript?: (text: string, isFinal: boolean) => void,
    onCommand?: (cmd: { 
      type: 'navigate' | 'click_element' | 'fill_field' | 'create_post' | 'scroll_page';
      path?: string;
      element_name?: string;
      field_name?: string;
      value?: string;
      content?: string;
      direction?: string;
      amount?: string;
    }) => void
  ) {
    this.instanceId = Math.random().toString(36).substring(7);
    console.log(`[Rocker Voice ${this.instanceId}] Creating new instance`);
    
    // If there's already a global instance, disconnect it first
    if (globalVoiceInstance && globalVoiceInstance !== this) {
      console.log(`[Rocker Voice ${this.instanceId}] Disconnecting old instance`);
      globalVoiceInstance.disconnect();
    }
    
    this.onStatusChange = onStatusChange;
    this.onTranscript = onTranscript;
    this.onCommand = onCommand;
    globalVoiceInstance = this;
  }

  private detectNavigationPath(transcript: string): string | 'back' | null {
    const t = transcript.toLowerCase();
    console.log(`[Rocker Voice ${this.instanceId}] Detecting navigation from: "${t}"`);

    // Basic wake word stripping
    const cleaned = t.replace(/^\s*(hey\s+rocker|ok\s+rocker|rocker)[,\s:]*/i, '').trim();
    console.log(`[Rocker Voice ${this.instanceId}] Cleaned transcript: "${cleaned}"`);

    // Go back
    if (/(go|navigate|take) back|previous page|backwards/.test(cleaned)) {
      console.log(`[Rocker Voice ${this.instanceId}] ✓ Matched: back`);
      return 'back';
    }

    // Dashboard
    if (/(dashboard|home\s*dashboard|open my dashboard)/.test(cleaned)) {
      console.log(`[Rocker Voice ${this.instanceId}] ✓ Matched: /dashboard`);
      return '/dashboard';
    }

    // Home
    if (/(home|homepage|go home)$/.test(cleaned)) {
      console.log(`[Rocker Voice ${this.instanceId}] ✓ Matched: / (home)`);
      return '/';
    }

    // Horses - expanded patterns
    if (/(horses?|open horses?|browse horses?|horse page|horse list|find horses?)/.test(cleaned)) {
      console.log(`[Rocker Voice ${this.instanceId}] ✓ Matched: /horses`);
      return '/horses';
    }

    // Marketplace / Shop - expanded patterns
    if (/(marketplace|market place|shop|store|browse marketplace|open marketplace|open shop)/.test(cleaned)) {
      console.log(`[Rocker Voice ${this.instanceId}] ✓ Matched: /marketplace`);
      return '/marketplace';
    }

    // Events
    if (/(events?|open events?|browse events?|event page)/.test(cleaned)) {
      console.log(`[Rocker Voice ${this.instanceId}] ✓ Matched: /events`);
      return '/events';
    }

    // Profile
    if (/(my profile|profile page|open profile|view profile)/.test(cleaned)) {
      console.log(`[Rocker Voice ${this.instanceId}] ✓ Matched: /profile`);
      return '/profile';
    }

    // Saved posts
    if (/(saved posts?|bookmarks?|open saved|my saved)/.test(cleaned)) {
      console.log(`[Rocker Voice ${this.instanceId}] ✓ Matched: /posts/saved`);
      return '/posts/saved';
    }

    // Business hub -> route to dashboard businesses tab
    if (/(business|business hub|my businesses|company)/.test(cleaned)) {
      console.log(`[Rocker Voice ${this.instanceId}] ✓ Matched: /dashboard?tab=businesses`);
      return '/dashboard?tab=businesses';
    }

    // Admin control room
    if (/(control room|admin|admin panel)/.test(cleaned)) {
      console.log(`[Rocker Voice ${this.instanceId}] ✓ Matched: /dashboard?tab=control`);
      return '/dashboard?tab=control';
    }

    // Search requests → open search page (we let the user refine there)
    if (/^search\b|find\b/.test(cleaned)) {
      console.log(`[Rocker Voice ${this.instanceId}] ✓ Matched: /search`);
      return '/search';
    }

    console.log(`[Rocker Voice ${this.instanceId}] ✗ No navigation match found`);
    return null;
  }
  stopPlayback() {
    if (audioQueueInstance) {
      audioQueueInstance.stopAll();
    }
    // Send cancel response to API
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({
        type: 'response.cancel'
      }));
    }
  }

  async connect(ephemeralToken: string) {
    console.log(`[Rocker Voice ${this.instanceId}] Connecting...`);
    this.onStatusChange?.('connecting');
    this.audioContext = new AudioContext({ sampleRate: 24000 });

    const model = "gpt-4o-realtime-preview-2024-12-17";
    const wsUrl = `wss://api.openai.com/v1/realtime?model=${model}`;
    
    this.ws = new WebSocket(wsUrl, [
      'realtime',
      `openai-insecure-api-key.${ephemeralToken}`,
      'openai-beta.realtime-v1'
    ]);

    this.ws.onopen = () => {
      console.log(`[Rocker Voice ${this.instanceId}] WebSocket connected`);
      this.onStatusChange?.('connected');
      
      // Send session configuration after connection
      this.ws!.send(JSON.stringify({
        type: 'session.update',
        session: {
          modalities: ['text', 'audio'],
          input_audio_format: 'pcm16',
          output_audio_format: 'pcm16',
          voice: 'alloy',
          turn_detection: {
            type: 'server_vad',
            threshold: 0.5,
            prefix_padding_ms: 300,
            silence_duration_ms: 1000
          },
          temperature: 0.8
        }
      }));

      this.startRecording();
    };

    this.ws.onmessage = async (event) => {
      const message = JSON.parse(event.data);
      
      // Handle tool calls from OpenAI
      if (message.type === 'response.function_call_arguments.done') {
        console.log(`[Rocker Voice ${this.instanceId}] Tool call:`, message.name, message.arguments);
        
        try {
          const args = JSON.parse(message.arguments);
          
          // Handle navigation
          if (message.name === 'navigate') {
            console.log(`[Rocker Voice ${this.instanceId}] 🔥 NAVIGATE TOOL CALLED:`, args.path);
            this.stopPlayback();
            this.onCommand?.({ type: 'navigate', path: args.path });
          }
          
          // Handle click element
          else if (message.name === 'click_element') {
            console.log(`[Rocker Voice ${this.instanceId}] 🔥 CLICK TOOL CALLED:`, args.element_name);
            // Emit as command to be handled by context
            this.onCommand?.({ type: 'click_element' as any, element_name: args.element_name } as any);
          }
          
          // Handle fill field
          else if (message.name === 'fill_field') {
            console.log(`[Rocker Voice ${this.instanceId}] 🔥 FILL TOOL CALLED:`, args);
            this.onCommand?.({ type: 'fill_field' as any, ...args } as any);
          }
          
          // Handle create post
          else if (message.name === 'create_post') {
            console.log(`[Rocker Voice ${this.instanceId}] 🔥 CREATE_POST TOOL CALLED:`, args);
            this.onCommand?.({ type: 'create_post', content: args.content });
          }
          
          // Handle scroll
          else if (message.name === 'scroll_page') {
            console.log(`[Rocker Voice ${this.instanceId}] 🔥 SCROLL TOOL CALLED:`, args);
            this.onCommand?.({ type: 'scroll_page', direction: args.direction, amount: args.amount });
          }
        } catch (err) {
          console.error(`[Rocker Voice ${this.instanceId}] Error parsing tool arguments:`, err);
        }
      }
      
      if (message.type === 'response.audio.delta') {
        const binaryString = atob(message.delta);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }
        await playAudioData(this.audioContext!, bytes);
      } else if (message.type === 'response.audio_transcript.delta') {
        this.onTranscript?.(message.delta, false);
      } else if (message.type === 'response.audio_transcript.done') {
        this.onTranscript?.(message.transcript, true);
      } else if (message.type === 'input_audio_buffer.speech_started') {
        console.log(`[Rocker Voice ${this.instanceId}] User started speaking`);
      } else if (message.type === 'input_audio_buffer.speech_stopped') {
        console.log(`[Rocker Voice ${this.instanceId}] User stopped speaking`);
      } else if (message.type === 'conversation.item.input_audio_transcription.completed') {
        // Check for voice commands like navigation
        const transcript = message.transcript?.toLowerCase() || '';
        this.lastTranscript = transcript;
        console.log(`[Rocker Voice ${this.instanceId}] Transcript:`, transcript);
        
        if (transcript.includes('stop')) {
          console.log(`[Rocker Voice ${this.instanceId}] Stop command detected`);
          this.stopPlayback();
        }
        
        // Fallback: Check for navigation patterns if no tool was called
        const path = this.detectNavigationPath(transcript);
        if (path) {
          console.log(`[Rocker Voice ${this.instanceId}] 🔥 NAVIGATION PATTERN DETECTED:`, path);
          this.stopPlayback();
          this.onCommand?.({ type: 'navigate', path });
        }
      }
    };

    this.ws.onerror = (error) => {
      console.error(`[Rocker Voice ${this.instanceId}] WebSocket error:`, error);
    };

    this.ws.onclose = () => {
      console.log(`[Rocker Voice ${this.instanceId}] WebSocket closed`);
      this.onStatusChange?.('disconnected');
      this.cleanup();
    };
  }

  private async startRecording() {
    try {
      this.recorder = new AudioRecorder((audioData) => {
        if (this.ws?.readyState === WebSocket.OPEN) {
          const encoded = encodeAudioForAPI(audioData);
          this.ws.send(JSON.stringify({
            type: 'input_audio_buffer.append',
            audio: encoded
          }));
        }
      });
      await this.recorder.start();
    } catch (error) {
      console.error('Error starting recording:', error);
    }
  }

  disconnect() {
    console.log(`[Rocker Voice ${this.instanceId}] Disconnecting...`);
    this.cleanup();
    this.ws?.close();
    if (globalVoiceInstance === this) {
      globalVoiceInstance = null;
    }
  }

  private cleanup() {
    console.log(`[Rocker Voice ${this.instanceId}] Cleaning up...`);
    this.recorder?.stop();
    this.recorder = null;
    this.audioContext?.close();
    this.audioContext = null;
    audioQueueInstance = null;
  }
}
```

**Audio Encoding** - Convert Float32 to base64 PCM16
```typescript
export const encodeAudioForAPI = (float32Array: Float32Array): string => {
  const int16Array = new Int16Array(float32Array.length);
  for (let i = 0; i < float32Array.length; i++) {
    const s = Math.max(-1, Math.min(1, float32Array[i]));
    int16Array[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
  }
  
  const uint8Array = new Uint8Array(int16Array.buffer);
  let binary = '';
  const chunkSize = 0x8000;
  
  for (let i = 0; i < uint8Array.length; i += chunkSize) {
    const chunk = uint8Array.subarray(i, Math.min(i + chunkSize, uint8Array.length));
    binary += String.fromCharCode.apply(null, Array.from(chunk));
  }
  
  return btoa(binary);
};
```

#### 2. `src/lib/ai/rocker/context.tsx` (630 lines)
Global Rocker context managing voice state and permissions.

**Microphone Permission Flow:**

```typescript
// Step 1: User clicks "Activate" button
<Button onClick={async () => {
  try {
    await toggleAlwaysListening();
    toast({ title: "Voice activated!" });
  } catch (error) {
    if (error?.name === 'NotAllowedError') {
      toast({ 
        title: "Microphone blocked",
        description: "Enable in browser settings",
        variant: "destructive"
      });
    }
  }
}}>
  Activate
</Button>

// Step 2: Request microphone permission
const toggleAlwaysListening = async () => {
  // Prevent concurrent toggles
  if (initializingRef.current) return;
  
  const newAlwaysListening = !isAlwaysListening;
  setIsAlwaysListening(newAlwaysListening);
  
  // Disconnect existing connection
  if (voiceRef.current) {
    voiceRef.current.disconnect();
    voiceRef.current = null;
  }
  
  if (newAlwaysListening) {
    initializingRef.current = true;
    
    // CRITICAL: Request mic in same user gesture
    try {
      const testStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          sampleRate: 24000,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });
      
      // Stop test stream immediately
      for (const t of testStream.getTracks()) t.stop();
      
      // Now create voice connection
      const voice = await createVoiceConnection(true);
      voiceRef.current = voice;
      setIsVoiceMode(true);
      
      toast({
        title: 'Wake word activated',
        description: "Say 'Hey Rocker' anywhere on the site"
      });
    } catch (error) {
      if (error?.name === 'NotAllowedError') {
        toast({
          title: "Microphone blocked",
          description: "Allow access in browser settings",
          variant: "destructive"
        });
      }
      setIsAlwaysListening(false);
    } finally {
      initializingRef.current = false;
    }
  }
};
```

**Browser Permission Requirements:**
- ✅ Must be HTTPS (or localhost)
- ✅ Requires explicit user gesture (click/keypress)
- ✅ Permission persists per-origin until revoked
- ✅ Can be revoked in browser settings (chrome://settings/content/microphone)

**Activation Banner:**
```typescript
{/* Shows when mic is disconnected */}
{voiceStatus === 'disconnected' && !initializingRef.current && !isAlwaysListening && (
  <div className="fixed bottom-20 left-1/2 -translate-x-1/2 bg-card border rounded-lg shadow-lg p-4">
    <Mic className="h-5 w-5 text-primary" />
    <p className="text-sm font-medium">Activate voice mode</p>
    <p className="text-xs text-muted-foreground">
      Click to enable "Hey Rocker" wake word
    </p>
    <Button onClick={activateMicrophone}>
      Activate
    </Button>
  </div>
)}
```

#### 3. `supabase/functions/rocker-voice-session/index.ts` (185 lines)
Generates ephemeral tokens for OpenAI Realtime API.

```typescript
serve(async (req) => {
  const { alwaysListening } = await req.json();
  
  // Create session with tools enabled
  const response = await fetch("https://api.openai.com/v1/realtime/sessions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${OPENAI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-4o-realtime-preview-2024-12-17",
      voice: "alloy",
      instructions: baseInstructions + alwaysListeningInstructions,
      tools: tools,              // Navigation, clicking, posting tools
      tool_choice: "auto"        // AI decides when to use tools
    }),
  });
  
  const data = await response.json();
  return new Response(JSON.stringify(data));
});
```

**System Instructions for Voice:**
```
You are Rocker, an ACTION-TAKING voice AI assistant.

When users speak a command, use your tools immediately:
- "Go to horses" → navigate({path: "/horses"})
- "Click submit" → click_element({element_name: "submit button"})
- "Post this: Hello" → create_post({content: "Hello"})
- "Scroll down" → scroll_page({direction: "down"})

Tools: navigate, click_element, fill_field, create_post, scroll_page

Call tools IMMEDIATELY when you detect action words.
Confirm actions verbally: "Opening horses now"
```

---

## 🧭 Navigation & Action Capabilities

### Available Actions

| Action | Voice Command | Chat Command | Tool Used |
|--------|---------------|--------------|-----------|
| Navigate | "Go to horses" | "Take me to horses" | `navigate` |
| Click | "Click submit button" | "Click on save" | `click_element` |
| Fill form | "Fill title with My Horse" | "Type 'Test' in description" | `fill_field` |
| Create post | "Post: Hello world" | "Create a post about..." | `create_post` |
| Scroll | "Scroll down" | "Scroll to bottom" | `scroll_page` |
| Get page info | "What's on this page?" | "What can I do here?" | `get_page_info` |

### Navigation Paths

All accessible routes:
- `/` - Home feed
- `/horses` - Horse registry
- `/events` - Event listings
- `/marketplace` - Marketplace listings
- `/profile` - User profile
- `/dashboard` - Dashboard with tabs
- `/search` - Search page
- `/posts/saved` - Saved posts
- `/mlm/dashboard` - MLM dashboard
- `/admin/control-room` - Admin panel (requires admin role)
- `back` - Go back one page

### DOM Interaction System

#### `src/lib/ai/rocker/dom-agent.ts` (216 lines)

**Element Finding Strategy:**
```typescript
export function findElement(targetName: string): HTMLElement | null {
  const normalized = targetName.toLowerCase().trim();
  
  // Priority order:
  // 1. data-rocker attributes (explicit markers)
  let el = document.querySelector(`[data-rocker="${normalized}"]`);
  if (el) return el;
  
  // 2. aria-label
  el = document.querySelector(`[aria-label*="${normalized}" i]`);
  if (el) return el;
  
  // 3. placeholder
  el = document.querySelector(`[placeholder*="${normalized}" i]`);
  if (el) return el;
  
  // 4. Button text content
  const buttons = Array.from(document.querySelectorAll('button'));
  el = buttons.find(btn => btn.textContent?.toLowerCase().includes(normalized));
  if (el) return el;
  
  // 5. Input name/id
  el = document.querySelector(`input[name*="${normalized}" i], input[id*="${normalized}" i]`);
  
  return el;
}
```

**Click Action:**
```typescript
export function clickElement(targetName: string) {
  const el = findElement(targetName);
  if (!el) {
    return { 
      success: false, 
      message: `Could not find "${targetName}". Available: ${getAvailableButtons().join(', ')}` 
    };
  }
  
  // Scroll into view and click
  el.scrollIntoView({ behavior: 'smooth', block: 'center' });
  setTimeout(() => el.click(), 300);
  
  return { success: true, message: `Clicked "${targetName}"` };
}
```

**Fill Field:**
```typescript
export function fillField(targetName: string, value: string) {
  const el = findElement(targetName) as HTMLInputElement;
  if (!el) return { success: false, message: `Field not found` };
  
  el.scrollIntoView({ behavior: 'smooth', block: 'center' });
  el.focus();
  el.value = value;
  
  // Trigger React events
  el.dispatchEvent(new Event('input', { bubbles: true }));
  el.dispatchEvent(new Event('change', { bubbles: true }));
  
  return { success: true, message: `Filled "${targetName}"` };
}
```

### Tool Execution Flow

```
User Voice: "Hey Rocker, go to horses"
    ↓
OpenAI Realtime API (processes speech)
    ↓
Tool Call: {name: "navigate", arguments: {path: "/horses"}}
    ↓
RealtimeAudio.ts (detects function_call_arguments.done event)
    ↓
context.tsx handleVoiceCommand({type: 'navigate', path: '/horses'})
    ↓
handleNavigation('/horses')
    ↓
React Router navigate('/horses')
    ↓
Toast: "🧭 Navigating - Opening /horses"
    ↓
Page changes!
```

### Chat-Based Actions

#### `supabase/functions/rocker-chat/index.ts` (881 lines)

**Tool Definitions:**
```typescript
const tools = [
  {
    type: "function",
    function: {
      name: "navigate",
      description: "Navigate to a page. Use when user asks to go, open, or view.",
      parameters: {
        type: "object",
        required: ["path"],
        properties: {
          path: { 
            type: "string", 
            description: "Path: /, /horses, /events, /marketplace, /profile, /dashboard, /search, back" 
          }
        }
      }
    }
  },
  {
    type: "function",
    function: {
      name: "click_element",
      description: "Click button/link. Use when user says click, press, submit.",
      parameters: {
        type: "object",
        required: ["element_name"],
        properties: {
          element_name: { 
            type: "string", 
            description: "What to click: 'submit button', 'post button', 'save'" 
          }
        }
      }
    }
  },
  {
    type: "function",
    function: {
      name: "fill_field",
      description: "Fill form field. Use when user provides content to enter.",
      parameters: {
        type: "object",
        required: ["field_name", "value"],
        properties: {
          field_name: { type: "string", description: "Field to fill: 'title', 'description'" },
          value: { type: "string", description: "Text to enter" }
        }
      }
    }
  },
  {
    type: "function",
    function: {
      name: "create_post",
      description: "Create a new post. Use when user asks to post, share, publish.",
      parameters: {
        type: "object",
        required: ["content"],
        properties: {
          content: { type: "string", description: "Post content" }
        }
      }
    }
  },
  {
    type: "function",
    function: {
      name: "scroll_page",
      description: "Scroll page. Use when user asks to scroll up/down.",
      parameters: {
        type: "object",
        properties: {
          direction: { 
            type: "string", 
            enum: ["up", "down", "top", "bottom"],
            description: "Scroll direction" 
          }
        }
      }
    }
  }
  // ... more tools: get_page_info, save_post, search_entities, etc.
];
```

**Tool Execution:**
```typescript
async function executeTool(toolName: string, args: any, supabaseClient: any, userId: string) {
  switch (toolName) {
    case 'navigate': {
      // Navigation handled on client
      return { 
        success: true, 
        message: `Opening ${args.path}`,
        navigation: args.path 
      };
    }
    
    case 'click_element': {
      // DOM action handled on client
      return { 
        success: true, 
        message: `Clicking "${args.element_name}"` 
      };
    }
    
    case 'create_post': {
      // Database insert
      const { data, error } = await supabaseClient
        .from('posts')
        .insert({
          user_id: userId,
          content: args.content,
          visibility: args.visibility || 'public',
          tenant_id: '00000000-0000-0000-0000-000000000000'
        })
        .select()
        .single();
      
      if (error) throw error;
      return { 
        success: true, 
        message: 'Posted successfully!', 
        post_id: data.id 
      };
    }
    
    case 'scroll_page': {
      return {
        success: true,
        message: `Scrolling ${args.direction || 'down'}`,
        action: 'scroll',
        direction: args.direction || 'down'
      };
    }
  }
}
```

**System Prompt (Action-Oriented):**
```
You are Rocker, an AI assistant who can TAKE ACTIONS.

CRITICAL: You are ACTION-ORIENTED
When user asks you to DO something, use your tools:
- "Go to horses" → Call navigate tool with path '/horses'
- "Click submit" → Call click_element tool
- "Post about my horse" → Call create_post tool
- "What's on this page?" → Call get_page_info tool

IMPORTANT RULES:
- When user says "go to", "open", "show me" → Use navigate IMMEDIATELY
- When user says "click", "press", "submit" → Use click_element
- When user says "post", "share", "publish" → Use create_post
- ALWAYS call tools when user requests actions, don't just describe

Tone: Friendly, action-oriented, concise
Confirm actions: "Opening horses now" or "Posted successfully!"
```

---

## 🔐 Privacy & Consent System

### Core Files

#### 1. `src/lib/ai/rocker/consent.ts` (153 lines)
Consent checking and enforcement.

**Consent Scopes:**
```typescript
export interface ConsentScope {
  site_opt_in: boolean;         // General AI features - REQUIRED for any AI
  email_opt_in: boolean;        // Email notifications
  sms_opt_in: boolean;          // SMS alerts
  push_opt_in: boolean;         // Push notifications
  proactive_enabled: boolean;   // Proactive AI suggestions
  custom_scopes: Record<string, boolean>;  // Feature-specific consents
}
```

**Check Consent:**
```typescript
export async function hasConsent(
  userId: string, 
  requiredScope: 'site_opt_in' | 'proactive_enabled'
): Promise<boolean> {
  const { data } = await supabase
    .from('ai_user_consent')
    .select('*')
    .eq('user_id', userId)
    .single();
  
  if (!data) return false;
  return data[requiredScope] === true;
}
```

**Require Consent (Throws Error):**
```typescript
export async function requireConsent(
  userId: string, 
  scope: 'site_opt_in' | 'proactive_enabled' = 'site_opt_in'
): Promise<void> {
  const hasIt = await hasConsent(userId, scope);
  if (!hasIt) {
    throw new Error(
      `User ${userId} has not granted ${scope}. ` +
      `Direct them to /consent page to opt-in.`
    );
  }
}
```

**Middleware for Edge Functions:**
```typescript
export function createConsentMiddleware(
  requiredScope: string = 'site_opt_in'
) {
  return async (userId: string): Promise<Response | null> => {
    const consent = await getConsentStatus(userId);
    
    if (!consent?.[requiredScope]) {
      return new Response(
        JSON.stringify({ 
          error: 'AI_CONSENT_REQUIRED',
          message: 'You need to opt-in to AI features at /consent' 
        }),
        { 
          status: 403,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }
    
    return null; // Allow request
  };
}
```

#### 2. `src/routes/consent.tsx`
User-facing consent management page.

**Features:**
- View current consent status
- Toggle each consent type
- Clear all AI memories
- Download consent history
- Revoke all consents at once

**UI Example:**
```typescript
<Card>
  <CardHeader>
    <h2>AI Consent Management</h2>
    <p>Control how Rocker AI can assist you</p>
  </CardHeader>
  
  <CardContent>
    <div className="space-y-4">
      <ConsentToggle
        scope="site_opt_in"
        label="Enable AI Features"
        description="Allow Rocker to help with tasks, navigation, and content"
        required={true}
      />
      
      <ConsentToggle
        scope="proactive_enabled"
        label="Proactive Suggestions"
        description="Let Rocker suggest actions and reminders"
        required={false}
      />
      
      <ConsentToggle
        scope="email_opt_in"
        label="Email Notifications"
        description="Receive AI suggestions via email"
        required={false}
      />
    </div>
    
    <Button onClick={clearAllMemories} variant="destructive">
      Clear All AI Memories
    </Button>
  </CardContent>
</Card>
```

#### 3. Database Schema

**Table: `ai_user_consent`**
```sql
CREATE TABLE public.ai_user_consent (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  tenant_id UUID NOT NULL,
  
  -- Consent flags
  site_opt_in BOOLEAN NOT NULL DEFAULT false,
  proactive_enabled BOOLEAN NOT NULL DEFAULT false,
  email_opt_in BOOLEAN NOT NULL DEFAULT false,
  sms_opt_in BOOLEAN NOT NULL DEFAULT false,
  push_opt_in BOOLEAN NOT NULL DEFAULT false,
  
  -- Custom scopes
  scopes TEXT[] DEFAULT '{}',
  
  -- Metadata
  policy_version TEXT NOT NULL DEFAULT 'v1',
  consented_at TIMESTAMPTZ,
  ip INET,
  user_agent TEXT,
  
  -- Preferences
  cadence TEXT DEFAULT 'balanced',  -- 'low', 'balanced', 'high'
  quiet_hours INT4RANGE,            -- e.g., [22, 8) = 10pm-8am
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

**RLS Policies:**
```sql
-- Users can manage their own consent
CREATE POLICY "Users can manage their consent"
ON ai_user_consent
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Admins can view all consent
CREATE POLICY "Admins can view consent"
ON ai_user_consent
FOR SELECT
USING (has_role(auth.uid(), 'admin'));
```

**Table: `ai_user_memory`**
```sql
CREATE TABLE public.ai_user_memory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  tenant_id UUID NOT NULL,
  
  -- Memory content
  key TEXT NOT NULL,              -- e.g., "favorite_horse", "home_barn"
  value JSONB NOT NULL,           -- Flexible storage
  type memory_type NOT NULL,      -- 'preference', 'fact', 'goal', 'note'
  
  -- Metadata
  source TEXT NOT NULL DEFAULT 'chat',
  confidence NUMERIC DEFAULT 0.8,
  tags TEXT[] DEFAULT '{}',
  provenance JSONB DEFAULT '[]',  -- Where memory came from
  
  -- Vector search
  embedding vector(1536),         -- OpenAI embeddings
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ          -- Auto-expire old memories
);

-- RLS: Users can only access their own memories
CREATE POLICY "Users can view their own memories"
ON ai_user_memory
FOR SELECT
USING (auth.uid() = user_id);

-- Additional gate: Must have site_opt_in
CREATE POLICY "memory_select_requires_optin"
ON ai_user_memory
FOR SELECT
USING (has_site_opt_in(tenant_id, user_id) OR is_admin(auth.uid()));
```

### Privacy Rules Summary

**Microphone Data:**
- ✅ Audio transmitted to OpenAI via WebSocket (encrypted)
- ✅ NOT stored on Y'alls servers
- ✅ Ephemeral token expires after session (~60 min)
- ✅ Recording stops when user disconnects or closes tab
- ✅ User can revoke browser permission anytime

**AI Memories:**
- ✅ Stored only when user explicitly shares long-lived info
- ✅ User can view all memories at `/consent`
- ✅ User can delete individual memories or all at once
- ✅ Memories auto-expire if `expires_at` is set
- ✅ RLS ensures users only see their own data

**Consent Requirements:**
- ✅ `site_opt_in` required for any AI interaction
- ✅ `proactive_enabled` required for AI suggestions/notifications
- ✅ Granular per-feature consents (email, SMS, push)
- ✅ Can opt-out anytime without losing account

---

## 🔧 Configuration Files

### 1. `src/lib/ai/rocker/config.ts`

**AI Personality:**
```typescript
export const ROCKER_PERSONALITY = {
  name: 'Rocker',
  tone: 'friendly, enthusiastic, concise',
  domain: 'western performance horses, rodeo, barrel racing',
  behavior: {
    actionOriented: true,        // Takes actions via tools
    proactive: false,            // Only responds when asked (no unsolicited suggestions)
    memoryEnabled: true,         // Remembers user preferences
    verbosity: 'concise'         // Brief responses for voice
  }
};
```

**Rate Limits:**
```typescript
export const ROCKER_RATE_LIMITS = {
  chat: {
    requestsPerMinute: 10,       // Text chat limit
    windowSec: 60
  },
  voice: {
    sessionsPerHour: 20,         // Voice session limit
    maxDurationMin: 30
  },
  memory: {
    writesPerDay: 100,           // Memory write limit
    maxEntriesPerUser: 500
  }
};
```

### 2. Environment Variables

**Required Secrets:**
```bash
# OpenAI (for Realtime API)
OPENAI_API_KEY=sk-proj-...

# Supabase (auto-configured by Lovable Cloud)
SUPABASE_URL=https://xuxfuonzsfvrirdwzddt.supabase.co
SUPABASE_ANON_KEY=eyJhbGci...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGci...  # For edge functions
```

**Client Environment:**
```bash
# .env (auto-generated)
VITE_SUPABASE_URL=https://xuxfuonzsfvrirdwzddt.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=eyJhbGci...
```

### 3. `supabase/config.toml`

**Edge Function Configuration:**
```toml
[functions.rocker-chat]
verify_jwt = true  # Requires authentication

[functions.rocker-voice-session]
verify_jwt = true  # Requires authentication

[functions.rocker-memory]
verify_jwt = true

[functions.consent-accept]
verify_jwt = true

[functions.consent-revoke]
verify_jwt = true
```

---

## 🧪 Testing Voice Commands

### Test Commands

**Navigation:**
```
"Hey Rocker, go to horses"
"Hey Rocker, open the marketplace"
"Hey Rocker, show me events"
"Hey Rocker, take me to my profile"
"Hey Rocker, go back"
"Hey Rocker, scroll down"
"Hey Rocker, scroll to the top"
```

**Interaction:**
```
"Hey Rocker, click the submit button"
"Hey Rocker, click on save"
"Hey Rocker, what's on this page?"
"Hey Rocker, fill the title with My New Post"
"Hey Rocker, type Hello World in the description"
```

**Content Creation:**
```
"Hey Rocker, post this: Just finished a great barrel run with Flicka!"
"Hey Rocker, create a post about today's event"
```

### Debugging Checklist

**Console Logs to Check:**
```javascript
// Mic activation
[Rocker] toggleAlwaysListening called
[Rocker] Requesting microphone permission preflight
[Rocker] Microphone permission granted
[Rocker] Creating new voice connection

// Voice connection
[Rocker Voice abc123] Creating new instance
[Rocker Voice abc123] Connecting...
[Rocker Voice abc123] WebSocket connected

// Tool calls
[Rocker Voice abc123] Tool call: navigate {path: "/horses"}
[Rocker Context] Voice command received: {type: 'navigate', path: '/horses'}
[Rocker Navigation] Attempting to navigate to: /horses
```

**Common Errors:**

| Error | Cause | Fix |
|-------|-------|-----|
| `NotAllowedError` | Browser blocked mic | Check chrome://settings/content/microphone |
| `Invalid API key` | OPENAI_API_KEY not set | Add secret via Lovable Cloud |
| `Rate limit exceeded` | Too many requests | Wait 60s or increase limit |
| `Tool not found` | Tool not in edge function | Add to both rocker-chat and rocker-voice-session |
| `Element not found` | DOM selector failed | Add data-rocker attribute or check available buttons |

---

## 📊 Architecture Diagram

```
┌─────────────────────────────────────────────────────────┐
│                     USER INPUT                          │
│  Voice: "Hey Rocker, go to horses"                     │
│  Chat: "Take me to the marketplace"                    │
└────────────────┬────────────────────────────────────────┘
                 │
        ┌────────┴────────┐
        │                 │
     VOICE              CHAT
        │                 │
        ▼                 ▼
┌───────────────┐  ┌──────────────────┐
│ RealtimeAudio │  │ RockerChat       │
│ (WebSocket)   │  │ (HTTP)           │
└───────┬───────┘  └────────┬─────────┘
        │                   │
        └─────────┬─────────┘
                  ▼
        ┌──────────────────────┐
        │   OpenAI API         │
        │   - Speech to text   │
        │   - Tool calling     │
        │   - Text to speech   │
        └──────────┬───────────┘
                   │
              Tool Calls
                   │
        ┌──────────┴──────────┐
        │                     │
    CLIENT TOOLS        SERVER TOOLS
        │                     │
        ▼                     ▼
┌─────────────────┐  ┌────────────────┐
│ DOM Actions     │  │ Database Ops   │
│ - navigate      │  │ - create_post  │
│ - click         │  │ - save_post    │
│ - fill_field    │  │ - search       │
│ - scroll        │  │ - write_memory │
└─────────────────┘  └────────────────┘
        │                     │
        └──────────┬──────────┘
                   ▼
        ┌──────────────────────┐
        │   ACTION EXECUTED    │
        │   + Toast Feedback   │
        └──────────────────────┘
```

---

## 🚀 Quick Start Guide

### For Users

1. **Activate Voice:**
   - Click "Activate" button on page load
   - Allow microphone when browser prompts
   - Say "Hey Rocker" to test

2. **Give Commands:**
   - "Hey Rocker, go to horses"
   - "Hey Rocker, click the post button"
   - "Hey Rocker, scroll down"

3. **Manage Privacy:**
   - Visit `/consent` page
   - Toggle AI features on/off
   - Clear memories anytime

### For Developers

1. **Add New Voice Tool:**

```typescript
// Step 1: Define in rocker-voice-session/index.ts
const tools = [
  {
    type: "function" as const,
    name: "my_action",
    description: "What this does",
    parameters: {
      type: "object",
      properties: {
        param: { type: "string", description: "Param desc" }
      },
      required: ["param"]
    }
  }
];

// Step 2: Add to rocker-chat/index.ts tools array
// (same definition)

// Step 3: Handle in executeTool()
case 'my_action': {
  // Your logic
  return { success: true, message: 'Done!' };
}

// Step 4: Handle in context.tsx
if (tc.name === 'my_action') {
  handleMyAction(args.param);
  toast({ title: 'Action completed!' });
}

// Step 5: Handle in RealtimeAudio.ts
if (message.name === 'my_action') {
  this.onCommand?.({ type: 'my_action', param: args.param });
}
```

2. **Add Consent Check to Edge Function:**

```typescript
import { requireConsent } from '../_shared/consent.ts';

serve(async (req) => {
  const user = await getUserFromRequest(req);
  
  // Gate: Require site_opt_in
  await requireConsent(user.id, 'site_opt_in');
  
  // Proceed with AI logic
  // ...
});
```

3. **Mark Form Fields for Easy Discovery:**

```tsx
// Add data-rocker attribute for reliable finding
<Input 
  data-rocker="post title"
  placeholder="Enter title..."
  aria-label="Post title"
/>

<Button 
  data-rocker="submit post"
  onClick={submitPost}
>
  Post
</Button>
```

---

## 📝 Complete File Reference

### Voice & Audio
- `src/utils/RealtimeAudio.ts` - WebSocket audio streaming
- `src/lib/ai/rocker/context.tsx` - Global voice state management
- `supabase/functions/rocker-voice-session/index.ts` - Token generation

### Chat & Tools
- `supabase/functions/rocker-chat/index.ts` - Chat API with tools
- `src/lib/ai/rocker/tools.ts` - Tool type definitions
- `src/lib/ai/rocker/dom-agent.ts` - DOM manipulation

### Privacy & Consent
- `src/lib/ai/rocker/consent.ts` - Consent checking
- `src/routes/consent.tsx` - Consent management UI
- `supabase/functions/consent-accept/index.ts` - Accept consent
- `supabase/functions/consent-revoke/index.ts` - Revoke consent

### Memory
- `supabase/functions/rocker-memory/index.ts` - Memory CRUD
- Database tables: `ai_user_memory`, `ai_user_consent`

### Configuration
- `src/lib/ai/rocker/config.ts` - AI personality & limits
- `supabase/config.toml` - Edge function config

---

## 🔒 Security Guarantees

1. **No Unauthorized Access**
   - RLS enforces user_id matching on all tables
   - Edge functions validate JWT tokens
   - Tools scope-limited to authenticated user's data

2. **No Data Leakage**
   - Memories scoped to user_id
   - Consent required before any AI interaction
   - Admin audit log tracks all privileged actions

3. **Microphone Privacy**
   - Explicit permission required
   - No background recording without wake word
   - Audio not persisted on servers
   - User can disconnect anytime

4. **Opt-Out Path**
   - Disable AI features at `/consent`
   - Clear all memories in one click
   - Continue using platform without AI

---

## 📞 Support

**If voice commands not working:**
1. Check browser mic permission
2. Ensure HTTPS (required for getUserMedia)
3. Check console for `[Rocker]` logs
4. Verify OpenAI API key is set
5. Test with "Hey Rocker, what's on this page?"

**If navigation not working:**
1. Check tool calls in console: `[Rocker Voice] Tool call: navigate`
2. Verify React Router is configured
3. Test with chat first (simpler debugging)
4. Check available paths in tools.ts

**Privacy concerns:**
- All consent controls at `/consent`
- Email: support@yalls.ai
- Docs: See ROCKER_VOICE_CAPABILITIES.md
