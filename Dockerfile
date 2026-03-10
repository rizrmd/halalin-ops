# syntax=docker/dockerfile:1

# =============================================
# Stage 1: Builder
# =============================================
FROM node:22-alpine AS builder
WORKDIR /app

# Install system dependencies needed for build
RUN apk add --no-cache libc6-compat

# Install pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

# Copy package files first for better layer caching
COPY package.json pnpm-lock.yaml ./

# Install all dependencies (including devDependencies for build)
RUN pnpm install --frozen-lockfile

# Copy source code
COPY . .

# Generate Prisma client before build
RUN pnpm prisma generate

# Build-time environment variables (Vite needs these during build)
ARG VITE_API_URL
ARG VITE_BETTER_AUTH_URL
ENV VITE_API_URL=${VITE_API_URL}
ENV VITE_BETTER_AUTH_URL=${VITE_BETTER_AUTH_URL}
ENV NODE_ENV=production

# Build the application
RUN pnpm build

# =============================================
# Stage 2: Production Runner
# =============================================
FROM node:22-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV COREPACK_ENABLE_STRICT=0

# Install curl for healthchecks and install pnpm globally
RUN apk add --no-cache curl && npm install -g pnpm@latest

# Copy package files
COPY package.json pnpm-lock.yaml ./

# Install ONLY production dependencies
RUN pnpm install --frozen-lockfile --prod

# Copy built artifacts from builder
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
COPY server.js ./server.js
COPY start.sh ./start.sh
RUN chmod +x ./start.sh

# Generate Prisma client in production (needed for runtime)
RUN pnpm prisma generate

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Copy docker-entrypoint.sh from node image
COPY --from=node:22-alpine /usr/local/bin/docker-entrypoint.sh /usr/local/bin/

# Change ownership of app files
RUN chown -R nodejs:nodejs /app

# Set HOME to /app to avoid permission issues with nodejs user home directory
ENV HOME=/app

USER nodejs

# Expose the default TanStack Start port
EXPOSE 3000

# Set port via environment variable
ENV PORT=3000

# Health check to ensure server is running
HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
  CMD curl -f http://localhost:${PORT}/health || exit 1

# Use entrypoint script for proper signal handling
ENTRYPOINT ["docker-entrypoint.sh"]

# Run migrations and start the server
CMD ["./start.sh"]
