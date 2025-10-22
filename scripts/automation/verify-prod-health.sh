#!/bin/bash
# Production Health Verification
# Blocks deploys if error rate exceeds threshold
# Usage: ./scripts/automation/verify-prod-health.sh

set -euo pipefail

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Configuration
ERROR_THRESHOLD="${ERROR_THRESHOLD:-0.5}"  # 0.5%
WINDOW_MINUTES="${WINDOW_MINUTES:-15}"     # Last 15 minutes

echo -e "${YELLOW}🏥 Verifying Production Health${NC}"
echo "═══════════════════════════════════════════"
echo "Error Threshold: ${ERROR_THRESHOLD}%"
echo "Time Window: ${WINDOW_MINUTES} minutes"
echo ""

# Check for required environment variables
if [ -z "${DATABASE_URL:-}" ]; then
  echo -e "${RED}❌ DATABASE_URL not set${NC}"
  exit 1
fi

# Query AI action error rate
QUERY="
  SELECT 
    COUNT(*) FILTER (WHERE status != 'success') AS errors,
    COUNT(*) AS total,
    ROUND(
      (COUNT(*) FILTER (WHERE status != 'success')::NUMERIC / 
       NULLIF(COUNT(*), 0)::NUMERIC) * 100, 
      2
    ) AS error_rate
  FROM ai_action_ledger
  WHERE created_at >= NOW() - INTERVAL '${WINDOW_MINUTES} minutes';
"

RESULT=$(psql "$DATABASE_URL" -t -c "$QUERY" | xargs)

if [ -z "$RESULT" ]; then
  echo -e "${YELLOW}⚠️  No data in last ${WINDOW_MINUTES} minutes${NC}"
  echo "   This might be expected for low-traffic periods"
  exit 0
fi

# Parse results
read -r ERRORS TOTAL ERROR_RATE <<< "$RESULT"

echo "📊 Metrics (last ${WINDOW_MINUTES} minutes):"
echo "   Total Requests: $TOTAL"
echo "   Errors: $ERRORS"
echo "   Error Rate: ${ERROR_RATE}%"
echo ""

# Compare error rate to threshold
if (( $(echo "$ERROR_RATE > $ERROR_THRESHOLD" | bc -l) )); then
  echo -e "${RED}❌ HEALTH CHECK FAILED${NC}"
  echo -e "${RED}   Error rate ${ERROR_RATE}% exceeds threshold ${ERROR_THRESHOLD}%${NC}"
  echo ""
  echo "🚫 Deployment blocked - investigate errors before deploying"
  exit 1
fi

echo -e "${GREEN}✅ Health check passed${NC}"
echo "   Error rate ${ERROR_RATE}% is within acceptable range"
echo ""
echo "🚀 Safe to deploy"
exit 0
