#!/usr/bin/env bash
# 🚀 Complete Lovable platform audit suite

set -e

echo "🚀 Running full Lovable Cloud audit..."
echo "================================================================================"
echo ""

echo "Step 1/3: Platform health check..."
deno run -A scripts/verify-platform.ts
echo ""

echo "Step 2/3: Syncing config with function folders..."
deno run -A scripts/sync-supabase-config.ts
echo ""

echo "Step 3/3: Auditing function integrity..."
deno run -A scripts/audit-functions.ts
echo ""

echo "================================================================================"
echo "✅ Lovable audit complete. Check scripts/audit-results.json for details"
echo ""
echo "💡 To restore ghost functions, run:"
echo "   deno run -A scripts/restore-ghost-functions.ts"
