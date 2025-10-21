#!/usr/bin/env bash
set -euo pipefail

# scripts/setup-branches-and-lockfile.sh
# Usage:
#   REMOTE=origin BASE=main ./scripts/setup-branches-and-lockfile.sh
#   REMOTE=origin BASE=main ./scripts/setup-branches-and-lockfile.sh --trigger-lockfile
#
# What it does:
# - Ensures local BASE branch is up-to-date
# - Creates/pushes: staging, feature/ui-polish, feature/tenant-security,
#   feature/search-isolation, feature/job-queue, feature/observability
# - If --trigger-lockfile is passed, triggers the fix-lockfile.yml workflow (does not wait)
#
# Requirements: git and gh in PATH. Caller must have push rights to $REMOTE.
# NOTE: This script will refuse to run if there are uncommitted changes in your working tree.

REMOTE="${REMOTE:-origin}"
BASE="${BASE:-main}"
TRIGGER_LOCKFILE=false

for arg in "$@"; do
  case "$arg" in
    --trigger-lockfile) TRIGGER_LOCKFILE=true ;;
    -h|--help)
      sed -n '1,120p' "$0"
      exit 0
      ;;
  esac
done

BRANCHES=(
  "staging"
  "feature/ui-polish"
  "feature/tenant-security"
  "feature/search-isolation"
  "feature/job-queue"
  "feature/observability"
)

echo "Remote: $REMOTE"
echo "Base:   $BASE"
echo "Branches to ensure: ${BRANCHES[*]}"
echo

# Safety: require a clean working tree
if [ -n "$(git status --porcelain)" ]; then
  echo "ERROR: Working tree is not clean. Commit or stash changes before running this script."
  git status --porcelain
  exit 1
fi

# Ensure git and remote are reachable
if ! command -v git >/dev/null 2>&1; then
  echo "ERROR: git is not installed or not in PATH."
  exit 1
fi

if ! git remote get-url "$REMOTE" >/dev/null 2>&1; then
  echo "ERROR: remote '$REMOTE' not found. Run 'git remote -v' to list remotes."
  exit 1
fi

echo "Fetching $REMOTE..."
git fetch "$REMOTE" --prune

echo "Checking out and syncing base branch: $BASE"
if git rev-parse --verify "$BASE" >/dev/null 2>&1; then
  git checkout "$BASE"
else
  # If local BASE doesn't exist, create it tracking remote if available
  if git ls-remote --exit-code --heads "$REMOTE" "refs/heads/$BASE" >/dev/null 2>&1; then
    git checkout -b "$BASE" "$REMOTE/$BASE"
  else
    echo "ERROR: base branch '$BASE' not found locally or on $REMOTE"
    exit 1
  fi
fi

git pull --ff-only "$REMOTE" "$BASE" || {
  echo "Failed to fast-forward $BASE from $REMOTE/$BASE — resolve locally and re-run."
  exit 1
}

# Create or set upstream for each branch
for branch in "${BRANCHES[@]}"; do
  echo
  echo "----"
  echo "Ensuring branch: $branch"

  # If remote branch exists
  if git ls-remote --exit-code --heads "$REMOTE" "refs/heads/$branch" >/dev/null 2>&1; then
    echo "Remote branch $REMOTE/$branch exists."
    if git show-ref --verify --quiet "refs/heads/$branch"; then
      echo "Local branch $branch exists. Setting upstream to $REMOTE/$branch"
      git branch --set-upstream-to="$REMOTE/$branch" "$branch" || true
    else
      echo "Checking out local branch $branch tracking $REMOTE/$branch"
      git checkout -b "$branch" "$REMOTE/$branch"
    fi
  else
    echo "Remote branch $REMOTE/$branch does not exist. Creating from $BASE..."
    git checkout -b "$branch" "$BASE"
    echo "Pushing $branch to $REMOTE and setting upstream..."
    git push -u "$REMOTE" "$branch"
  fi
done

# Return to base branch
echo
git checkout "$BASE"
echo "Done. Current branch: $(git rev-parse --abbrev-ref HEAD)"

if [ "$TRIGGER_LOCKFILE" = true ]; then
  if ! command -v gh >/dev/null 2>&1; then
    echo "WARNING: gh CLI not found; cannot trigger fix-lockfile workflow. Install GitHub CLI or run manually:"
    echo "  gh workflow run fix-lockfile.yml"
    exit 0
  fi

  echo
  echo "Triggering fix-lockfile.yml workflow (this will regenerate lockfile)."
  echo "Note: this command triggers the workflow but does not wait for it to complete."
  gh workflow run fix-lockfile.yml || {
    echo "gh workflow run failed. You can trigger manually: gh workflow run fix-lockfile.yml"
    exit 1
  }

  echo "Workflow triggered. Check Actions → Fix Lockfile to monitor progress."
fi

echo
echo "Script complete. Next steps:"
echo "- If you triggered the lockfile workflow, wait for it to finish and merge the generated lockfile PR."
echo "- If not, run the fix workflow manually: gh workflow run fix-lockfile.yml"
echo "- After lockfile is fixed/merged, re-run CI or merge feature PRs into staging as usual."
