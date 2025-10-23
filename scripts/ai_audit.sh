#!/usr/bin/env bash
# 🚀 Complete Lovable platform audit suite (v2 - role-aware)

set -e

echo "🚀 Running full Lovable Cloud audit (v2 - role-aware)..."
echo "================================================================================"
echo ""

echo "Step 1/4: Platform health check..."
deno run -A scripts/verify-platform.ts
echo ""

echo "Step 2/4: Syncing config with function folders..."
deno run -A scripts/sync-supabase-config.ts
echo ""

echo "Step 3/4: Auditing function integrity..."
deno run -A scripts/audit-functions.ts
echo ""

echo "Step 4/4: Scanning for cross-dependencies & role overlap..."
deno run -A scripts/scan-cross-dependencies-v2.ts
echo ""

echo "================================================================================"
echo "✅ Lovable audit complete (v2). Check these reports:"
echo "   - scripts/audit-results.json (basic audit)"
echo "   - scripts/dependency-scan-results.json (detailed dependencies & roles)"
echo ""
echo "💡 Next actions:"
echo "   - Generate bridges/routers: deno run -A scripts/generate-bridges.ts"
echo "   - Restore ghost functions: deno run -A scripts/restore-ghost-functions.ts"
echo "   - Clean up duplicates: deno run -A scripts/cleanup-duplicates.ts"
