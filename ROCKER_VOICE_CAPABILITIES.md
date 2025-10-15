# Rocker AI Voice & Navigation Capabilities

Complete documentation for Rocker's voice commands, navigation, and privacy controls.

## 🎤 Microphone & Voice Activation

### How It Works

1. **Microphone Permission**
   - Browser security requires explicit user permission for microphone access
   - A visible activation banner appears on page load when mic is not active
   - Users must click "Activate" to grant permission (browser policy requirement)
   - Once granted, permission persists until revoked by user

2. **Wake Word Mode**
   - Say "Hey Rocker" or "Rocker" to activate voice commands
   - AI listens continuously but only responds when addressed
   - Always-listening mode is enabled by default for seamless interaction
   - Uses OpenAI Realtime API with server-side voice activity detection

3. **Audio Processing**
   - 24kHz PCM16 audio format for high quality
   - Local browser processing before transmission
   - Real-time streaming to OpenAI for instant responses
   - Automatic echo cancellation and noise suppression

### Files Involved

- `src/lib/ai/rocker/context.tsx` - Main context provider, mic permission handling
- `src/utils/RealtimeAudio.ts` - WebSocket connection, audio encoding/decoding
- `supabase/functions/rocker-voice-session/index.ts` - Ephemeral token generation

## 🧭 Navigation Capabilities

Rocker can navigate to any page via voice or text commands:

### Supported Navigation Commands

| Command Examples | Destination |
|------------------|-------------|
| "Go to horses", "Open horses page" | `/horses` |
| "Open marketplace", "Show me the shop" | `/marketplace` |
| "Go to events", "Show events" | `/events` |
| "Open my profile", "View profile" | `/profile` |
| "Go to dashboard", "Open dashboard" | `/dashboard` |
| "Show saved posts", "My bookmarks" | `/posts/saved` |
| "Go back", "Previous page" | Back navigation |
| "Go home", "Open homepage" | `/` (home) |
| "Open search", "Search" | `/search` |

### Voice Navigation Flow

1. User says "Hey Rocker, go to horses"
2. OpenAI Realtime API processes speech → calls `navigate` tool
3. `RealtimeAudio.ts` detects tool call, emits command
4. `context.tsx` receives command, calls `handleNavigation`
5. React Router navigates to `/horses`
6. Toast notification confirms: "Opening /horses"

### Chat Navigation

Users can also type navigation requests:
- "Take me to the marketplace"
- "Open my profile page"
- Rocker calls the `navigate` tool via `rocker-chat` edge function

## 🎯 DOM Interaction Capabilities

Rocker can interact with page elements through voice or chat:

### Click Elements

**Voice**: "Hey Rocker, click the submit button"
**Chat**: "Click on the save button"

- Finds elements by:
  - `data-rocker` attributes (preferred)
  - aria-label
  - Placeholder text
  - Button text content
  - Input name/id

### Fill Form Fields

**Voice**: "Hey Rocker, fill the title with 'My New Post'"
**Chat**: "Type 'Hello world' in the message field"

- Automatically focuses field
- Triggers React change events
- Scrolls into view

### Available DOM Actions

| Action | Voice Command | Tool |
|--------|---------------|------|
| Navigate | "Go to horses" | `navigate` |
| Click | "Click submit button" | `click_element` |
| Fill field | "Type 'Hello' in title" | `fill_field` |
| Get page info | "What's on this page?" | `get_page_info` |
| Create post | "Post 'Hello world'" | `create_post` |

## 🔐 Privacy & Consent

### Consent System

Located in `src/lib/ai/rocker/consent.ts`:

```typescript
interface ConsentScope {
  site_opt_in: boolean;        // General AI features
  email_opt_in: boolean;       // Email notifications
  sms_opt_in: boolean;         // SMS alerts
  push_opt_in: boolean;        // Push notifications
  proactive_enabled: boolean;  // Proactive suggestions
  custom_scopes: Record<string, boolean>;
}
```

### Consent UI

- `src/routes/consent.tsx` - Consent management page
- Users can opt in/out at any time
- Granular control over each feature
- Consent status stored in `ai_user_consent` table

### Privacy Rules

1. **Microphone Access**
   - Requires explicit browser permission
   - Can be revoked anytime via browser settings
   - No recording without active session

2. **Voice Data**
   - Transmitted to OpenAI Realtime API via secure WebSocket
   - Not stored or logged by Y'alls platform
   - Ephemeral token expires after session

