#!/bin/sh
set -e

echo "Prisma şema senkronizasyonu..."
npx prisma db push --skip-generate

if [ "${RUN_DB_SEED:-false}" = "true" ]; then
  echo "Veritabanı seed çalıştırılıyor..."
  npx prisma db seed
fi

echo "API başlatılıyor..."
exec "$@"
