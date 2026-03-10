# Halalin Ops - TanStack Start Application

## Deployment

To deploy this application, use Coolify via SSH:

```bash
ssh root@103.150.81.71
```

**App ID:** `ec40os4sgkcgk044ggc88o8w`

## Project Structure

This is a **TanStack Start** full-stack React application with the following structure:

```
halalin-ops/
├── app/                    # Main application code
│   ├── client.tsx         # Client entry point
│   ├── ssr.tsx            # Server-side rendering entry
│   ├── router.tsx         # TanStack Router configuration
│   ├── routes/            # Application routes
│   │   ├── __root.tsx     # Root layout
│   │   ├── index.tsx      # Home page
│   │   ├── login.tsx      # Login page
│   │   └── ...            # Other routes
│   ├── components/        # React components
│   │   └── Header.tsx     # Navigation header
│   ├── server/            # Server-side code
│   │   ├── auth.ts        # Authentication functions
│   │   ├── session.ts     # Session management
│   │   └── db.ts          # Database connection
│   └── utils/             # Utility functions
├── prisma/
│   ├── schema.prisma      # Database schema
│   └── seed.js            # Database seeding script
├── public/                # Static assets
│   └── halalin-logo.png   # Logo image
├── server.js              # Custom HTTP server
├── start.sh               # Startup script (migrations + server)
├── Dockerfile             # Docker build configuration
├── vite.config.ts         # Vite configuration
└── package.json           # Dependencies and scripts
```

## Technology Stack

- **Framework:** TanStack Start (React + Vite)
- **Router:** TanStack Router
- **Styling:** Tailwind CSS 4
- **Database:** PostgreSQL with Prisma ORM
- **Authentication:** JWT-based sessions
- **Server:** Node.js custom HTTP server

## Common Development Tasks

### Adding a New Route

1. Create a new file in `app/routes/`:

```typescript
// app/routes/my-page.tsx
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/my-page')({
  component: MyPage,
})

function MyPage() {
  return <div>My Page Content</div>
}
```

2. Run `pnpm dev` to auto-generate route types

### Adding a Server Function

Create server functions in `app/server/`:

```typescript
// app/server/my-feature.ts
import { createServerFn } from '@tanstack/react-start'

export const myServerFunction = createServerFn({ method: 'POST' })
  .inputValidator((data: unknown): { name: string } => {
    // Validate input
    if (typeof data !== 'object' || data === null) {
      throw new Error('Invalid input')
    }
    const { name } = data as Record<string, unknown>
    if (typeof name !== 'string') {
      throw new Error('Name must be a string')
    }
    return { name }
  })
  .handler(async ({ data }): Promise<{ success: boolean }> => {
    // Your server logic here
    console.log('Hello', data.name)
    return { success: true }
  })
```

### Database Schema Changes

1. Modify `prisma/schema.prisma`

2. Generate migration:
```bash
pnpm prisma migrate dev --name add_new_feature
```

3. Update seed script if needed in `prisma/seed.js`

4. Deploy (migrations run automatically on startup)

### Adding Static Assets

Place files in `public/` directory:
- Images: `public/images/my-image.png`
- Fonts: `public/fonts/my-font.woff2`

Access via root path: `/images/my-image.png`

### Environment Variables

**Build-time (used during `vite build`):**
- `VITE_API_URL` - API endpoint URL
- `VITE_BETTER_AUTH_URL` - Auth endpoint URL

**Runtime (used by server):**
- `DATABASE_URL` - PostgreSQL connection string
- `SESSION_SECRET` - JWT signing secret (generate with `openssl rand -base64 32`)
- `PORT` - Server port (default: 3000)
- `NODE_ENV` - Environment (production/development)

## Deployment Process

The deployment uses Docker with Coolify:

1. **Local Development:**
   ```bash
   pnpm install
   pnpm dev
   ```

2. **Build & Deploy:**
   ```bash
   # Push to GitHub (Coolify auto-deploys)
   git add .
   git commit -m "Your changes"
   git push origin master
   ```

3. **Manual Server Commands (if needed):**
   ```bash
   ssh root@103.150.81.71
   cd /data/coolify/applications/ec40os4sgkcgk044ggc88o8w
   
   # View logs
   docker compose logs -f
   
   # Restart
   docker compose restart
   
   # Check database
   docker exec ec40os4sgkcgk044ggc88o8w-095259380128 pnpm prisma studio
   ```

## Key Files Reference

### server.js
Custom HTTP server that:
- Serves static files from `dist/client/`
- Handles health checks at `/health`
- Forwards all other requests to TanStack Start SSR handler
- Properly handles POST request bodies

### start.sh
Container startup script:
1. Runs `prisma migrate deploy` (or `prisma db push` if migrations fail)
2. Seeds database with `pnpm db:seed`
3. Starts Node.js server

### Dockerfile
Multi-stage build:
1. **Builder stage:** Compiles TypeScript, builds Vite app
2. **Runner stage:** Production image with only necessary files

### vite.config.ts
Vite + TanStack Start configuration:
- TanStack Start plugin with custom entry points
- Tailwind CSS plugin
- React plugin
- Path aliases (e.g., `#/*` maps to `app/*`)

## Important Notes

- **Database:** PostgreSQL is hosted separately by Coolify
- **Sessions:** Stored in HTTP-only cookies with JWT
- **File Uploads:** Currently not configured (would need cloud storage)
- **Static Assets:** Served from memory cache in production

## Troubleshooting

### Login Issues
Check admin password:
```bash
docker exec ec40os4sgkcgk044ggc88o8w-095259380128 curl -s http://localhost:3000/api/debug/admin
```

### Database Connection
Verify database is running:
```bash
docker ps | grep postgres
docker logs j4ckwgsgccks8s8wk4g044sw
```

### Disk Space Issues
Clean Docker:
```bash
docker system prune -af --volumes
```

### Container Won't Start
Check logs:
```bash
docker logs ec40os4sgkcgk044ggc88o8w-095259380128
```

