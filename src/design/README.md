# Yalls Design System

Mac-clean aesthetic with TikTok/IG interaction feel and Amazon-grade commerce capabilities.

## Design Tokens

All design tokens are defined in `tokens.ts` and exposed as CSS variables via `UIProvider`.

### Usage

```tsx
import { tokens } from '@/design/tokens';

// In components, prefer Tailwind classes that reference tokens
<div className="bg-background text-foreground p-m rounded-l">
  
// For dynamic values, use tokens directly
style={{ transitionDuration: `${tokens.motion.duration.normal}ms` }}
```

### Token Categories

- **Colors**: Background, surface layers, text hierarchy, brand, semantic
- **Spacing**: 4pt grid from xxs (4px) to xxxl (64px)
- **Typography**: Size scale, weights, line heights
- **Radius**: s (4px) to pill (999px)
- **Motion**: Durations (fast/normal/slow) + easing curves
- **Z-index**: Layering scale for overlays

## Core Components

### Data Display
- `Price` - Formatted currency with size variants
- `StatTile` - KPI tiles with optional trends
- `ProfileChip` - Avatar + name combo
- `ReelCard` - TikTok/IG-style media cards
- `FacetBar` - Filters sidebar
- `QuantityStepper` - +/- controls

### Commerce
- `AddToCartButton` - Integrated cart action
- `CartPanel` - Flyout cart summary

## Principles

1. **Token-only styling** - No raw hex, px values, or arbitrary classes
2. **Component composition** - Build pages from reusable primitives
3. **Semantic HTML** - Proper landmarks, headings, ARIA
4. **Responsive by default** - Mobile-first with 3 breakpoints
5. **Motion respect** - Honor prefers-reduced-motion
6. **Dark/light parity** - Both modes fully supported

## Architecture

```
src/design/
  ├── tokens.ts              # Design token definitions
  ├── UIProvider.tsx         # Global provider (theme, motion, a11y)
  ├── components/            # Design system components
  │   ├── Price.tsx
  │   ├── StatTile.tsx
  │   ├── ProfileChip.tsx
  │   ├── ReelCard.tsx
  │   ├── FacetBar.tsx
  │   └── QuantityStepper.tsx
  └── README.md              # This file
```

## Integration

Wrap your app root:

```tsx
import { UIProvider } from '@/design/UIProvider';

function App() {
  return (
    <UIProvider>
      {/* your app */}
    </UIProvider>
  );
}
```

## Linting

ESLint rules enforce token usage:
- No raw color values (use design tokens)
- No arbitrary spacing (use space scale)
- No inline motion timing (use motion tokens)
