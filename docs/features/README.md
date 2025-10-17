# Feature Management System

## Overview

The Feature Management System provides comprehensive tracking and auditing of all platform features using a kernel-based architecture:

- **JSON files** = data source (editable metadata + generated manifests)
- **Kernel** = behavior layer (typed helpers + guards)
- **Scripts** = maintenance tools (audit + backfill)

## Architecture

### Data Sources

1. **`features.json`** - Editable metadata (status, owner, severity, notes)
2. **`generated/route-manifest.json`** - Build artifact from route scanner
3. **`generated/component-registry.json`** - Build artifact from component scanner

### Kernel

**`src/lib/feature-kernel.ts`** - Single API for all feature operations:
- `kernel.features` - All features (merged dataset)
- `kernel.getFeature(id)` - Get feature by ID
- `kernel.getStatus(id)` - Get status
- `kernel.isAccessible(id)` - Check prod guards
- `kernel.validateGoldPath()` - Check critical features
- `kernel.getStats()` - Comprehensive statistics

## Usage

### View Feature Dashboard

Navigate to `/admin/features` to see:
- Feature index with filters
- Status breakdown (shell/full-ui/wired)
- Area breakdown
- Gold-path validation
- Placeholder detection

### Run Feature Audit

Check what percentage of your codebase is tagged:

```bash
npx tsx scripts/feature-audit.ts
```

This reports:
- Total features documented
- Route coverage %
- Component coverage %
- Missing areas
- Sample of untagged files

### Backfill Placeholders

Auto-create placeholder features for untagged routes/components:

```bash
npx tsx scripts/backfill-features.ts
```

This will:
- Scan route-manifest.json and component-registry.json
- Create placeholder features with inferred areas
- Set all new features to `status: "shell"`
- Mark with `notes: "Auto-generated placeholder"`

**Important:** Creates backup before modifying features.json

### Add Feature Tags

Tag your routes and components with feature annotations:

```typescript
/**
 * @feature(marketplace_listings)
 */
export default function ListingsPage() {
  // ...
}
```

### View Placeholders

In `/admin/features`, click "Show Placeholders" to see all auto-generated entries that need proper metadata.

## Feature Status Levels

- **shell** - Placeholder or basic structure only (hidden in production)
- **full-ui** - Complete UI implementation (visible but may not be wired)
- **wired** - Fully functional with backend integration

## Production Guards

The kernel automatically blocks shell features in production:
- Shell features are hidden unless `?dev=1` is in URL
- Sentry warnings sent if shell features accessed in prod
- Gold-path features validated in audit

## Gold-Path Features

Critical features that must be `full-ui` or `wired` before production:
- Profile features (pins, favorites, reposts)
- Composer features (core, crosspost, schedule)
- Notification features (lanes, prefs, digest)
- Events features (discounts, waitlist)
- Producer features (console, registrations, financials)
- Earnings features (tiers, missed)
- AI features (context, memory, NBA ranker)

## Maintenance

### Keep Features Up to Date

1. Run audit regularly: `npx tsx scripts/feature-audit.ts`
2. Backfill when coverage drops: `npx tsx scripts/backfill-features.ts`
3. Add `@feature(...)` tags to new files
4. Update placeholder features with proper metadata
5. Run `/admin/audit` to check platform health

### CI Integration

Recommended CI gates:
- ✅ Feature coverage > 90%
- ✅ All gold-path features ready
- ⚠️ No shell features in production routes

## Troubleshooting

**Q: Why does the feature count seem low?**
A: You're likely missing tags. Run `npx tsx scripts/feature-audit.ts` to see coverage.

**Q: How do I add a new area?**
A: Update `AREA_RULES` in `scripts/backfill-features.ts` and `FeatureArea` type in `feature-kernel.ts`.

**Q: Can I edit features.json directly?**
A: Yes! It's the source of truth for editable metadata. The kernel loads from it.

**Q: What about the complete.json file?**
A: The kernel auto-merges `features-complete.json` if it exists, combining arrays and preferring the complete dataset.

## Best Practices

1. **Tag as you build** - Add `@feature(...)` to every new route/component
2. **Start as shell** - New features begin as `shell`, promote when ready
3. **Use semantic IDs** - Pattern: `{area}_{slug}` (e.g., `marketplace_listings`)
4. **Document gold-path** - Mark critical features in GOLD_PATH_FEATURES
5. **Run audits often** - Catch untagged code early

## Examples

### Route with Feature Tag

```typescript
/**
 * @feature(marketplace_listing_detail)
 */
export default function ListingDetailPage() {
  const { id } = useParams();
  return <div>Listing {id}</div>;
}
```

### Component with Feature Tag

```typescript
/**
 * @feature(marketplace_search_filters)
 */
export function SearchFilters({ onFilter }: Props) {
  return <div>...</div>;
}
```

### Check Feature in Code

```typescript
import { kernel } from '@/lib/feature-kernel';

if (kernel.isAccessible('marketplace_advanced_search')) {
  return <AdvancedSearchUI />;
}
return <BasicSearchUI />;
```