3. **Memory Storage**
   - Long-lived preferences stored in `ai_user_memory`
   - User can view/delete memories via consent page
   - Only stores what user explicitly shares

4. **AI Opt-Out**
   - Disable wake word mode anytime
   - Disconnect voice session immediately
   - Continue using platform without AI features

## 🛠 Developer Integration

### Adding New Voice Commands

1. **Define Tool in Edge Function** (`rocker-chat/index.ts`):

```typescript
{
  type: "function",
  function: {
    name: "my_action",
    description: "What this action does",
    parameters: {
      type: "object",
      required: ["param1"],
      properties: {
        param1: { type: "string", description: "Parameter description" }
      }
    }
  }
}
```

2. **Add Tool to Voice Session** (`rocker-voice-session/index.ts`):

```typescript
const tools = [
  {
    type: "function" as const,
    name: "my_action",
    description: "What this action does",
    parameters: { /* same as above */ }
  }
];
```

3. **Handle Tool Call** (`context.tsx`):

```typescript
if (tc.name === 'my_action') {
  const args = typeof tc.arguments === 'string' ? JSON.parse(tc.arguments) : tc.arguments;
  // Execute your action
  handleMyAction(args.param1);
}
```

4. **Execute Tool** (`rocker-chat/index.ts`):

```typescript
case 'my_action': {
  // Your implementation
  return { success: true, message: 'Action completed!' };
}
```

### Testing Voice Commands

1. Activate microphone via banner
2. Say "Hey Rocker, [your command]"
3. Check console logs for:
   - `[Rocker Voice] Tool call: my_action`
   - `[Rocker Context] Voice command received`
   - `[Rocker Context] Processing command`

## 📊 Architecture Overview

```
User Voice Input
    ↓
Browser Microphone (24kHz PCM16)
    ↓
RealtimeAudio.ts (WebSocket)
    ↓
OpenAI Realtime API (gpt-4o-realtime)
    ↓
Tool Call: {name: "navigate", arguments: {path: "/horses"}}
    ↓
RealtimeAudio.ts (detects tool call)
    ↓
context.tsx (handleVoiceCommand)
    ↓
React Router (navigate)
    ↓
Page Changes!
```

## 🚀 Key Features

✅ **Voice-First Navigation** - Natural language page switching
✅ **DOM Manipulation** - Click buttons, fill forms via voice
✅ **Wake Word Activation** - "Hey Rocker" to trigger commands
✅ **Privacy-First** - Granular consent controls
✅ **Real-Time Streaming** - Instant audio responses
✅ **Tool Calling** - Structured actions via OpenAI function calling
✅ **Fallback Patterns** - Manual text navigation detection if tools fail
✅ **Cross-Platform** - Works in any modern browser with mic support

## 📝 Configuration

### Environment Variables

```bash
OPENAI_API_KEY=sk-...        # Required for voice/chat
VITE_SUPABASE_URL=...        # Auto-configured
VITE_SUPABASE_ANON_KEY=...   # Auto-configured
```

### Feature Flags

Located in `src/lib/flags/index.ts`:

```typescript
flags.rocker_voice_enabled = true;  // Enable voice mode
flags.rocker_proactive_enabled = false;  // Proactive suggestions
```

## 🐛 Troubleshooting

### Microphone Not Activating

1. Check browser permissions (chrome://settings/content/microphone)
2. Ensure HTTPS (required for getUserMedia)
3. Look for console errors: `[Rocker] Microphone permission denied`
4. Try incognito mode to reset permissions

### Voice Commands Not Working

1. Check OpenAI API key is set
2. Verify wake word: "Hey Rocker" or "Rocker"
3. Check console for tool calls: `[Rocker Voice] Tool call: navigate`
4. Ensure rocker-voice-session function is deployed

### Navigation Not Triggering

1. Verify tool definitions match in both edge functions
2. Check React Router is working
3. Look for navigation logs: `[Rocker Navigation] Attempting to navigate`
4. Test with chat first (simpler debugging)

## 📚 Related Documentation

- OpenAI Realtime API: https://platform.openai.com/docs/guides/realtime
- Web Speech API: https://developer.mozilla.org/en-US/docs/Web/API/Web_Speech_API
- getUserMedia: https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getUserMedia
- Supabase Edge Functions: https://supabase.com/docs/guides/functions
