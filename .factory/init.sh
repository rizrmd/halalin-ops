#!/bin/bash
set -e

# Init script for Halal Form mission
# Idempotent setup for development environment

echo "=== Halal Form Mission Setup ==="

# Check Node.js version
NODE_VERSION=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 20 ]; then
  echo "ERROR: Node.js 20+ required. Found: $(node --version)"
  exit 1
fi
echo "✓ Node.js version: $(node --version)"

# Check for pnpm
if ! command -v pnpm &> /dev/null; then
  echo "Installing pnpm..."
  npm install -g pnpm
fi
echo "✓ pnpm version: $(pnpm --version)"

# Check for existing TanStack Start project
if [ ! -f "package.json" ]; then
  echo "⚠ No package.json found. Project needs to be initialized."
  echo "   Run: npm create @tanstack/start@latest"
  exit 1
fi

# Install dependencies if node_modules missing
if [ ! -d "node_modules" ]; then
  echo "Installing dependencies..."
  pnpm install
fi
echo "✓ Dependencies installed"

# Check for .env file
if [ ! -f ".env" ]; then
  if [ -f ".env.example" ]; then
    echo "Creating .env from .env.example..."
    cp .env.example .env
  else
    echo "⚠ No .env file found. Please create one with DATABASE_URL"
  fi
fi

# Check for Prisma schema
if [ -f "prisma/schema.prisma" ]; then
  echo "✓ Prisma schema exists"

  # Generate Prisma client
  echo "Generating Prisma client..."
  npx prisma generate

  # Check database connection
  echo "Checking database connection..."
  if npx prisma db execute --stdin <<< "SELECT 1;" > /dev/null 2>&1; then
    echo "✓ Database connection successful"
  else
    echo "⚠ Database connection failed. Check DATABASE_URL in .env"
  fi
else
  echo "⚠ Prisma schema not found. Database setup needed."
fi

echo "=== Setup Complete ==="
