# AI-First Platform Implementation Phases

> Quick reference guide for phased rollout

## Phase Overview

| Phase | Focus | Duration | Key Deliverables |
|-------|-------|----------|------------------|
| 1 | Config-Driven Architecture | 1-2 weeks | `area-discovery.json`, hooks |
| 2 | Rocker Control Plane | 2 weeks | Segmentation, RPCs, theme tables |
| 3 | Theme System | 1 week | `ThemeBroker`, CSS variables |
| 4 | KPI Spine | 2 weeks | Live tiles, dashboard KPIs |
| 5 | EquineStats | 1 week | Public + private analytics |
| 6 | Growth Module | 2 weeks | Referral tracking, MLM |
| 7 | Consolidation | 1 week | Route cleanup, redirects |
| 8 | NBA & AI Loops | 2 weeks | Next-best-actions tray |
| 9 | Marketplace Integration | Parallel | Listing management |
| 10 | Privacy & Policy | Parallel | Consent enforcement |
| 11 | Instrumentation | Parallel | Observability, explainability |

**Total Duration**: ~12 weeks (3 months)

---

## Phase 1: Config-Driven Architecture ✅

### Checklist
- [ ] Create `configs/area-discovery.json`
- [ ] Create `src/hooks/useAreaDiscovery.ts`
- [ ] Update admin features page to read from config
- [ ] Update scanner to use config
- [ ] Test: changing config updates UI without redeploy

### Files to Create
```
configs/
  area-discovery.json           # Canonical area definitions

src/hooks/
  useAreaDiscovery.ts           # React hooks for config access
```

---

## Phase 2: Rocker Control Plane 🔨

### Database Migration
```sql
-- Run migration for:
-- - user_segments
-- - entity_segments  
-- - ui_theme_overrides
-- - Rocker control RPCs
```

### Checklist
- [ ] Run database migration
- [ ] Create client functions for Rocker RPCs
- [ ] Add RLS policies
- [ ] Test: Rocker can recommend and enable modules
- [ ] Test: Theme overrides work

### Files to Create
```
src/lib/rocker/
  control.ts                    # Client wrapper for Rocker RPCs
  segments.ts                   # Segmentation utilities
```

---

## Phase 3: Theme System 🎨

### Checklist
- [ ] Create `theme/tokens.css`
- [ ] Create `ThemeBroker` component
- [ ] Add ThemeBroker to App.tsx root
- [ ] Test: theme changes apply instantly
- [ ] Test: workspace > user > default priority works

### Files to Create
```
theme/
  tokens.css                    # Base CSS variables

src/components/theme/
  ThemeBroker.tsx               # Runtime theme resolver
```

---

## Phase 4: KPI Spine 📊

### Database Migration
```sql
-- Run migration for:
-- - KPI RPCs (get_workspace_kpis, etc.)
```

### Checklist
- [ ] Run database migration  
- [ ] Create `KpiTiles` component
- [ ] Add KPI polling logic
- [ ] Add to dashboard home
- [ ] Test: KPIs update within 2 minutes

### Files to Create
```
src/components/dashboard/
  KpiTiles.tsx                  # KPI dashboard component
  
src/hooks/
  useWorkspaceKpis.ts           # KPI data hook
```

---

## Phase 5: EquineStats 🐴

### Checklist
- [ ] Update routes for `/equinestats/*`
- [ ] Create public pages
- [ ] Create private workspace page
- [ ] Test: public pages work without auth
- [ ] Test: private page requires ownership

### Files to Create
```
src/pages/equinestats/
  HorsePerformance.tsx          # Public horse page
  Compare.tsx                   # Compare tool
  PedigreeTree.tsx              # Pedigree view
  CrossAnalysis.tsx             # Cross analysis
  WorkspaceAnalytics.tsx        # Private analytics
```

---

## Phase 6: Growth Module 🌱

### Database Migration
```sql
-- Run migration for:
-- - referral_links
-- - referral_events
-- - referral_tree
-- - referral_commissions
-- - Growth RPCs
```

### Checklist
- [ ] Run database migration
- [ ] Create `GrowthDashboard` component
- [ ] Add nav item for Growth
- [ ] Test: referral links work
- [ ] Test: commissions calculate correctly

