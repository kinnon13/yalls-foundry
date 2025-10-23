#!/bin/bash
# Generate audit receipts for SpaceX-level quality gate
set -e

echo "🔍 Generating audit receipts..."

mkdir -p _audit

# Tools: defined vs wired in executor
echo "📋 Scanning tool definitions..."
rg -n --glob '!node_modules' --glob '!.git' "name:\s*'[^']+'" src apps 2>/dev/null | sed -E "s/.*name:\s*'([^']+)'.*/\1/" | sort -u > _audit/tools_defined.txt || touch _audit/tools_defined.txt

echo "📋 Scanning executor implementations..."
rg -n --glob '!node_modules' --glob '!.git' "case\s+'[^']+':" supabase/functions/rocker-chat-simple/executor-full.ts 2>/dev/null | sed -E "s/.*case\s+'([^']+)'.*/\1/" | sort -u > _audit/tools_wired.txt || touch _audit/tools_wired.txt

echo "📋 Finding missing tools..."
comm -23 _audit/tools_defined.txt _audit/tools_wired.txt > _audit/tools_missing.txt || touch _audit/tools_missing.txt

# TODOs
echo "📝 Scanning frontend TODOs..."
rg -n --glob '!node_modules' --glob '!.git' '(TODO|FIXME)' src 2>/dev/null > _audit/todos_frontend.txt || touch _audit/todos_frontend.txt

echo "📝 Scanning backend TODOs..."
rg -n --glob '!node_modules' --glob '!.git' '(TODO|FIXME)' supabase/functions 2>/dev/null > _audit/todos_backend.txt || touch _audit/todos_backend.txt

# Event bus usage
echo "🔌 Scanning event emitters..."
rg -n --glob '!node_modules' --glob '!.git' '(emit|dispatchEvent|rockerBus|processWithRocker)\(' src 2>/dev/null > _audit/eventbus_emitters.txt || touch _audit/eventbus_emitters.txt

echo "🔌 Scanning event listeners..."
rg -n --glob '!node_modules' --glob '!.git' '(addEventListener|on\()' src 2>/dev/null | rg rocker > _audit/eventbus_listeners.txt || touch _audit/eventbus_listeners.txt

# Suspicious direct DB ops bypassing services
echo "⚠️  Scanning direct entity/calendar writes..."
rg -n --glob '!node_modules' --glob '!.git' "from\('entity_profiles'\)|from\('calendar_events'\)" supabase/functions 2>/dev/null > _audit/direct_entity_calendar_writes.txt || touch _audit/direct_entity_calendar_writes.txt

# Missing idempotency on POST/insert-like code
echo "🔒 Scanning mutations without idempotency..."
rg -n --glob '!node_modules' --glob '!.git' "insert\(|upsert\(|\.post\(|\.put\(" supabase/functions 2>/dev/null | rg -v "idempot|Idempot" > _audit/http_mutations_without_idempotency.txt || touch _audit/http_mutations_without_idempotency.txt

# Tenant guard usage
echo "🛡️  Scanning tenant guard usage..."
rg -n --glob '!node_modules' --glob '!.git' 'withTenantGuard' supabase/functions 2>/dev/null > _audit/tenant_guard_usage.txt || touch _audit/tenant_guard_usage.txt

# RLS policies
echo "🔐 Scanning RLS policies..."
rg -n --glob '!node_modules' --glob '!.git' 'ENABLE ROW LEVEL SECURITY' supabase/migrations 2>/dev/null | wc -l > _audit/rls_enabled_count.txt || echo "0" > _audit/rls_enabled_count.txt
rg -n --glob '!node_modules' --glob '!.git' 'CREATE POLICY' supabase/migrations 2>/dev/null | wc -l > _audit/policies_count.txt || echo "0" > _audit/policies_count.txt

echo "✅ Audit receipts generated in _audit/"
echo ""
echo "📊 Summary:"
echo "  - Tools defined: $(wc -l < _audit/tools_defined.txt)"
echo "  - Tools wired: $(wc -l < _audit/tools_wired.txt)"
echo "  - Tools missing: $(wc -l < _audit/tools_missing.txt)"
echo "  - Frontend TODOs: $(wc -l < _audit/todos_frontend.txt)"
echo "  - Backend TODOs: $(wc -l < _audit/todos_backend.txt)"
echo "  - RLS enabled: $(cat _audit/rls_enabled_count.txt)"
echo "  - Policies: $(cat _audit/policies_count.txt)"
echo "  - Tenant guard usage: $(wc -l < _audit/tenant_guard_usage.txt)"
