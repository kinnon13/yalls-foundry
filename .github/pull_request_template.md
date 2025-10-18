## Work Report

**Summary**: 
<!-- What changed and why (1-3 sentences) -->

**Changes**:
<!-- List each file changed with description -->
- file: `path/to/file.ts` — description of what changed
- file: `path/to/file.ts` — description of what changed

**Commands/Tests**:
<!-- Commands run and their results -->
- `pnpm test` → exit 0 (all tests passed)
- `pnpm build` → exit 0 (build successful)

**Migrations/RPCs/Flags**:
<!-- Database and configuration changes -->
- migrations: list migration IDs
- rpcs: list RPC names added/modified
- flags: list feature flags changed

**Screens/Links**: 
<!-- Screenshots or demo videos -->
- Evidence pack: `docs/release/EVIDENCE-<id>/`
- Screenshots: `docs/screenshots/*.png`

**Next Steps**:
<!-- What needs to happen next -->
- [ ] Item 1
- [ ] Item 2

**Blockers**:
<!-- Any blocking issues -->
- None / List any blockers

---

## Scope

- [ ] Areas updated (config-driven): `configs/area-discovery.json`
- [ ] Rocker control plane RPCs
- [ ] KPI spine & tiles
- [ ] EquineStats (public + private)
- [ ] Growth (Network & Affiliates)
- [ ] Theme overrides (user/workspace)
- [ ] Route redirects

## Security & RLS

- New tables RLS: (summary)
- Security definer functions audited: (list)

## Acceptance Checks

- [ ] Changing `configs/area-discovery.json` re-groups UI without redeploy
- [ ] Legacy routes redirect correctly preserving state
- [ ] `set_theme_overrides` updates UI at runtime
- [ ] KPI tiles reflect new data within ~2 minutes
- [ ] RLS policies prevent cross-workspace access
- [ ] Evidence pack is complete

## Rollback Plan

<!-- How to rollback if needed -->
