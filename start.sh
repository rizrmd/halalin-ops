#!/bin/sh
set -e

echo "Running database migrations..."
pnpm prisma migrate deploy

echo "Database migrations completed."

echo "Starting server..."
exec node --experimental-vm-modules server.js
