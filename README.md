# Uncomfirmatives

Nonconformity tracking application. Track, manage, and report on nonconformities across an organization.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 15 (App Router) |
| Frontend | React 19, TypeScript 5.7, TanStack Table v8 |
| Database | MySQL 8, Drizzle ORM |
| Deploy | Docker Compose (multi-stage build) |

## Quick Start

```bash
# Start MySQL
docker compose up -d db

# Install dependencies and run dev server
npm install
npm run dev
```

App: http://localhost:3000

## Architecture

Full-stack Next.js with layered separation: **route handler → service → schema**

```
app/
  layout.tsx                      # Root layout (sidebar + header)
  page.tsx                        # Dashboard (Server Component)
  entries/
    page.tsx                      # All entries (Client Component)
    [group]/page.tsx              # Group-filtered entries
  api/
    entries/route.ts              # GET list, POST create
    entries/stats/route.ts        # GET stats
    entries/[id]/route.ts         # GET, PUT, DELETE
    entries/[id]/status/route.ts  # PATCH status
    statuses/route.ts             # GET statuses
lib/
  db.ts                           # Drizzle client singleton
  schema.ts                       # Drizzle schema definitions
  entries.ts                      # Service layer (business logic)
  validation.ts                   # Status/severity/group validation
  types.ts                        # Shared TypeScript types
  api-client.ts                   # Client-side fetch wrapper
components/
  entry-table.tsx                 # TanStack Table
  entry-form.tsx                  # Modal form
  status-badge.tsx                # Status badge
  sidebar.tsx                     # Sidebar nav
```

## API

All under `/api`:

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /entries | List (filterable: status, severity, search) |
| POST | /entries | Create entry |
| GET | /entries/:id | Get single entry |
| PUT | /entries/:id | Update entry |
| DELETE | /entries/:id | Delete entry |
| PATCH | /entries/:id/status | Change status |
| GET | /entries/stats | Dashboard statistics |
| GET | /statuses | List available statuses |

## Database

MySQL 8 with Drizzle ORM. Schema in `lib/schema.ts`.

**Core tables:** `entries`, `statuses`, `users`

**Statuses:** open → in_progress → resolved → closed
**Severity:** minor | major | critical

## Environment Variables

Configure via `.env.local` (not committed):

| Variable | Description |
|----------|-------------|
| DB_HOST | MySQL host |
| DB_PORT | MySQL port |
| DB_NAME | Database name |
| DB_USER | Database user |
| DB_PASS | Database password |

## Production

```bash
docker compose up -d
```

Uses a multi-stage Node.js build with a non-root user (`nextjs:nodejs`).
