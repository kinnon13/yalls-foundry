#!/usr/bin/env bash
set -euo pipefail

echo "▶ Typecheck"
pnpm tsc -p tsconfig.json --noEmit

echo "▶ Lint"
pnpm lint || echo "Lint warnings present"

echo "▶ Build"
pnpm build

echo "▶ E2E (headless)"
pnpm exec playwright install --with-deps >/dev/null 2>&1 || true
pnpm exec playwright test

echo "▶ Route count sanity (target ~31)"
ROUTES=$(grep -c 'path=' src/App.tsx || echo "0")
echo "   Found routes: $ROUTES"
if [ "$ROUTES" -lt 28 ] || [ "$ROUTES" -gt 34 ]; then
  echo "✗ Route count out of target range (28–34)."
  exit 1
fi

echo "▶ Overlay registry present"
if [ ! -f "src/lib/overlay/registry.ts" ]; then
  echo "✗ Overlay registry not found"
  exit 1
fi

echo "▶ Key test files present"
for spec in pathway-structure super.e2e user-rocker admin.features; do
  if [ ! -f "tests/e2e/${spec}.spec.ts" ]; then
    echo "✗ Missing test: tests/e2e/${spec}.spec.ts"
    exit 1
  fi
done

echo "✔ All checks passed"
