#!/bin/bash
# Run all feature management scripts in sequence

set -e

echo "🚀 Running Feature Management Pipeline..."
echo ""

echo "📍 Step 1: Scanning routes..."
npx tsx scripts/scan-routes.ts

echo "🧩 Step 2: Scanning components..."
npx tsx scripts/scan-components.ts

echo "📊 Step 3: Running feature audit..."
npx tsx scripts/feature-audit.ts

echo "🔧 Step 4: Backfilling features..."
npx tsx scripts/backfill-features.ts

echo ""
echo "✅ Pipeline complete!"
echo "   Refresh your app to see the full feature list in /admin/features"
echo ""
