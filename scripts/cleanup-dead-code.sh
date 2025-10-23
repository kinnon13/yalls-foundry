#!/bin/bash
# Dead Code Cleanup Script
# Identifies and optionally removes unused exports from the codebase

set -e

echo "🔍 Scanning for dead code..."

# Run ts-prune to find unused exports
echo ""
echo "Running ts-prune..."
npx ts-prune --error | tee dead-code-report.txt

# Count issues
DEAD_COUNT=$(grep -c "used in module" dead-code-report.txt || echo "0")

echo ""
echo "📊 Found $DEAD_COUNT unused exports"

if [ "$DEAD_COUNT" -gt 0 ]; then
  echo ""
  echo "⚠️  Review dead-code-report.txt for details"
  echo ""
  echo "To automatically remove (⚠️  BACKUP FIRST):"
  echo "  npm install -g ts-unused-exports"
  echo "  ts-unused-exports tsconfig.json --deleteUnusedFiles"
  echo ""
  echo "Manual cleanup recommended for first pass!"
  exit 1
else
  echo "✅ No dead code found!"
  exit 0
fi
