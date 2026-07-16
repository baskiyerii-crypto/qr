#!/bin/sh
set -e

cd /app/apps/api

echo "Prisma schema sync..."
max_retries=10
count=1
success=false

while [ $count -le $max_retries ]; do
  echo "Prisma db push: Connection attempt $count of $max_retries..."
  if ./node_modules/.bin/prisma db push --skip-generate; then
    success=true
    break
  fi
  echo "Database connection failed or not ready. Retrying in 5 seconds..."
  sleep 5
  count=$((count + 1))
done

if [ "$success" = "false" ]; then
  echo "Error: Prisma could not connect to the database after $max_retries attempts. Exiting."
  exit 1
fi

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
