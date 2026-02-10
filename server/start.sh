#!/bin/sh
set -e

if [ -z "$DATABASE_URL" ]; then
  echo "DATABASE_URL not set" >&2
  exit 1
fi

if [ "$PRISMA_DB_PUSH" = "true" ]; then
  npx prisma db push
else
  npx prisma migrate deploy || npx prisma db push
fi

if [ "$SEED_ON_START" != "false" ]; then
  HAS_USERS=$(node --input-type=module -e "import('@prisma/client').then(async ({PrismaClient})=>{const p=new PrismaClient();const c=await p.user.count();await p.\$disconnect();process.stdout.write(String(c));}).catch(()=>process.stdout.write('0'))")
  if [ "$HAS_USERS" = "0" ]; then
    node prisma/seed.js || true
  fi
fi

node dist/server.js
