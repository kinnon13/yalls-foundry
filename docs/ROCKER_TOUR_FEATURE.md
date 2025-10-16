# Rocker Platform Tour Feature

## Overview
Rocker can now give users a guided tour of the entire platform, explaining each section's functionality and capabilities.

## How to Use

### From Chat
Simply ask Rocker:
- "Show me around"
- "Give me a tour"
- "What can I do on this platform?"
- "Take me through each page"

### From Quick Actions
Click the **Tour** button in Rocker's quick actions bar

### From Header
Click the **Platform Tour** button in the global header

## Tour Sections

Rocker will guide you through:

1. **Home Dashboard** - Central hub, feed, and navigation
2. **Marketplace** - Browse items, create listings, filter categories
3. **Calendar & Events** - Manage schedule, create events, set reminders
4. **Horse Registry** - Register horses, track lineage, manage incentives
5. **Personal Dashboard** - Personalized AI insights and quick actions
6. **AI Management** - Control memories, data sharing, privacy settings
7. **Admin Control Room** - Platform management (admin only)

## Technical Implementation

### Components
- `src/lib/ai/rocker/tour.ts` - Tour data and navigation logic
- `src/lib/ai/rocker/tools/tour.ts` - Tour tool definitions
- `src/components/rocker/TourButton.tsx` - UI trigger component

### Tools Available to Rocker
- `start_tour` - Initiates the guided tour
- `navigate_to_tour_stop` - Moves to specific sections with explanations

### Backend Integration
Tour tools integrated into:
- `supabase/functions/rocker-chat/tools/definitions.ts` - Tool schema
- `supabase/functions/rocker-chat/tools/executor.ts` - Tour execution logic
- `supabase/functions/rocker-chat/prompts.ts` - Tour instructions

### Navigation Handling
- Rocker navigates automatically between sections
- Toast notifications confirm each navigation
- Users can ask to skip ahead or go back
- Tour is non-linear - users can ask about specific sections

## Example Interaction

```
User: "Show me around"

Rocker: "Welcome to the y'all's platform! Let me show you around.

• Home Dashboard: Your central hub for all platform activities...
• Marketplace: Browse and discover items, services...
• Calendar & Events: Manage your schedule...
• Horse Registry: Comprehensive horse management...
• Personal Dashboard: AI-powered insights...
• AI Management: Control what I know about you...
• Admin Control Room: Platform management tools...

I'll start at the Home Dashboard. Ready?"

[Rocker navigates to /]

User: "Yes, show me the marketplace"

Rocker: "📍 Marketplace

Browse and discover items, services, and opportunities shared by the community.

Key Features:
• Filter by categories and search
• View detailed listings with images
• Flag inappropriate content
• Request new categories

What would you like to explore here?"

[Rocker navigates to /marketplace]
```

## Benefits

- **Onboarding**: New users quickly understand all features
- **Discovery**: Users find capabilities they didn't know existed
- **Context**: Each section explained with specific use cases
- **Interactive**: Users can ask questions at any stop
- **Flexible**: Tour adapts to user interests and questions
