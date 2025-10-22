# `/tests` - Test Suites

This directory contains all automated tests for Y'alls Foundry.

## 📁 Structure

```
tests/
├── setup.ts              Test environment setup
│
├── a11y/                 Accessibility tests (WCAG compliance)
│   ├── global.spec.ts   Global accessibility checks
│   └── ui-census.spec.ts UI element validation
│
├── e2e/                  End-to-end tests (full user flows)
│   └── ...
│
├── unit/                 Unit tests (component/function level)
│   └── ...
│
└── integration/          Integration tests (API/database)
    └── ...
```

## 🎯 Test Types

### Accessibility Tests (`/a11y`)
- **Tool**: Playwright + axe-core
- **Purpose**: WCAG 2.1 AA compliance
- **Coverage**: Critical routes, keyboard navigation, screen readers
- **Run**: `npm run test:a11y`

**What we test**:
- ARIA labels and roles
- Keyboard navigation
- Color contrast
- Focus management
- Screen reader compatibility
- Reduced motion preferences

### End-to-End Tests (`/e2e`)
- **Tool**: Playwright
- **Purpose**: Full user flows from browser perspective
- **Coverage**: Critical paths, authentication, checkout, etc.
- **Run**: `npm run test:e2e`

**What we test**:
- User registration and login
- Complete checkout flow
- Event creation and management
- MLM tree operations
- Search and filtering
- Cross-browser compatibility

### Unit Tests (`/unit`)
- **Tool**: Vitest + React Testing Library
- **Purpose**: Individual components and functions
- **Coverage**: Components, hooks, utilities
- **Run**: `npm test`

**What we test**:
- Component rendering
- User interactions
- Hook behavior
- Utility functions
- Edge cases

### Integration Tests (`/integration`)
- **Tool**: Vitest + Supabase Test Client
- **Purpose**: API and database interactions
- **Coverage**: Edge functions, RPC calls, RLS policies
- **Run**: `npm run test:integration`

**What we test**:
- Edge function behavior
- Database queries
- RLS policy enforcement
- Tenant isolation
- Rate limiting

## 🚀 Running Tests

### All Tests
```bash
npm test
```

### Specific Suites
```bash
npm run test:a11y          # Accessibility only
npm run test:e2e           # End-to-end only
npm run test:unit          # Unit tests only
npm run test:integration   # Integration only
```

### Watch Mode
```bash
npm test -- --watch        # Re-run on file changes
```

### Coverage
```bash
npm run test:coverage      # Generate coverage report
```

### Debug Mode
```bash
npm test -- --debug        # Run with debugger
```

## 📊 Coverage Requirements

| Type | Minimum Coverage |
|------|------------------|
| Branches | 80% |
| Lines | 85% |
| Statements | 85% |
| Functions | 85% |

**Coverage is enforced by CI.**

## 🧪 Writing Tests

### Test File Naming
```
[file-name].test.ts       # Unit tests
[file-name].spec.ts       # E2E/integration tests
```

### Test Structure
```typescript
import { describe, it, expect, beforeEach } from 'vitest';

describe('ComponentName', () => {
  beforeEach(() => {
    // Setup before each test
  });

  it('should do something', () => {
    // Arrange
    const input = 'test';
    
    // Act
    const result = doSomething(input);
    
    // Assert
    expect(result).toBe('expected');
  });

  it('should handle edge case', () => {
    // Test edge cases
  });
});
```

### Component Testing
```typescript
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { MyComponent } from './MyComponent';

describe('MyComponent', () => {
  it('renders with correct text', () => {
    render(<MyComponent title="Hello" />);
    expect(screen.getByText('Hello')).toBeInTheDocument();
  });

  it('handles user interaction', async () => {
    const { user } = render(<MyComponent />);
    await user.click(screen.getByRole('button'));
    expect(screen.getByText('Clicked')).toBeInTheDocument();
  });
});
```

### E2E Testing
```typescript
import { test, expect } from '@playwright/test';

test('user can complete checkout', async ({ page }) => {
  // 1. Navigate to marketplace
  await page.goto('/marketplace');
  
  // 2. Add item to cart
  await page.click('[data-testid="add-to-cart"]');
  
  // 3. Go to cart
  await page.goto('/cart');
  
  // 4. Complete checkout
  await page.fill('[name="email"]', 'test@example.com');
  await page.click('[data-testid="checkout"]');
  
  // 5. Verify success
  await expect(page.locator('.success-message')).toBeVisible();
});
```

## 🔧 Test Utilities

### Mock Data
```typescript
import { createMockUser, createMockEvent } from '../fixtures';

const user = createMockUser({ role: 'admin' });
const event = createMockEvent({ status: 'active' });
```

### Test Helpers
```typescript
import { setupTestDb, cleanupTestDb } from '../helpers';

beforeEach(async () => {
  await setupTestDb();
});

afterEach(async () => {
  await cleanupTestDb();
});
```

## ⚠️ Common Pitfalls

### 1. Async Issues
```typescript
// ❌ Wrong - missing await
it('loads data', () => {
  const data = fetchData();
  expect(data).toBeDefined();
});

// ✅ Correct - awaits async operation
it('loads data', async () => {
  const data = await fetchData();
  expect(data).toBeDefined();
});
```

### 2. Test Isolation
```typescript
// ❌ Wrong - tests affect each other
let sharedState = [];

it('test 1', () => {
  sharedState.push('item');
});

it('test 2', () => {
  expect(sharedState).toHaveLength(1); // Flaky!
});

// ✅ Correct - clean state per test
beforeEach(() => {
  sharedState = [];
});
```

### 3. Over-Mocking
```typescript
// ❌ Wrong - mocking everything
vi.mock('./api');
vi.mock('./helpers');
vi.mock('./utils');

// ✅ Correct - mock only external dependencies
vi.mock('./api'); // Only mock API calls
```

## 🔍 Debugging Failed Tests

### 1. Run Single Test
```bash
npm test -- -t "specific test name"
```

### 2. Enable Verbose Output
```bash
npm test -- --verbose
```

### 3. Playwright UI Mode
```bash
npx playwright test --ui
```

### 4. Take Screenshots
```typescript
await page.screenshot({ path: 'debug.png' });
```

### 5. Add Console Logs
```typescript
console.log('State:', state);
console.log('Props:', props);
```

## 📋 Pre-Commit Checklist

Before committing:
- [ ] All tests pass locally
- [ ] New features have tests
- [ ] Coverage meets minimums
- [ ] No `.only` or `.skip` in tests
- [ ] Tests are fast (<5s per test)
- [ ] Tests are deterministic (no random failures)

## 🔗 Related Docs

- [PROJECT_RULES.md](../PROJECT_RULES.md) - Testing requirements
- [Vitest Docs](https://vitest.dev/) - Unit test framework
- [Playwright Docs](https://playwright.dev/) - E2E testing
- [Testing Library Docs](https://testing-library.com/) - React testing utilities

---

**Last Updated**: 2025-10-22  
**Test Coverage**: 85%+ (enforced by CI)
