# `/src` - Frontend Application

This directory contains all frontend code for Y'alls Foundry.

## 📁 Structure

```
src/
├── main.tsx              Application entry point
├── App.tsx               Main router and app shell
├── index.css             Global styles and design tokens
├── kernel.ts             App contract registration
│
├── routes/               Page-level components (one per route)
│   ├── home-shell/
│   ├── discover/
│   ├── messages/
│   ├── profile/
│   ├── entities/
│   ├── events/
│   ├── marketplace/
│   ├── cart/
│   ├── orders/
│   ├── admin/
│   ├── auth/
│   └── ...
│
├── components/           Reusable UI components
│   ├── ui/              shadcn/ui components (auto-generated)
│   ├── rocker/          Rocker AI components
│   ├── layout/          Layout components
│   ├── navigation/      Navigation components
│   └── ...
│
├── lib/                  Shared logic, utilities, SDKs
│   ├── ai/rocker/       Rocker AI SDK
│   ├── auth/            Authentication system
│   ├── overlay/         Overlay management
│   └── ...
│
├── hooks/                Custom React hooks
│   ├── usePageTelemetry.ts
│   ├── useDevHUD.ts
│   └── ...
│
├── contexts/             React contexts and providers
│   └── ProfileContext.tsx
│
├── types/                TypeScript type definitions
│   ├── social.ts
│   ├── feed.ts
│   ├── profile.ts
│   └── domain.ts
│
├── feature-kernel/       Feature islands architecture
│   ├── registry.ts      Feature registry
│   ├── types.ts         Feature types
│   └── rocker-handler.ts
│
├── integrations/         External service integrations
│   └── supabase/        Supabase client (auto-generated)
│
└── preview/              Preview system
    └── PreviewRoutes.tsx
```

## 🎯 Organization Principles

### Routes (`/routes`)
- One route = one directory
- Main component in `index.tsx`
- Route-specific components in subdirectories
- Keep routes focused and under 200 lines

### Components (`/components`)
- **ui/**: shadcn/ui components - DO NOT edit directly, regenerate via CLI
- **[feature]/**: Feature-specific components (rocker/, layout/, navigation/, etc.)
- Prefer small, focused components (<150 lines)
- Extract complex logic into hooks or lib/

### Library (`/lib`)
- Shared business logic
- SDK integrations (ai/rocker/, auth/, etc.)
- Utility functions
- No UI components

### Hooks (`/hooks`)
- Custom React hooks only
- Prefix with `use*`
- Single responsibility per hook

### Types (`/types`)
- Shared TypeScript interfaces and types
- Domain models
- API response shapes

## 🚫 What NOT to Put Here

- ❌ Backend code (use `/supabase/functions`)
- ❌ Test files (use `/tests`)
- ❌ Scripts (use `/scripts`)
- ❌ Documentation (use `/docs`)
- ❌ Build artifacts (auto-generated)

## 🔧 Key Technologies

- **React 18** - UI library
- **TypeScript** - Type safety
- **Vite** - Build tool
- **Tailwind CSS** - Styling
- **React Router** - Routing
- **TanStack Query** - Data fetching
- **Zustand** - State management
- **Radix UI** - UI primitives
- **shadcn/ui** - Component library

## 📏 File Size Guidelines

- **Maximum**: 300 lines per file
- **Recommended**: <200 lines
- **Action**: Split into smaller components/modules if exceeding

## 🧪 Testing

Tests are in `/tests`, not here. Import components from here into test files.

## 🔗 Related Docs

- [PROJECT_RULES.md](../PROJECT_RULES.md) - Project-wide rules
- [architecture/](../docs/architecture/) - Architecture documentation
- [ARCHITECTURE_AUDIT.md](../docs/ARCHITECTURE_AUDIT.md) - What's dynamic vs hardcoded
