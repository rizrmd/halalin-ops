# Halalin Ops

TanStack Start application for partner onboarding, interviews, and halal assessment workflows.

## Getting started

```bash
npm install
npm run dev
```

Build and test:

```bash
npm run build
npm run test
```

## Project structure

```text
app/        application routes, UI, and server functions
database/   raw schema and seed SQL files
docs/       project and database documentation
prisma/     Prisma schema
public/     static assets
archive/    archived scaffold and backup files
```

## Application layout

- Routes live in `app/routes`
- Shared UI components live in `app/components`
- Server-side logic lives in `app/server`
- Global styles live in `app/styles.css`

The app entrypoint is `app/client.tsx`, and file-based routing is generated into `app/routeTree.gen.ts`.

## Database files

- Main schema: `database/schema.sql`
- Assessment seeds: `database/seed_assessment_questions.sql`
- Scoring seeds: `database/seed_scoring_criteria.sql`
- Example project seed: `database/seed_sppg_mabes_polri.sql`

Additional implementation notes are in `docs/DATABASE.md` and `docs/IMPLEMENTATION_SUMMARY.md`.
