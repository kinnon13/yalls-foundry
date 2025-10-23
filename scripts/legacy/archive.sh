#!/usr/bin/env bash
set -euo pipefail

usage() {
  cat <<'EOF'
Usage:
  scripts/archive.sh [--dry-run] [--list-from <file>] <path> [<path>...]

Moves files/dirs to archive/<timestamp>/… using `git mv` so nothing is lost.

Options:
  --dry-run            Print what would happen, do not change anything
  --list-from <file>   Read newline-separated paths from a file (can combine with args)

Examples:
  scripts/archive.sh src/routes/rocker-hub.tsx src/pages/Login.tsx
  scripts/archive.sh --list-from cleanup-list.txt
  scripts/archive.sh --dry-run src/routes/dashboard-v2.tsx
EOF
}

DRY_RUN=0
LIST_FILE=""

# Parse args
ARGS=()
while [[ $# -gt 0 ]]; do
  case "$1" in
    --dry-run) DRY_RUN=1; shift;;
    --list-from) LIST_FILE="$2"; shift 2;;
    -h|--help) usage; exit 0;;
    *) ARGS+=("$1"); shift;;
  esac
done

# Guard rails
if [[ ! -d .git ]]; then
  echo "Error: run from repo root (no .git found)" >&2; exit 1
fi

# Build list
TO_ARCHIVE=()
if [[ -n "$LIST_FILE" ]]; then
  if [[ ! -f "$LIST_FILE" ]]; then
    echo "Error: list file '$LIST_FILE' not found" >&2; exit 1
  fi
  while IFS= read -r line; do
    [[ -z "$line" || "$line" =~ ^# ]] && continue
    TO_ARCHIVE+=("$line")
  done < "$LIST_FILE"
fi
TO_ARCHIVE+=("${ARGS[@]}")

if [[ ${#TO_ARCHIVE[@]} -eq 0 ]]; then
  usage; exit 1
fi

TS="$(date +%Y%m%d-%H%M%S)"
BASE="archive/$TS"

echo "Archiving to: $BASE"
[[ $DRY_RUN -eq 0 ]] && mkdir -p "$BASE"

for p in "${TO_ARCHIVE[@]}"; do
  if [[ ! -e "$p" ]]; then
    echo "WARN: path not found: $p" >&2
    continue
  fi
  # Preserve relative structure under archive/<ts>/
  DEST="$BASE/$p"
  echo "• $p  ->  $DEST"
  if [[ $DRY_RUN -eq 0 ]]; then
    mkdir -p "$(dirname "$DEST")"
    git mv -k "$p" "$DEST" || cp -r "$p" "$DEST"
  fi
done

if [[ $DRY_RUN -eq 1 ]]; then
  echo "Dry-run complete. No changes made."
else
  echo "Done. Review with: git status"
  echo "Commit with: git commit -m \"chore(archive): move legacy files to $BASE\""
fi
