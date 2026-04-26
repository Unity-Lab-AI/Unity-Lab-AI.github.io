#!/usr/bin/env bash
# Backup script for the Unity AI Lab admin portal data.
# Run via cron, e.g.: 0 3 * * * /srv/unity-admin-portal/scripts/backup.sh >> /var/log/unity-backup.log 2>&1
#
# Backs up:
#   - SQLite DB at server/data/*.db
#   - File uploads at server/data/uploads/
#
# Outputs to: BACKUP_DIR/admin-portal-YYYYMMDD-HHMMSS.tar.gz
# Retains: BACKUP_KEEP_DAYS days of local backups (default 30)
# Optional: pushes to S3-compatible bucket if BACKUP_S3_BUCKET is set

set -euo pipefail

REPO_ROOT="${REPO_ROOT:-/srv/unity-admin-portal}"
BACKUP_DIR="${BACKUP_DIR:-/var/backups/unity-admin-portal}"
KEEP_DAYS="${BACKUP_KEEP_DAYS:-30}"
STAMP="$(date +%Y%m%d-%H%M%S)"
ARCHIVE="$BACKUP_DIR/admin-portal-$STAMP.tar.gz"

mkdir -p "$BACKUP_DIR"

echo "[$(date -Is)] starting backup → $ARCHIVE"

# SQLite: if WAL is in use, copy via .backup to avoid corruption
if compgen -G "$REPO_ROOT/server/data/*.db" > /dev/null; then
    for db in "$REPO_ROOT"/server/data/*.db; do
        if [ -f "$db" ]; then
            backup_file="${db}.backup-$STAMP"
            if command -v sqlite3 >/dev/null 2>&1; then
                sqlite3 "$db" ".backup '$backup_file'"
            else
                cp "$db" "$backup_file"
            fi
            mv "$backup_file" "${db}.backup"
        fi
    done
fi

# Tar everything in server/data/ + relevant configs
tar -czf "$ARCHIVE" \
    -C "$REPO_ROOT" \
    server/data \
    server/local-keys \
    2>/dev/null || true

# Cleanup the .backup files
find "$REPO_ROOT/server/data" -name "*.db.backup" -delete 2>/dev/null || true

# Local retention
find "$BACKUP_DIR" -name 'admin-portal-*.tar.gz' -mtime +"$KEEP_DAYS" -delete

# Optional: push to S3-compatible
if [ -n "${BACKUP_S3_BUCKET:-}" ] && command -v aws >/dev/null 2>&1; then
    aws s3 cp "$ARCHIVE" "s3://$BACKUP_S3_BUCKET/" \
        --endpoint-url "${BACKUP_S3_ENDPOINT:-https://s3.amazonaws.com}" \
        || echo "WARN: S3 push failed (continuing)"
fi

SIZE=$(du -h "$ARCHIVE" | awk '{print $1}')
echo "[$(date -Is)] backup complete: $ARCHIVE ($SIZE)"
