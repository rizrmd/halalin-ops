# Architecture

Architectural decisions, patterns, and conventions.

---

## Tech Stack

- **Framework**: TanStack Start (full-stack React)
- **Database ORM**: Prisma
- **Language**: TypeScript
- **Styling**: Tailwind CSS (optional)
- **Forms**: TanStack Form or React Hook Form + Zod
- **Authentication**: Session-based (signed JWT cookies)

---

## Directory Structure

```
app/
├── routes/           # TanStack Router routes
│   ├── __root.tsx    # Root layout
│   ├── index.tsx     # Home page
│   ├── login.tsx     # Login page
│   └── ...
├── server/           # Server-only code
│   ├── db.ts         # Prisma client singleton
│   ├── session.ts    # Session management
│   └── auth.ts       # Auth server functions
├── components/       # Shared React components
├── hooks/            # Custom React hooks
├── generated/        # Generated code (Prisma client)
└── styles/           # Global styles
prisma/
└── schema.prisma     # Database schema
public/               # Static assets
```

---

## Patterns

### Server Functions (TanStack Start)
Use `createServerFn` for all server-side operations:

```typescript
import { createServerFn } from '@tanstack/react-start'

export const getData = createServerFn({ method: 'GET' })
  .handler(async () => {
    // Server-side code
  })
```

### Prisma Client Singleton
Always use the singleton from `app/server/db.ts`:

```typescript
import { prisma } from '~/server/db'
```

### Route Loaders
Fetch data on load using route loaders:

```typescript
export const Route = createFileRoute('/partners')({
  component: PartnersPage,
  loader: async () => {
    return await getPartners()
  },
})
```

### Indonesian UI Labels
All user-facing text should be in Indonesian:
- "Login" → "Masuk"
- "Submit" → "Kirim"
- "Save" → "Simpan"
- "Cancel" → "Batal"
- "Partner" → "Mitra"
- "Assessment" → "Penilaian"

### Navigation Pattern
Use TanStack Router's `useRouter` hook for navigation instead of `window.location.href` to avoid full page reloads:

```typescript
import { useRouter } from '@tanstack/react-router'

function MyComponent() {
  const router = useRouter()

  const handleNavigate = () => {
    router.navigate({ to: '/partners' })
  }
}
```

### File-Based Routing Limitations
TanStack Router's file-based auto-generation has limitations with dot notation:
- Files like `partners.new.tsx` won't auto-generate routes
- Use `$` notation instead: `partners.$new.tsx`
- Or manually update `routeTree.gen.ts` if using dot notation

### Responsive Table Pattern
For data tables with mobile support:
- Desktop: Use `<table>` with proper columns
- Mobile (< 640px): Transform to card view with stacked rows
- See `app/routes/partners.tsx` for implementation reference

### Pagination Pattern
Server-side pagination with Prisma:

```typescript
const skip = (page - 1) * pageSize
const [partners, total] = await Promise.all([
  prisma.partners.findMany({ skip, take: pageSize }),
  prisma.partners.count()
])
const totalPages = Math.ceil(total / pageSize)
```