### Files to Create
```
src/components/growth/
  GrowthDashboard.tsx           # Main dashboard
  ReferralLinks.tsx             # Link management
  ReferralTree.tsx              # MLM tree view
  CommissionHistory.tsx         # Commission tracking
```

---

## Phase 7: Consolidation 🔄

### Checklist
- [ ] Verify all redirects work
- [ ] Remove legacy code
- [ ] Update navigation labels
- [ ] Test: all alias routes work
- [ ] Test: state preserved during redirects

### Files to Update
```
src/lib/navigation/
  redirects.ts                  # Ensure all aliases present
  
src/components/navigation/
  MainNav.tsx                   # Update labels (Producer, not Organizer)
```

---

## Phase 8: NBA & AI Loops 🤖

### Checklist
- [ ] Create `NBATray` component
- [ ] Add to dashboard home
- [ ] Wire up accept/dismiss actions
- [ ] Test: NBA cards show with reason codes
- [ ] Test: actions execute correctly

### Files to Create
```
src/components/dashboard/
  NBATray.tsx                   # Next-best-actions component
  
src/lib/rocker/
  nba.ts                        # NBA client utilities
```

---

## Phase 9: Marketplace Integration 🛒

### Checklist
- [ ] Verify listing RPCs exist
- [ ] Create listing wizard
- [ ] Create listing editor
- [ ] Test: listings publish to marketplace
- [ ] Test: KPIs track views → ATC → purchase

### Files to Create
```
src/components/listings/
  ListingWizard.tsx             # Multi-step creation flow
  ListingEditor.tsx             # Edit existing listing
  PricingAssistant.tsx          # AI pricing suggestions
```

---

## Phase 10: Privacy & Policy 🔒

### Checklist
- [ ] Verify consent tables exist
- [ ] Add consent checks to all Rocker RPCs
- [ ] Test: policy rules enforced
- [ ] Test: blocklist prevents forbidden actions

### Files to Update
```
src/lib/rocker/
  control.ts                    # Add consent checks
  policy.ts                     # Policy enforcement utilities
```

---

## Phase 11: Instrumentation 📈

### Checklist
- [ ] Create `WhyThis` component
- [ ] Add to NBA cards
- [ ] Add to recommendations
- [ ] Test: reason codes display correctly

### Files to Create
```
src/components/shared/
  WhyThis.tsx                   # Explainability component
```

---

## Phase 12: Rocker Learning Loop 🤖

### Checklist
- [ ] Create rocker learning tables
- [ ] Create `rocker_predict` RPC
- [ ] Create `rocker_enact` RPC
- [ ] Create `rocker_log_outcome` RPC
- [ ] Add model registry
- [ ] Add intervention catalog
- [ ] Add policy guardrails
- [ ] Test: prediction returns scored interventions
- [ ] Test: enactment validates policies
- [ ] Test: outcomes logged correctly

### Files to Create
```
src/lib/rocker/
  learning.ts                   # Learning loop client
  models.ts                     # Model registry utilities
  interventions.ts              # Intervention management
  
src/components/rocker/
  InterventionCard.tsx          # Display intervention suggestions
  ModelRegistry.tsx             # Model management UI
```

---

## Phase 13: KPI Flo (Live Dashboard) 📊

### Checklist
- [ ] Create `KpiFlo` component
- [ ] Add north-star metrics
- [ ] Add activation ladder
- [ ] Add event ladder
- [ ] Add diagnostic tiles
- [ ] Add experiment overlay
- [ ] Wire to `get_workspace_kpis`
- [ ] Test: KPIs update within 2 minutes
- [ ] Test: All metric types display correctly

### Files to Create
```
src/components/dashboard/
  KpiFlo.tsx                    # Live KPI dashboard
  MetricTile.tsx                # Individual metric display
  ActivationFunnel.tsx          # Funnel visualization
  ExperimentOverlay.tsx         # A/B test results
```

---

## Phase 14: Work Reporting System 📝

### Checklist
- [ ] Create `work-report.json` schema
- [ ] Create CI workflow for validation
- [ ] Create validation script
- [ ] Create evidence check workflow
- [ ] Create RLS test suite
- [ ] Update PR template
- [ ] Test: CI fails without work report
- [ ] Test: CI validates all fields
- [ ] Test: Evidence pack verified

