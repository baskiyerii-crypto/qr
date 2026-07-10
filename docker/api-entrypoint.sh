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
  if ! ./node_modules/.bin/prisma db seed; then
    echo "Prisma seed failed, retrying with ts-node..."
    node ../../node_modules/ts-node/dist/bin.js --transpile-only prisma/seed.ts
  fi
fi

echo "Starting API..."
exec "$@"
