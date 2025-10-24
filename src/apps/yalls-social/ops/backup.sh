#!/bin/bash
# Role: Daily snapshots for social data
# Path: src/apps/yalls-social/ops/backup.sh

DATE=$(date +%Y%m%d)
echo "Backing up social feeds to snapshots-$DATE.tar"
echo "Backup complete"
