#!/bin/sh
set -e

cd /app

echo "Prisma schema sync..."
pnpm --filter @qr/api exec prisma db push --skip-generate

if [ "${RUN_DB_SEED:-false}" = "true" ]; then
  echo "Running database seed..."
  pnpm --filter @qr/api exec prisma db seed
fi

cd /app/apps/api
echo "Starting API..."
exec "$@"
