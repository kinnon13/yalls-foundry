#!/bin/bash
# Role: Daily backup of Yallbrary app registry and pins
# Path: yalls-inc/yallbrary/ops/backup.sh
# Usage: cron: 0 2 * * * /path/to/backup.sh

set -e

BACKUP_DIR="yalls-inc/yallbrary/archive/backups"
DATE=$(date +%Y-%m-%d)
BACKUP_FILE="$BACKUP_DIR/yallbrary-$DATE.sql"

mkdir -p "$BACKUP_DIR"

echo "💾 Backing up Yallbrary data..."

# Export yallbrary_apps and yallbrary_pins tables
pg_dump -h "$SUPABASE_DB_HOST" -U postgres \
  -t yallbrary_apps -t yallbrary_pins \
  > "$BACKUP_FILE"

gzip "$BACKUP_FILE"

echo "✅ Backup saved: $BACKUP_FILE.gz"

# Keep only last 7 days
find "$BACKUP_DIR" -name "yallbrary-*.sql.gz" -mtime +7 -delete
