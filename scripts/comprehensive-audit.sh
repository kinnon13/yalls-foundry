#!/bin/bash
# Comprehensive AI & Security Audit for yalls-foundry
# Scans all AI features, guardrails, and generates coverage report

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo "🔍 COMPREHENSIVE AI & SECURITY AUDIT"
echo "===================================="
echo ""

TOTAL_CHECKS=0
PASSED=0
WARNINGS=0
FAILED=0

# Function to check feature
check_feature() {
  local name=$1
  local pattern=$2
  local location=$3
  
  TOTAL_CHECKS=$((TOTAL_CHECKS + 1))
  
  if grep -rq "$pattern" "$location" 2>/dev/null; then
    echo -e "${GREEN}✅ $name${NC}"
    PASSED=$((PASSED + 1))
    return 0
  else
    echo -e "${RED}❌ $name${NC}"
    FAILED=$((FAILED + 1))
    return 1
  fi
}

check_partial() {
  local name=$1
  local pattern=$2
  local location=$3
  
  TOTAL_CHECKS=$((TOTAL_CHECKS + 1))
  
  if grep -rq "$pattern" "$location" 2>/dev/null; then
    echo -e "${YELLOW}🟡 $name (partial)${NC}"
    WARNINGS=$((WARNINGS + 1))
    return 0
  else
    echo -e "${RED}❌ $name${NC}"
    FAILED=$((FAILED + 1))
    return 1
  fi
}

echo "## AI FEATURES"
echo "-------------"
check_feature "Super Andy Chat" "SuperAndyChat" "src/"
check_feature "Rocker AI" "RockerChat" "src/"
check_feature "MDR Generate" "mdr_generate" "supabase/functions/"
check_feature "MDR Consensus" "mdr_consensus" "supabase/functions/"
check_feature "MDR Orchestrate" "mdr_orchestrate" "supabase/functions/"
check_feature "Self-Improve Tick" "self_improve_tick" "supabase/functions/"
check_feature "Perceive Tick" "perceive_tick" "supabase/functions/"
check_feature "Red Team (Bias Detection)" "red_team_tick" "supabase/functions/"
check_feature "User RAG Index" "user_rag_index" "supabase/functions/"
check_feature "Fine-Tune Cohort" "fine_tune_cohort" "supabase/functions/"
check_feature "Proactivity Level" "proactivity_level" "supabase/migrations/"
check_feature "Pathway Mode" "pathway_mode" "supabase/migrations/"
check_feature "AI User Profiles" "ai_user_profiles" "supabase/migrations/"
check_feature "AI Memory System" "ai_user_memory" "supabase/migrations/"
check_feature "Canary Deployments" "canary" "supabase/functions/"
echo ""

echo "## GUARDRAILS & SECURITY"
echo "----------------------"
check_feature "RLS Enabled" "ENABLE ROW LEVEL SECURITY" "supabase/migrations/"
check_feature "Tenant Isolation" "tenant_id" "supabase/migrations/"
check_feature "Idempotency Keys" "idempotency_key" "supabase/migrations/"
check_feature "Rate Limiting" "rate_limit" "supabase/functions/"
check_feature "CSP Headers" "Content-Security-Policy" "vite.config.ts"
check_feature "AI Incidents Table" "ai_incidents" "supabase/migrations/"
check_feature "Change Proposals" "ai_change_proposals" "supabase/migrations/"
check_feature "Audit Logging" "ai_action_ledger" "supabase/migrations/"
check_feature "Circuit Breaker" "circuit_breaker" "supabase/functions/"
check_feature "Observability/Telemetry" "telemetry" "src/"
check_feature "A11y Testing" "axe" "package.json"
check_feature "Performance Monitoring" "longtask" "src/"
check_feature "Offline Support" "serviceWorker" "src/"
echo ""

echo "## CODE QUALITY"
echo "--------------"
check_feature "TypeScript Interfaces" "interface.*{" "src/"
check_feature "Dead Code Detection" "ts-prune" "package.json"
check_feature "Cache Strategy" "cache" "src/"
check_feature "Database Sharding" "shard_key" "supabase/migrations/"
check_feature "Partitioning" "PARTITION BY" "supabase/migrations/"
check_feature "Indexes" "CREATE INDEX" "supabase/migrations/"
echo ""

echo "## ADVANCED AI"
echo "-------------"
check_feature "Embeddings (pgvector)" "vector" "supabase/migrations/"
check_feature "AI Feedback Loop" "ai_feedback" "supabase/migrations/"
check_feature "Learning System" "ai_learnings" "supabase/migrations/"
check_feature "Hypothesis Testing" "ai_hypotheses" "supabase/migrations/"
check_feature "Cohort Analysis" "cohort" "supabase/functions/"
check_feature "Model Drift Detection" "model_drift" "supabase/functions/"
echo ""

echo "## SUMMARY"
echo "========="
echo -e "Total Checks: ${BLUE}$TOTAL_CHECKS${NC}"
echo -e "Passed: ${GREEN}$PASSED${NC}"
echo -e "Warnings: ${YELLOW}$WARNINGS${NC}"
echo -e "Failed: ${RED}$FAILED${NC}"
echo ""

COVERAGE=$(( (PASSED * 100) / TOTAL_CHECKS ))
echo -e "Coverage: ${BLUE}${COVERAGE}%${NC}"

if [ $COVERAGE -ge 95 ]; then
  echo -e "${GREEN}🎉 EXCELLENT! 95%+ coverage achieved${NC}"
elif [ $COVERAGE -ge 85 ]; then
  echo -e "${YELLOW}⚠️  GOOD. 85%+ coverage, minor gaps remain${NC}"
elif [ $COVERAGE -ge 75 ]; then
  echo -e "${YELLOW}⚠️  MODERATE. 75%+ coverage, significant work needed${NC}"
else
  echo -e "${RED}❌ CRITICAL. <75% coverage, major gaps${NC}"
fi

echo ""
echo "For detailed findings, see: docs/SECURITY_AUDIT_FINAL.md"
echo ""

exit 0
