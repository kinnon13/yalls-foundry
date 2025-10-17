#!/bin/bash
# Run all feature management scripts in sequence

set -e

echo "🚀 Running Feature Management Pipeline..."
echo ""

echo "📍 Step 1: Scanning routes..."
npx tsx scripts/scan-routes.ts || true

echo ""
echo "🧩 Step 2: Scanning components..."
npx tsx scripts/scan-components.ts || true

echo ""
echo "🔧 Step 3: Backfilling features (generates feature-backfill.json)..."
npx tsx scripts/backfill-features.ts

echo ""
echo "📊 Step 4: Running feature audit..."
npx tsx scripts/feature-audit.ts || true

echo ""
echo "🔍 Step 5: Quick verification..."
if [ -f "generated/feature-backfill.json" ]; then
  GENERATED_COUNT=$(grep -c '"id"' generated/feature-backfill.json || echo "0")
  echo "   ✅ Generated features: $GENERATED_COUNT"
else
  echo "   ⚠️  No generated/feature-backfill.json found"
fi

BASE_COUNT=$(grep -c '"id"' docs/features/features.json || echo "0")
echo "   ✅ Base features: $BASE_COUNT"

echo ""
echo "✅ Pipeline complete!"
echo ""
echo "📈 Next steps:"
echo "   1. Open /admin/features in your browser"
echo "   2. Header should show: 'X base · Y overlay · Z generated'"
echo "   3. Console should log: [Feature Kernel] Loaded XXX features"
echo "   4. Filter by Area: business to see CRM, KPIs, analytics, etc."
echo ""

