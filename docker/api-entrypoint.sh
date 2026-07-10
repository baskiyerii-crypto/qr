#!/bin/sh
set -e

cd /app/apps/api

echo "Prisma schema sync..."
./node_modules/.bin/prisma db push --skip-generate

if [ "${RUN_DB_SEED:-false}" = "true" ]; then
  echo "Running database seed..."
  ./node_modules/.bin/prisma db seed
fi

echo "Starting API..."
exec "$@"
