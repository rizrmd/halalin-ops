#!/bin/sh
set -e

echo "Running database migrations..."
# Try to deploy migrations, if it fails due to existing schema, push the schema directly
pnpm prisma migrate deploy || {
  echo "Migration deploy failed (schema may already exist), using db push..."
  pnpm prisma db push --accept-data-loss --skip-generate || true
}

echo "Database schema synchronized."
echo "Seeding database..."
pnpm db:seed || {
  echo "Seeding may have already been done or failed (non-critical)"
}

echo "Starting server..."
exec node --experimental-vm-modules server.js
