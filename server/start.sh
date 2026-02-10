#!/bin/sh
set -e

if [ -z "$DATABASE_URL" ]; then
  echo "DATABASE_URL not set" >&2
  exit 1
fi

npx prisma generate

if [ "$PRISMA_DB_PUSH" = "true" ]; then
  npx prisma db push
else
  npx prisma migrate deploy || npx prisma db push
fi

if [ "$SEED_ON_START" = "true" ]; then
  node prisma/seed.js || true
fi

node dist/server.js