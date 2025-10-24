#!/bin/bash
# Backup business ops data (invoices, contacts, expenses)
# Run daily via cron: 0 3 * * * /path/to/backup-ops.sh

set -e

TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/backups/business-ops"
DB_URL="${SUPABASE_DB_URL:-postgresql://postgres:password@localhost:5432/postgres}"

mkdir -p "$BACKUP_DIR"

echo "[backup-ops] Starting backup at $TIMESTAMP"

# Dump business tables
pg_dump "$DB_URL" \
  --table=crm_contacts \
  --table=invoices \
  --table=business_expenses \
  --table=business_metrics \
  --no-owner \
  --no-acl \
  --file="$BACKUP_DIR/business_ops_$TIMESTAMP.sql"

# Compress
gzip "$BACKUP_DIR/business_ops_$TIMESTAMP.sql"

# Cleanup old backups (keep 30 days)
find "$BACKUP_DIR" -name "business_ops_*.sql.gz" -mtime +30 -delete

echo "[backup-ops] Backup complete: business_ops_$TIMESTAMP.sql.gz"
echo "[backup-ops] Size: $(du -h $BACKUP_DIR/business_ops_$TIMESTAMP.sql.gz | cut -f1)"
