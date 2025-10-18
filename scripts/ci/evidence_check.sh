#!/usr/bin/env bash
set -euo pipefail

RED=$'\e[31m'; GRN=$'\e[32m'; YLW=$'\e[33m'; NC=$'\e[0m'
fail() { echo "${RED}✗ $*${NC}"; exit 1; }
ok()   { echo "${GRN}✓ $*${NC}"; }
warn() { echo "${YLW}⚠ $*${NC}"; }

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"

# -------------------------------
# 0) Locate evidence folder
# -------------------------------
EVIDENCE_DIR="${EVIDENCE_DIR:-}"
if [[ -z "${EVIDENCE_DIR}" ]]; then
  set +e
  EVIDENCE_DIR="$(ls -d "${ROOT_DIR}"/docs/release/EVIDENCE-* 2>/dev/null | head -n1)"
  set -e
fi
[[ -n "${EVIDENCE_DIR}" ]] || fail "No evidence folder found in docs/release/EVIDENCE-*"
[[ -d "${EVIDENCE_DIR}" ]] || fail "Evidence path does not exist: ${EVIDENCE_DIR}"
ok "Evidence folder: ${EVIDENCE_DIR}"

# -------------------------------
# 1) Config presence & validity
# -------------------------------
CFG="${ROOT_DIR}/configs/area-discovery.json"
[[ -f "${CFG}" ]] || fail "Missing configs/area-discovery.json"
jq empty "${CFG}" || fail "Invalid JSON: configs/area-discovery.json"
ok "configs/area-discovery.json present & valid"

# -------------------------------
# 2) Evidence pack contents
# -------------------------------
[[ -f "${EVIDENCE_DIR}/README.md" ]] || fail "Missing ${EVIDENCE_DIR}/README.md"

VIDEO_COUNT="$(find "${EVIDENCE_DIR}" -type f \( -iname '*.mp4' -o -iname '*.webm' \) | wc -l | tr -d ' ')"
PNG_COUNT="$(find "${EVIDENCE_DIR}" -type f -iname '*.png' | wc -l | tr -d ' ')"

[[ "${VIDEO_COUNT}" -ge 1 ]] || fail "Need ≥1 demo video (.mp4/.webm); found ${VIDEO_COUNT}"
[[ "${PNG_COUNT}"   -ge 4 ]] || fail "Need ≥4 screenshots (.png); found ${PNG_COUNT}"
ok "Evidence includes ${VIDEO_COUNT} video(s) and ${PNG_COUNT} screenshot(s)"

# -------------------------------
# 3) Live HTTP checks (PostgREST RPCs)
# -------------------------------
if [[ "${SKIP_HTTP_TESTS:-0}" == "1" ]]; then
  warn "Skipping HTTP tests (SKIP_HTTP_TESTS=1)"
else
  : "${API_BASE_URL:?Missing API_BASE_URL}"
  : "${API_TOKEN:?Missing API_TOKEN}"
  HDRS=(-H "Authorization: Bearer ${API_TOKEN}" -H "Content-Type: application/json")
  [[ -n "${API_ANON_KEY:-}" ]] && HDRS+=(-H "apikey: ${API_ANON_KEY}")

  # 3.1 Theme override round-trip
  if command -v openssl >/dev/null 2>&1; then
    NEW_COLOR="#$(openssl rand -hex 3)"
  else
    NEW_COLOR="$(printf '#%06X\n' $((RANDOM*RANDOM%16777215)))"
  fi

  SUBJECT_TYPE="user"
  SUBJECT_ID="${TEST_USER_ID:?Missing TEST_USER_ID}"

  echo "→ Setting theme override to ${NEW_COLOR}"
  HTTP_SET_CODE="$(curl -sS -o /dev/null -w "%{http_code}" "${HDRS[@]}" -X POST \
    "${API_BASE_URL%/}/rpc/set_theme_overrides" \
    -d "{\"subject_type\":\"${SUBJECT_TYPE}\",\"subject_id\":\"${SUBJECT_ID}\",\"tokens\":{\"brand\":{\"primary\":\"${NEW_COLOR}\"}}}")"
  [[ "${HTTP_SET_CODE}" =~ ^20[04]$ ]] || fail "set_theme_overrides failed (HTTP ${HTTP_SET_CODE})"

  RESP_GET="$(curl -sS "${HDRS[@]}" -X POST \
    "${API_BASE_URL%/}/rpc/get_theme" \
    -d "{\"subject_type\":\"${SUBJECT_TYPE}\",\"subject_id\":\"${SUBJECT_ID}\"}")"
  echo "${RESP_GET}" | jq -e ".tokens.brand.primary == \"${NEW_COLOR}\"" >/dev/null \
    || fail "Theme round-trip mismatch. Expected ${NEW_COLOR}"
  ok "Theme override round-trip OK (${NEW_COLOR})"

  # 3.2 NBA: recommend modules
  ENTITY_ID="${TEST_ENTITY_ID:?Missing TEST_ENTITY_ID}"
  NBA_RESP="$(curl -sS "${HDRS[@]}" -X GET \
    "${API_BASE_URL%/}/rpc/recommend_workspace_modules?entity_id=${ENTITY_ID}")"
  NBA_LEN="$(echo "${NBA_RESP}" | jq 'length' 2>/dev/null || echo 0)"
  [[ "${NBA_LEN}" -ge 1 ]] || fail "recommend_workspace_modules returned empty"
  ok "NBA recommendations present (${NBA_LEN})"

  # 3.3 KPIs present
  KPI_RESP="$(curl -sS "${HDRS[@]}" -X GET \
    "${API_BASE_URL%/}/rpc/get_workspace_kpis?entity_id=${ENTITY_ID}&horizon=30d")"
  KPI_TILES="$(echo "${KPI_RESP}" | jq -r '.tiles // empty | length')"
  [[ -n "${KPI_TILES}" && "${KPI_TILES}" -ge 1 ]] || fail "get_workspace_kpis has no tiles"
  ok "Workspace KPI tiles present (${KPI_TILES})"
fi

# -------------------------------
# 4) RLS denial across workspaces
# -------------------------------
if [[ "${SKIP_DB_TESTS:-0}" == "1" ]]; then
  warn "Skipping DB/RLS tests (SKIP_DB_TESTS=1)"
else
  : "${PG_CONNECTION:?Missing PG_CONNECTION}"
  : "${TEST_USER_ID:?Missing TEST_USER_ID}"
  : "${TEST_ENTITY_ID:?Missing TEST_ENTITY_ID}"
  : "${TEST_FOREIGN_ENTITY_ID:?Missing TEST_FOREIGN_ENTITY_ID}"

  psql "${PG_CONNECTION}" -v ON_ERROR_STOP=1 \
    -v user_id="${TEST_USER_ID}" \
    -v own_entity="${TEST_ENTITY_ID}" \
    -v foreign_entity="${TEST_FOREIGN_ENTITY_ID}" \
    -f "${ROOT_DIR}/scripts/ci/rls_test.sql" >/dev/null

  ok "RLS tests passed (owned rows visible, foreign rows denied)"
fi

echo
ok "All CI evidence & API checks passed 🎉"
