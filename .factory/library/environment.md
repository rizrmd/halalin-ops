# Environment

Environment variables, external dependencies, and setup notes.

**What belongs here:** Required env vars, external API keys/services, dependency quirks, platform-specific notes.
**What does NOT belong here:** Service ports/commands (use `.factory/services.yaml`).

---

## Required Environment Variables

### Database
- `DATABASE_URL` - PostgreSQL connection string
  - Format: `postgresql://USER:PASSWORD@HOST:PORT/DATABASE`
  - Current: `postgres://postgres:KL2JakkTud553R4PODGA86zsKojBGDxkajE7YT4RvptZlTeErt2f4ZTONB4nYyLq@103.150.81.71:6647/halal-nova`

### Authentication
- `SESSION_SECRET` - Secret key for JWT signing (generate with `openssl rand -base64 32`)

### Optional
- `NODE_ENV` - Set to `production` in production
- `PORT` - Server port (default: 3000)

---

## External Dependencies

### PostgreSQL Database
- **Host**: 103.150.81.71:6647
- **Database**: halal-nova
- **Status**: External managed database
- **Notes**: Already contains schema from schema.sql

---

## Dependency Quirks

### TanStack Start + Prisma
- Uses `@prisma/adapter-pg` for PostgreSQL adapter
- Generated client output to `app/generated/prisma`
- Need singleton pattern for PrismaClient in server functions
