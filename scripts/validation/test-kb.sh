#!/bin/bash
# Test the KB ingestion and search system

set -e

echo "🧪 Testing KB System"
echo "===================="

if [ -z "$VITE_SUPABASE_URL" ] || [ -z "$SUPABASE_SERVICE_ROLE_KEY" ]; then
  echo "❌ Missing VITE_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY"
  exit 1
fi

# Test 1: Crawl a single page
echo ""
echo "1️⃣  Testing site crawl..."
curl -X POST "${VITE_SUPABASE_URL}/functions/v1/rocker-crawl-site" \
  -H "Authorization: Bearer ${SUPABASE_SERVICE_ROLE_KEY}" \
  -H "Content-Type: application/json" \
  -d '{
    "baseUrl": "https://example.com",
    "maxPages": 1,
    "maxDepth": 0
  }' | jq '.'

echo ""
echo "2️⃣  Testing KB search..."
curl -X POST "${VITE_SUPABASE_URL}/functions/v1/kb-search" \
  -H "Authorization: Bearer ${SUPABASE_SERVICE_ROLE_KEY}" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "example domain",
    "topK": 5
  }' | jq '.'

echo ""
echo "✅ KB tests complete!"

exit 0
