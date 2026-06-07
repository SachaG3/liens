#!/bin/sh
set -e

echo "🔄 Initializing database..."
mkdir -p /app/prisma/data/uploads
npx prisma db push

if [ "${SEED_DEMO_DATA:-false}" = "true" ]; then
  USER_COUNT=$(sqlite3 /app/prisma/data/family.db "SELECT COUNT(*) FROM User;" 2>/dev/null || echo "0")

  if [ "$USER_COUNT" = "0" ]; then
    echo "📊 Demo data requested, running advanced seed script..."
    npx tsx prisma/seed-advanced.ts
  else
    echo "✅ Database already contains $USER_COUNT user(s), skipping seed."
  fi
else
  echo "✅ Demo data disabled. Register the first account from the web interface."
fi

echo "🚀 Starting application..."
exec npm start
