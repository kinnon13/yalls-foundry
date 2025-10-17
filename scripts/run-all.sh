#!/bin/bash
# Run all feature management scripts in sequence

set -e

echo "🚀 Running Feature Management Pipeline..."
echo ""

echo "📍 Step 1: Scanning routes..."
npx tsx scripts/scan-routes.ts || true

echo "🧩 Step 2: Scanning components..."
npx tsx scripts/scan-components.ts || true

echo "🔧 Step 3: Backfilling features (this generates the big list)..."
npx tsx scripts/backfill-features.ts

echo "📊 Step 4: Running feature audit..."
npx tsx scripts/feature-audit.ts || true

echo ""
echo "✅ Pipeline complete!"
echo ""
echo "📈 Check the results:"
echo "   1. Look at generated/feature-backfill.json"
echo "   2. Refresh /admin/features"
echo "   3. Header should show: 'X base · Y overlay · Z generated'"
echo "   4. Console should log: [Feature Kernel] Loaded XXX features"
echo ""

