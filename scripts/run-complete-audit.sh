#!/bin/bash
# Complete audit and restoration workflow

set -e

echo "Step 1: Running complete audit..."
deno run -A scripts/audit-functions.ts

echo ""
echo "Press ENTER to restore all ghost functions as stubs, or Ctrl+C to cancel..."
read

echo ""
echo "Step 2: Restoring ghost functions..."
deno run -A scripts/restore-ghost-functions.ts

echo ""
echo "Step 3: Running audit again to verify..."
deno run -A scripts/audit-functions.ts

echo ""
echo "✅ Complete! Review scripts/audit-results.json for full details"
