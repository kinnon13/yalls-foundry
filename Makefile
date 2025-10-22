.PHONY: help phase0 phase1 phase2 phase3 phase4 phase5 phase6 phase7 all test clean

# Route Consolidation Makefile
# Run phases individually or all at once

ARCHIVE_DIR := src/__archive__/$(shell date +%Y-%m-%d)
BRANCH_NAME := chore/route-consolidation-archive

help: ## Show this help message
	@echo 'Usage: make [target]'
	@echo ''
	@echo 'Targets:'
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-15s\033[0m %s\n", $$1, $$2}'

phase0: ## Phase 0: Create branch & archive area
	@echo "Phase 0: Creating branch and archive directory..."
	git checkout -b $(BRANCH_NAME) || git checkout $(BRANCH_NAME)
	mkdir -p $(ARCHIVE_DIR)
	@echo "✓ Phase 0 complete"

phase1: ## Phase 1: Archive replaced files
	@echo "Phase 1: Archiving replaced rocker/andy files..."
	@[ -f src/routes/rocker-hub.tsx ] && git mv src/routes/rocker-hub.tsx $(ARCHIVE_DIR)/rocker-hub.tsx || true
	@[ -f src/routes/super-andy.tsx ] && git mv src/routes/super-andy.tsx $(ARCHIVE_DIR)/super-andy.tsx || true
	@[ -f src/routes/admin-rocker.tsx ] && git mv src/routes/admin-rocker.tsx $(ARCHIVE_DIR)/admin-rocker.tsx || true
	@[ -f src/pages/Login.tsx ] && git mv src/pages/Login.tsx $(ARCHIVE_DIR)/pages-Login.tsx || true
	@[ -f src/pages/SuperAndy.tsx ] && git mv src/pages/SuperAndy.tsx $(ARCHIVE_DIR)/pages-SuperAndy.tsx || true
	git add -A
	git commit -m "chore: archive replaced rocker/andy files (no deletes)" || true
	@echo "✓ Phase 1 complete"

phase2: ## Phase 2: Dashboard consolidation (interactive)
	@echo "Phase 2: Dashboard consolidation..."
	@bash scripts/route-consolidation.sh

phase3: ## Phase 3: Remove admin routes from App.tsx (manual)
	@echo "Phase 3: Remove extra admin routes from App.tsx"
	@echo "Edit src/App.tsx and remove:"
	@echo "  /admin/a11y, /admin/audit, /admin/claims, /admin/components,"
	@echo "  /admin/control-room, /admin/features, /admin/routes, /admin/stub-backlog,"
	@echo "  /admin/system, /admin/tests, /admin/workers"
	@echo ""
	@echo "Press Enter when done..."
	@read
	git add src/App.tsx
	git commit -m "refactor: remove extra admin routes from App.tsx" || true
	@echo "✓ Phase 3 complete"

phase4: ## Phase 4: Move overlay features
	@echo "Phase 4: Move overlay features to ?app= system"
	@echo "Edit src/App.tsx and remove overlay routes:"
	@echo "  /mlm, /crm, /farm/*, /ai/activity, /incentives/*, /notifications"
	@echo ""
	@echo "Press Enter when done..."
	@read
	git add src/App.tsx
	git commit -m "refactor: move overlay features to ?app= system" || true
	@echo "✓ Phase 4 complete"

phase5: ## Phase 5: Archive orphans
	@echo "Phase 5: Archiving orphaned files..."
	@[ -f src/routes/claim/[entityId].tsx ] && git mv src/routes/claim/[entityId].tsx $(ARCHIVE_DIR)/claim-entityId.tsx || true
	@[ -f src/routes/_diag.tsx ] && git mv src/routes/_diag.tsx $(ARCHIVE_DIR)/_diag.tsx || true
	git add -A
	git commit -m "chore: archive minor orphans" || true
	@echo "✓ Phase 5 complete"

phase6: ## Phase 6: Verify & test
	@echo "Phase 6: Running verification..."
	@echo "Route count: $(shell grep -c 'path=' src/App.tsx || echo 0)"
	pnpm build
	@echo "✓ Phase 6 complete"

phase7: ## Phase 7: Document & push
	@echo "Phase 7: Creating documentation..."
	@echo "# Route Consolidation Complete!" > docs/CONSOLIDATION_COMPLETE.md
	@echo "" >> docs/CONSOLIDATION_COMPLETE.md
	@echo "Routes: $(shell grep -c 'path=' src/App.tsx || echo 0)" >> docs/CONSOLIDATION_COMPLETE.md
	@echo "Route files: $(shell find src/routes -name '*.tsx' 2>/dev/null | wc -l)" >> docs/CONSOLIDATION_COMPLETE.md
	@echo "Archived: $(ARCHIVE_DIR)" >> docs/CONSOLIDATION_COMPLETE.md
	git add docs/CONSOLIDATION_COMPLETE.md
	git commit -m "docs: consolidation summary"
	@echo "✓ Phase 7 complete"
	@echo ""
	@echo "Push with: git push -u origin $(BRANCH_NAME)"

all: phase0 phase1 phase2 phase3 phase4 phase5 phase6 phase7 ## Run all phases

test: ## Run E2E tests
	pnpm exec playwright test

test-pathway: ## Run pathway structure tests only
	pnpm exec playwright test tests/e2e/pathway-structure.spec.ts

clean: ## Clean build artifacts
	rm -rf dist
	rm -rf .playwright

routes-count: ## Count current routes in App.tsx
	@grep -c 'path=' src/App.tsx || echo 0

status: ## Show consolidation status
	@echo "Current status:"
	@echo "  Routes in App.tsx: $(shell grep -c 'path=' src/App.tsx || echo 0)"
	@echo "  Route files: $(shell find src/routes -name '*.tsx' 2>/dev/null | wc -l)"
	@echo "  Archive dir: $(ARCHIVE_DIR)"
	@echo "  Branch: $(shell git branch --show-current)"
