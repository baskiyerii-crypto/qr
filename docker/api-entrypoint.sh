#!/bin/sh
set -e

cd /app/apps/api

echo "Prisma schema sync..."
./node_modules/.bin/prisma db push --skip-generate

should_seed=false
if [ "${RUN_DB_SEED:-false}" = "true" ]; then
  should_seed=true
else
  user_count=$(node -e '
    const { PrismaClient } = require("@prisma/client");
    const prisma = new PrismaClient();
    prisma.user.count()
      .then((n) => { console.log(n); })
      .catch(() => { console.log(-1); })
      .finally(() => prisma.$disconnect());
  ' 2>/dev/null | tail -1)
  if [ "$user_count" = "0" ]; then
    echo "Database empty — running seed..."
    should_seed=true
  fi
fi

if [ "$should_seed" = "true" ]; then
  echo "Running database seed..."
  node --experimental-strip-types prisma/seed.ts
fi

echo "Starting API..."
exec "$@"
