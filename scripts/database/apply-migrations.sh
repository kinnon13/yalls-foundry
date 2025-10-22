#!/usr/bin/env bash
# Apply database migrations to a target database
# Usage: ./scripts/db/apply-migrations.sh <db-url>
#    or: DATABASE_URL=... ./scripts/db/apply-migrations.sh

set -euo pipefail

DB_URL=${1:-${DATABASE_URL:-}}
: "${DB_URL:?DB connection string required as first arg or DATABASE_URL env var}"

GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}Applying migrations to database...${NC}"
echo ""

# Find all migration files in order
MIGRATION_DIR="supabase/migrations"

if [ ! -d "$MIGRATION_DIR" ]; then
  echo "No migrations directory found at $MIGRATION_DIR"
  exit 0
fi

# Apply each migration file
for migration in "$MIGRATION_DIR"/*.sql; do
  if [ -f "$migration" ]; then
    echo -e "${BLUE}Applying: $(basename "$migration")${NC}"
    psql "$DB_URL" -f "$migration" || {
      echo "❌ Migration failed: $migration"
      exit 1
    }
  fi
done

echo ""
echo -e "${GREEN}✅ All migrations applied successfully${NC}"
