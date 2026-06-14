#!/bin/sh
set -eu

destination="${1:-liens-data-backup.tar.gz}"
container="${CONTAINER_NAME:-liens}"

docker exec "$container" sh -c '
  rm -rf /tmp/liens-backup
  mkdir -p /tmp/liens-backup/data
  cp -R /app/prisma/data/. /tmp/liens-backup/data/
  sqlite3 /app/prisma/data/family.db ".backup /tmp/liens-backup/data/family.db"
  tar -czf /tmp/liens-data-backup.tar.gz -C /tmp/liens-backup data
'
docker cp "$container":/tmp/liens-data-backup.tar.gz "$destination"
docker exec "$container" rm -rf /tmp/liens-data-backup.tar.gz /tmp/liens-backup

echo "Backup created at $destination"
