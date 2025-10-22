#!/bin/bash
# Nightly Database Backup Script
# Run via cron: 0 2 * * * /path/to/backup-nightly.sh

set -euo pipefail

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Configuration
BACKUP_DIR="${BACKUP_DIR:-./backups}"
RETENTION_DAYS="${RETENTION_DAYS:-30}"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="yalls_backup_${TIMESTAMP}.sql"

echo -e "${YELLOW}🔄 Starting nightly backup...${NC}"
echo "Timestamp: $TIMESTAMP"
echo ""

# Check for DATABASE_URL
if [ -z "${DATABASE_URL:-}" ]; then
  echo -e "${RED}❌ DATABASE_URL environment variable not set${NC}"
  exit 1
fi

# Create backup directory
mkdir -p "$BACKUP_DIR"

# Run pg_dump
echo -e "${YELLOW}📦 Creating database dump...${NC}"
pg_dump "$DATABASE_URL" > "$BACKUP_DIR/$BACKUP_FILE"

# Compress backup
echo -e "${YELLOW}🗜️  Compressing backup...${NC}"
gzip "$BACKUP_DIR/$BACKUP_FILE"

COMPRESSED_FILE="$BACKUP_DIR/${BACKUP_FILE}.gz"
BACKUP_SIZE=$(du -h "$COMPRESSED_FILE" | cut -f1)

echo -e "${GREEN}✅ Backup created: ${BACKUP_FILE}.gz ($BACKUP_SIZE)${NC}"

# Upload to S3/R2 (if configured)
if [ -n "${AWS_ACCESS_KEY_ID:-}" ] && [ -n "${AWS_SECRET_ACCESS_KEY:-}" ] && [ -n "${S3_BUCKET:-}" ]; then
  echo -e "${YELLOW}☁️  Uploading to S3...${NC}"
  
  # Using AWS CLI or s3cmd
  if command -v aws &> /dev/null; then
    aws s3 cp "$COMPRESSED_FILE" "s3://${S3_BUCKET}/backups/database/${BACKUP_FILE}.gz"
    echo -e "${GREEN}✅ Uploaded to S3${NC}"
  else
    echo -e "${YELLOW}⚠️  AWS CLI not found, skipping S3 upload${NC}"
  fi
else
  echo -e "${YELLOW}⚠️  S3 credentials not configured, skipping cloud upload${NC}"
fi

# Cleanup old backups
echo -e "${YELLOW}🧹 Cleaning up old backups (>${RETENTION_DAYS} days)...${NC}"
find "$BACKUP_DIR" -name "yalls_backup_*.sql.gz" -type f -mtime +$RETENTION_DAYS -delete

REMAINING_BACKUPS=$(find "$BACKUP_DIR" -name "yalls_backup_*.sql.gz" -type f | wc -l)
echo -e "${GREEN}✅ Backup complete. ${REMAINING_BACKUPS} backups retained${NC}"
echo ""
echo "Backup location: $COMPRESSED_FILE"

# Send notification (if webhook configured)
if [ -n "${BACKUP_WEBHOOK_URL:-}" ]; then
  curl -X POST "$BACKUP_WEBHOOK_URL" \
    -H "Content-Type: application/json" \
    -d "{\"status\":\"success\",\"file\":\"${BACKUP_FILE}.gz\",\"size\":\"$BACKUP_SIZE\",\"timestamp\":\"$TIMESTAMP\"}"
fi

exit 0
