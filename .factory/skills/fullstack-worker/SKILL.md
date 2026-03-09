---
name: fullstack-worker
description: Full-stack feature implementation using TanStack Start, React, and Prisma
---

# Full-Stack Worker

NOTE: Startup and cleanup are handled by `worker-base`. This skill defines the WORK PROCEDURE.

## When to Use This Skill

Use this skill for features that span both frontend and backend:
- Database schema changes (Prisma models)
- Server functions (TanStack Start server functions)
- API routes and data fetching
- Full-stack pages with forms and submissions
- Integration between UI components and database

## Work Procedure

### 1. Read Context
- Read `mission.md` in missionDir
- Read `AGENTS.md` for conventions and boundaries
- Read `.factory/services.yaml` for commands
- Read relevant library files in `.factory/library/`
- Check existing code patterns in the codebase

### 2. Plan Implementation
- Identify what Prisma models need to be created/modified
- Design server functions using `createServerFn`
- Plan React components and TanStack Router routes
- Consider form validation (Zod recommended)

### 3. Write Tests First (Red)
Create failing tests before implementation:
- Unit tests for server functions (if applicable)
- Component tests for React UI
- Integration tests for full flows

Example test pattern:
```typescript
// Test server function
const result = await getProjects({});
expect(result).toBeDefined();
```

### 4. Implement (Green)
Implement in this order:
1. **Prisma Schema**: Update `prisma/schema.prisma` with models
2. **Database Migration**: Run `npm run db:migrate` or `npx prisma migrate dev`
3. **Prisma Client**: Generate client with `npm run db:generate`
4. **Server Functions**: Create in `app/routes/` or `app/server/` using `createServerFn`
5. **React Components**: Build UI in `app/routes/` following TanStack Router conventions
6. **Forms**: Use TanStack Form or React Hook Form with Zod validation

### 5. Manual Verification
- Start dev server: `npm run dev` (uses port from services.yaml)
- Verify page loads without errors
- **Test mobile responsiveness** at 375px, 768px, and 1280px viewports
- Verify touch targets are at least 44x44px on mobile
- Test all user interactions manually
- Check browser console for errors
- Verify data persists to database

### 6. Run Validators
- `npm run typecheck` - must pass
- `npm run lint` - must pass
- `npm run test` - must pass (or verify your specific tests)

### 7. Commit and Handoff
- Stage all changes
- Commit with descriptive message
- Complete handoff below

## Example Handoff

```json
{
  "salientSummary": "Implemented Partner list page with server-side data fetching. Created Prisma model queries, TanStack Start server function, and React component with Indonesian UI labels.",
  "whatWasImplemented": "Created GET /api/partners server function using createServerFn that queries Prisma partners table with pagination. Built /partners route component displaying partners in a table with columns: Nama, Email, Telepon, Tipe Mitra. Added loading state and empty state handling.",
  "whatWasLeftUndone": "",
  "verification": {
    "commandsRun": [
      { "command": "npm run typecheck", "exitCode": 0, "observation": "No TypeScript errors" },
      { "command": "npm run lint", "exitCode": 0, "observation": "No linting errors" },
      { "command": "curl http://localhost:3000/api/partners", "exitCode": 0, "observation": "Returns JSON array of partners" }
    ],
    "interactiveChecks": [
      { "action": "Navigated to /partners in browser at 375px viewport", "observed": "Page loaded with responsive layout, table scrollable horizontally or stacked as cards" },
      { "action": "Navigated to /partners at 768px viewport", "observed": "Layout adapts to tablet size" },
      { "action": "Navigated to /partners at 1280px viewport", "observed": "Full desktop layout displayed" },
      { "action": "Clicked on partner row", "observed": "Navigation to partner detail page works" }
    ]
  },
  "tests": {
    "added": [
      { "file": "app/routes/partners.test.tsx", "cases": [{ "name": "renders partner list", "verifies": "Partner data displays in table" }] }
    ]
  },
  "discoveredIssues": []
}
```

## When to Return to Orchestrator

Return to orchestrator if:
- Database connection fails and cannot be resolved
- Prisma migration conflicts with existing data
- Unclear requirements about data relationships
- Need to modify shared infrastructure (auth, config)
- Feature depends on another feature not yet implemented
