#!/usr/bin/env bash
set -euo pipefail
OUT="docs/audit/main-snapshot.md"
echo "# Main Snapshot ($(date -u +"%Y-%m-%d %H:%M UTC"))" > "$OUT"

echo -e "\n## Framework & tooling" >> "$OUT"
node -v >> "$OUT" 2>&1 || true
npm -v >> "$OUT" 2>&1 || true
jq -r '.scripts' package.json 2>/dev/null | sed 's/^/    /' >> "$OUT" || echo "    (no package.json?)" >> "$OUT"

echo -e "\n## Routes / pages (quick grep)" >> "$OUT"
grep -RIn --include='*.{tsx,ts,jsx,js}' -E '<Route|createBrowserRouter|router\.add|path="' src 2>/dev/null | head -n 100 >> "$OUT" || echo "    (no router hits)" >> "$OUT"

echo -e "\n## Supabase edge functions" >> "$OUT"
find supabase/functions -maxdepth 2 -name 'index.ts' 2>/dev/null | sed 's/^/    /' >> "$OUT" || echo "    (none)" >> "$OUT"

echo -e "\n## DB migrations" >> "$OUT"
ls -1 supabase/migrations 2>/dev/null | sed 's/^/    /' >> "$OUT" || echo "    (none)" >> "$OUT"

echo -e "\n## RLS / policies in SQL" >> "$OUT"
grep -RIn --include='*.sql' -E 'policy|RLS|row level' supabase 2>/dev/null | head -n 60 >> "$OUT" || echo "    (no matches)" >> "$OUT"

echo -e "\n## Stripe present?" >> "$OUT"
grep -RIn -E 'from .?stripe|Stripe\\(|stripe\\.' --include='*.{ts,tsx,js,jsx}' . 2>/dev/null | head -n 40 >> "$OUT" || echo "    (no stripe refs)" >> "$OUT"

echo -e "\n## TODO / FIXME counts" >> "$OUT"
echo -n "TODO: " >> "$OUT"; (grep -RIn --exclude-dir=node_modules -E 'TODO|FIXME' . | wc -l) >> "$OUT"

echo -e "\n## console.log count (src + functions)" >> "$OUT"
echo -n "console.log: " >> "$OUT"; (grep -RIn --include='*.{ts,tsx,js,jsx}' -E 'console\.log' src supabase/functions 2>/dev/null | wc -l) >> "$OUT"

echo -e "\n## Hard-coded tenant/org IDs" >> "$OUT"
grep -RIn --include='*.{ts,tsx,js,jsx,sql}' -E 'tenant_id|org_id' src supabase 2>/dev/null | head -n 60 >> "$OUT" || echo "    (no matches)" >> "$OUT"

echo -e "\n## Rate limiting / Upstash" >> "$OUT"
grep -RIn --include='*.{ts,tsx,js,jsx}' -E 'upstash|ratelimit|rateLimit' . 2>/dev/null | head -n 40 >> "$OUT" || echo "    (no matches)" >> "$OUT"

echo -e "\n---\n(End of snapshot)" >> "$OUT"
echo "Wrote $OUT"
