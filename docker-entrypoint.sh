#!/bin/sh
set -eu

database_url="${DATABASE_URL:-file:./data/family.db}"
case "$database_url" in
  file:/*) database="${database_url#file:}" ;;
  file:*) database="/app/prisma/${database_url#file:}" ;;
  *)
    echo "DATABASE_URL doit désigner un fichier SQLite."
    exit 1
    ;;
esac

echo "Initialisation de la base de données..."
mkdir -p "$(dirname "$database")" /app/prisma/data/uploads
chown -R node:node /app/prisma/data
chown -R node:node "$(dirname "$database")"
su-exec node:node touch "$database"

has_user_table="$(sqlite3 "$database" "SELECT COUNT(*) FROM sqlite_master WHERE type='table' AND name='User';" 2>/dev/null || echo 0)"
has_migrations_table="$(sqlite3 "$database" "SELECT COUNT(*) FROM sqlite_master WHERE type='table' AND name='_prisma_migrations';" 2>/dev/null || echo 0)"

if [ "$has_user_table" = "1" ] && [ "$has_migrations_table" = "0" ]; then
  echo "Base existante détectée, enregistrement de la migration initiale..."
  su-exec node:node ./node_modules/.bin/prisma migrate resolve --applied 20260614000000_initial
fi

su-exec node:node ./node_modules/.bin/prisma migrate deploy

if [ "${SEED_DEMO_DATA:-false}" = "true" ]; then
  USER_COUNT=$(sqlite3 "$database" "SELECT COUNT(*) FROM User;" 2>/dev/null || echo "0")

  if [ "$USER_COUNT" = "0" ]; then
    echo "Données de démonstration demandées, lancement du seed..."
    su-exec node:node ./node_modules/.bin/tsx prisma/seed-advanced.ts
  else
    echo "La base contient déjà $USER_COUNT utilisateur(s), seed ignoré."
  fi
else
  echo "Données de démonstration désactivées."
fi

echo "Démarrage de l'application..."
exec su-exec node:node node server.js
