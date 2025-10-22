# User-Level AI (Rocker)

## Purpose
Personal AI assistant for standard users with profile-aware suggestions and standard permissions.

## Capabilities
- Profile-aware content suggestions
- Personal memory and conversation history
- Task assistance and reminders
- Content creation help
- Basic automation

## Limitations
- No admin tool access
- Cannot modify other users' data
- Cannot access system-level operations
- Budget-constrained API usage

## Key Files
- `brain.ts` - Main user AI brain orchestrating planning and execution
- Integration with existing `src/lib/ai/rocker/` modules

## Integration
The existing Rocker implementation in `src/lib/ai/rocker/` remains functional. This folder provides a unified interface and future home for refactored user AI logic.

## Usage
```typescript
import { userBrain } from '@/ai/user/brain';

const response = await userBrain.process({
  userId: session.userId,
  message: userInput,
  context: { currentPage, recentActivity }
});
```

## Permissions
- Read: Own profile, own posts, public content
- Write: Own profile, own posts
- Execute: Standard tools (calendar, notes, basic search)
