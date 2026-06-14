#!/bin/sh
set -eu

destination="${1:-liens-data-backup.tar.gz}"

docker compose exec -T liens sh -c '
  rm -rf /tmp/liens-backup
  mkdir -p /tmp/liens-backup/data
  cp -R /app/prisma/data/. /tmp/liens-backup/data/
  sqlite3 /app/prisma/data/family.db ".backup /tmp/liens-backup/data/family.db"
  tar -czf /tmp/liens-data-backup.tar.gz -C /tmp/liens-backup data
'
container_id="$(docker compose ps -q liens)"
docker cp "$container_id":/tmp/liens-data-backup.tar.gz "$destination"
docker compose exec -T liens rm -rf /tmp/liens-data-backup.tar.gz /tmp/liens-backup

echo "Sauvegarde créée dans $destination"
