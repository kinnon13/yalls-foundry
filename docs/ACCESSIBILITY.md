# Accessibility Standards

**Compliance Level:** WCAG 2.1 AA  
**Last Audit:** 2025-01-17  
**Owner:** Accessibility Team

## Overview

This project is built with accessibility as a core requirement, not an afterthought. All features must meet WCAG 2.1 Level AA standards before shipping to production.

## Landmarks & Structure

### Required Landmarks

Every page must include:
- `<header role="banner">` - Site header
- `<main id="main-content" role="main">` - Primary content
- `<footer role="contentinfo">` - Site footer
- `<nav role="navigation">` - Navigation menus
- `<section role="region" aria-label="[descriptive name]">` - Major content sections

### Skip Link

A skip link is the **first focusable element** on every page:

```tsx
<a href="#main-content" className="sr-only focus:not-sr-only ...">
  Skip to content
</a>
```

**Why:** Allows keyboard users to bypass repetitive navigation.

## Keyboard Navigation

### Focus Management

All interactive elements must be keyboard accessible:
- **Tab:** Move to next focusable element
- **Shift+Tab:** Move to previous element
- **Enter/Space:** Activate buttons
- **Escape:** Close modals/dialogs
- **Arrow keys:** Navigate within components (lists, tabs, etc.)

### Focus Indicators

All focusable elements must have visible focus indicators with **4.5:1 contrast ratio** against their background.

```css
.button:focus-visible {
  outline: 2px solid hsl(var(--ring));
  outline-offset: 2px;
}
```

### Focus Trap

Modals and dialogs must trap focus using `useFocusTrap`:

```tsx
import { useFocusTrap } from '@/lib/a11y/useFocusTrap';

export function Modal({ open }: Props) {
  const trapRef = useFocusTrap<HTMLDivElement>(open);
  
  return (
    <div role="dialog" aria-modal="true" ref={trapRef}>
      {/* Focus stays within this div */}
    </div>
  );
}
```

## ARIA Attributes

### Dialog/Modal Pattern

```tsx
<div
  role="dialog"
  aria-modal="true"
  aria-labelledby="dialog-title"
  aria-describedby="dialog-desc"
>
  <h2 id="dialog-title">Title</h2>
  <p id="dialog-desc">Description</p>
</div>
```

### Toggle Buttons

```tsx
<button
  aria-label="Favorite this post"
  aria-pressed={isFavorited}
>
  <Heart />
</button>
```

### Form Labels

All inputs must have associated labels:

```tsx
<label htmlFor="username">Username</label>
<input id="username" type="text" />
```

Or use `aria-label` if visual label isn't needed:

```tsx
<input type="search" aria-label="Search posts" />
```

## Color & Contrast

### Contrast Ratios (WCAG AA)

- **Normal text:** 4.5:1 minimum
- **Large text (18pt+):** 3:1 minimum
- **UI components:** 3:1 minimum

### Color Independence

**Never** use color as the only way to convey information:

❌ **Bad:**
```tsx
<span style={{ color: 'red' }}>Error</span>
```

✅ **Good:**
```tsx
<span className="text-destructive">
  <AlertCircle className="inline w-4 h-4" /> Error
</span>
```

## Motion & Animation

### Reduced Motion

Respect user preference for reduced motion:

```tsx
import { useReducedMotion } from '@/lib/a11y/useReducedMotion';

export function AnimatedButton() {
  const prefersReducedMotion = useReducedMotion();
  
  return (
    <button
      style={{
        transition: prefersReducedMotion ? 'none' : 'all 0.2s ease'
      }}
    >
      Click me
    </button>
  );
}
```

CSS alternative:

```css
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

## Screen Readers

### Semantic HTML

Use semantic elements over divs:

```tsx
// ❌ Bad
<div onClick={handleClick}>Submit</div>

// ✅ Good
<button onClick={handleClick}>Submit</button>
```

### Hidden Content

- **Visually hidden but screen-reader accessible:** `className="sr-only"`
- **Hidden from everyone:** `aria-hidden="true"`
- **Decorative images:** `alt=""` or `aria-hidden="true"`

### Live Regions

For dynamic content updates:

```tsx
<div role="status" aria-live="polite">
  {statusMessage}
</div>

<div role="alert" aria-live="assertive">
  {errorMessage}
</div>
```

## Testing

### Automated Testing

Run axe-core tests on all pages:

```bash
npm run test:a11y
```

This runs against all critical routes and fails on any WCAG 2.1 AA violations.

### Manual Testing

#### Keyboard Only

1. Unplug your mouse
2. Navigate entire app with keyboard
3. Verify all functionality is accessible

#### Screen Reader

Test with:
- **macOS:** VoiceOver (Cmd+F5)
- **Windows:** NVDA (free) or JAWS
- **Linux:** Orca

#### Browser DevTools

- Chrome: Lighthouse audit
- Firefox: Accessibility inspector
- Safari: Accessibility inspector

### Checklist

Before shipping a feature:

- [ ] All interactive elements keyboard accessible
- [ ] Focus indicators visible (4.5:1 contrast)
- [ ] Modals trap focus and close on Escape
- [ ] All images have alt text
- [ ] Forms have proper labels
- [ ] Color not used as only indicator
- [ ] Contrast ratios meet AA standards
- [ ] Reduced motion respected
- [ ] No axe violations
- [ ] Screen reader testing passed

## Common Patterns

### Card with Action

```tsx
<article className="card">
  <img src={src} alt={description} />
  <h3>{title}</h3>
  <p>{description}</p>
  <button aria-label={`View details for ${title}`}>
    View Details
  </button>
</article>
```

### Icon-Only Button

```tsx
<button aria-label="Close dialog">
  <X className="w-4 h-4" aria-hidden="true" />
</button>
```

### Tabbed Interface

```tsx
<div role="tablist" aria-label="Account settings">
  <button role="tab" aria-selected={tab === 'profile'}>
    Profile
  </button>
  <button role="tab" aria-selected={tab === 'security'}>
    Security
  </button>
</div>
<div role="tabpanel" aria-labelledby="profile-tab">
  {/* Profile content */}
</div>
```

## Resources

- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [ARIA Authoring Practices](https://www.w3.org/WAI/ARIA/apg/)
- [axe DevTools](https://www.deque.com/axe/devtools/)
- [WebAIM Contrast Checker](https://webaim.org/resources/contrastchecker/)

## Support

**Questions?** `#accessibility` on Slack  
**Issues?** Tag `a11y` in Jira  
**Champion:** @a11y-lead
