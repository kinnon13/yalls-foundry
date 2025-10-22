# Architecture Documentation

**Last Updated:** 2025-10-22

## Purpose

This directory contains architectural decisions, system design constraints, and technical blueprints that define the structure and boundaries of the application.

## Contents

### System Design

- **[10-SECTION-LOCKDOWN.md](./10-SECTION-LOCKDOWN.md)**
  - Enforces exactly 10 application sections for maintainability
  - Defines route structure, aliases, and navigation patterns
  - CI guardrails to prevent architectural drift
  - Core RPC contracts used across sections

## Architecture Principles

### 1. Constraint-Driven Design
The 10-section limit is not arbitrary — it forces clarity, prevents scope creep, and keeps the system navigable for both humans and AI agents.

### 2. Route-Based Organization
All features map to one of 10 top-level routes. New functionality extends existing sections rather than adding new top-level routes.

### 3. Workspace-Centric Model
Most power-user features live under `/workspace/:entityId/*` to keep public routes lean and producer tools organized.

### 4. Alias Preservation
Legacy routes remain as aliases to maintain backward compatibility while the architecture evolves underneath.

### 5. CI-Enforced Boundaries
Architecture constraints are validated in CI to prevent accidental violations during feature development.

## Key Concepts

### Sections vs Features
- **Section**: Top-level navigation category (Discovery, Marketplace, Workspace, etc.)
- **Feature**: Capability within a section (search filters, checkout flow, KPI dashboard)

Adding a feature = extending a section.  
Adding a section = architectural change requiring discussion.

### Public vs Workspace Routes

**Public Routes** (`/search`, `/marketplace`, `/entities/*`, `/events/*`):
- No authentication required (or optional enhancement)
- SEO-optimized, shareable
- Minimal state, fast loading

**Workspace Routes** (`/workspace/:entityId/*`):
- Authentication required
- Entity-scoped (user sees only their data)
- Rich features, more complex state

### Route Aliases
Preserve old URLs without creating new architectural heads:
```
/organizer/* → /workspace/:entityId/events/*
/crm → /workspace/:entityId/dashboard
/dashboard → /workspace
```

## Design Patterns

### Section Extension Pattern
When adding functionality:

1. **Identify closest existing section**
2. **Add as subpage or modal** within that section
3. **Update section README** with new capability
4. **Add tests** to verify section compliance

### Route Consolidation Pattern
When multiple routes serve similar purposes:

1. **Merge under single section** with tabs/filters
2. **Add aliases** for old routes
3. **Update config** to reflect consolidation
4. **Verify CI passes** section-count check

## Architecture Decision Records (ADRs)

Major architectural decisions are documented as ADRs:

```
docs/architecture/adr/
├── 001-ten-section-limit.md
├── 002-workspace-model.md
├── 003-route-aliasing-strategy.md
```

Each ADR includes:
- **Context**: Why the decision was needed
- **Decision**: What was decided
- **Consequences**: Trade-offs and implications
- **Status**: Accepted, deprecated, or superseded

## Validation Tools

Architecture constraints are enforced by:

```bash
# Verify section count ≤ 10
node scripts/validation/validate-architecture.mjs

# Verify routes match config
node scripts/validation/validate-main-routes.mjs

# Verify catalog coverage
node scripts/validation/validate-catalog-coverage.mjs
```

Run these locally before committing architecture changes.

## Common Mistakes

❌ **Adding new top-level route without discussion**  
✅ Extend existing section or propose replacement

❌ **Creating duplicate navigation patterns**  
✅ Use tabs, filters, or query params within sections

❌ **Breaking route aliases**  
✅ Test old URLs still work after refactoring

❌ **Bypassing CI validation**  
✅ Fix violations, don't disable checks

## For New Features

Before implementing a new feature:

1. **Identify target section** from the 10 allowed
2. **Review section's current capabilities**
3. **Plan integration** (subpage, tab, modal, etc.)
4. **Update architecture docs** if boundaries shift
5. **Run validation** before opening PR

## Related Documentation

- [Branching Strategy](../processes/BRANCHING_STRATEGY.md) - How to coordinate architecture changes
- [Production Hardening](../production/PRODUCTION_HARDENING.md) - Security implications of routes
- [Scripts README](../../scripts/README.md) - Validation tools

---

**Last Updated:** 2025-10-22
