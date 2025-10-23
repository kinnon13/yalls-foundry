#!/bin/bash
# Quick guard check - run anytime to verify architecture integrity

echo ""
echo "🛡️  Guard Flow: Quick Architecture Check"
echo "═══════════════════════════════════════════════════════════════════"
echo ""

FAILED=0

echo "▶ Structure..."
deno run -A scripts/verify-structure.ts || FAILED=$((FAILED + 1))
echo ""

echo "▶ Supabase Config..."
deno run -A scripts/verify-supabase-config.ts || FAILED=$((FAILED + 1))
echo ""

echo "▶ Modules..."
deno run -A scripts/verify-modules.ts || FAILED=$((FAILED + 1))
echo ""

echo "═══════════════════════════════════════════════════════════════════"
if [ $FAILED -eq 0 ]; then
  echo "✅ All guards passed ($FAILED failures)"
  echo "   Architecture integrity verified"
else
  echo "❌ $FAILED guard(s) failed"
  echo "   Run: deno run -A scripts/master-elon-scan.ts --fix"
fi
echo "═══════════════════════════════════════════════════════════════════"
echo ""

exit $FAILED