### Files to Create
```
.github/workflows/
  show-your-work.yml            # Work report validation
  ci-evidence.yml               # Evidence pack checks

scripts/
  validate-work-report.mjs      # Validation logic

scripts/ci/
  evidence_check.sh             # Evidence verification
  rls_test.sql                  # RLS test suite
```

---

## Phase 15: Integration & Polish ✨

### Checklist
- [ ] Integrate all phases
- [ ] Update documentation
- [ ] Seed test data
- [ ] Configure CI secrets
- [ ] Run full test suite
- [ ] Create evidence pack
- [ ] Deploy to staging
- [ ] QA all features
- [ ] Deploy to production

### Files to Update
```
configs/
  area-discovery.json           # Final config with all modules
  
docs/
  README.md                     # Updated with new features
  
.github/
  pull_request_template.md      # Complete checklist
```

---

## Testing Matrix

| Feature | Manual Test | Unit Test | E2E Test |
|---------|-------------|-----------|----------|
| Config updates UI | ✅ | - | - |
| Rocker module enable | ✅ | - | ✅ |
| Theme changes | ✅ | ✅ | - |
| KPI updates | ✅ | ✅ | ✅ |
| EquineStats public | ✅ | - | ✅ |
| EquineStats private | ✅ | - | ✅ |
| Referral tracking | ✅ | ✅ | ✅ |
| NBA accept/dismiss | ✅ | ✅ | ✅ |
| Route redirects | ✅ | - | ✅ |
| RLS policies | - | ✅ | ✅ |

---

## Rollback Plan

Each phase should be feature-flagged and can be rolled back independently:

```typescript
// Example feature flag check
if (featureFlags.workspace_growth) {
  // Show growth module
}
```

**Rollback procedure**:
1. Set feature flag to `false` in `feature_flags` table
2. Changes take effect immediately without code deploy
3. No data loss (tables remain, just hidden)

---

## Migration Script Example

```bash
#!/bin/bash
# Run all migrations in order

psql $DATABASE_URL << EOF
-- Phase 2: Rocker control plane
\i migrations/phase2_user_segments.sql
\i migrations/phase2_entity_segments.sql
\i migrations/phase2_theme_overrides.sql
\i migrations/phase2_rocker_rpcs.sql

-- Phase 4: KPI spine
\i migrations/phase4_kpi_rpcs.sql

-- Phase 6: Growth module
\i migrations/phase6_referral_tables.sql
\i migrations/phase6_growth_rpcs.sql

-- Backfill
\i migrations/backfill_kpi_snapshots.sql
EOF

echo "✅ All migrations complete"
```

---

## Success Criteria by Phase

### Phase 1
✅ Admin can edit `area-discovery.json` and see UI update
✅ Scanner uses config for grouping

### Phase 2
✅ Rocker can call `recommend_workspace_modules`
✅ Modules can be enabled dynamically
✅ Themes can be set per user/workspace

### Phase 3
✅ Theme changes apply without reload
✅ Priority resolution works correctly

### Phase 4
✅ All workspaces show KPI tiles
✅ KPIs update within 2 minutes

### Phase 5
✅ Public EquineStats accessible without auth
✅ Private EquineStats requires ownership

### Phase 6
✅ Referral links generate correctly
✅ Commissions calculate with clawbacks

### Phase 7
✅ All redirects work
✅ No broken legacy routes

### Phase 8
✅ NBA tray shows 5+ cards
✅ Accept/dismiss actions work

### Phases 9-11
✅ Listings publish successfully
✅ Privacy rules enforced
✅ Instrumentation working

---

## Next Steps

1. Review spec in `ai-first-platform-spec.md`
2. Create Phase 1 branch: `feat/config-driven-architecture`
3. Run Phase 1 checklist
4. Deploy to staging
5. QA and iterate
6. Deploy to production
7. Move to Phase 2

---

## Questions & Support

- Architecture questions: See `ai-first-platform-spec.md`
- Migration issues: Check rollback plan above
- Feature flags: See `configs/area-discovery.json`
