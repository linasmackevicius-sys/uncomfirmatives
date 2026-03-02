# uncomfirmatives

Nonconformity tracking. Next.js full-stack app.
Next.js 15 (App Router) / React 19 / TS 5.7 / Drizzle ORM / PostgreSQL / TanStack Table v8

## Structure

```
app/
  layout.tsx                    # Root layout (sidebar + header)
  page.tsx                      # Dashboard (Server Component)
  globals.css                   # All styling
  entries/
    page.tsx                    # All Entries (Client Component)
    [group]/page.tsx            # Group-filtered entries
  api/
    entries/route.ts            # GET list, POST create
    entries/stats/route.ts      # GET stats
    entries/[id]/route.ts       # GET, PUT, DELETE
    entries/[id]/status/route.ts # PATCH status
    statuses/route.ts           # GET statuses
lib/
  db.ts                         # Drizzle client singleton
  schema.ts                     # Drizzle schema (entries, statuses, users)
  entries.ts                    # Service layer (all business logic)
  validation.ts                 # Status/severity/group validation sets
  types.ts                      # Shared TypeScript types
  api-client.ts                 # Client-side fetch wrapper
components/
  entry-table.tsx               # TanStack Table (Client Component)
  entry-form.tsx                # Modal form (Client Component)
  status-badge.tsx              # Status badge (Server Component)
  sidebar.tsx                   # Sidebar nav (Client Component)
```

## API Routes (`/api`)

GET/POST /entries, GET/PUT/DELETE /entries/[id], PATCH /entries/[id]/status
GET /entries/stats, GET /statuses

## DB Schema

entries: id, title, description, status, severity, group, assigned_to, created_at, updated_at
statuses: id, name, color, order | users: id, username, email, password, role, created_at
Statuses: open → in_progress → resolved → closed | Severity: minor, major, critical

## Coding Standards

**Layer separation:**
- Route handlers: HTTP only — parse request, call service, return JSON
- Service layer (`lib/entries.ts`): business logic, validation
- Schema (`lib/schema.ts`): Drizzle table definitions, no business logic

**Naming:** JSON `snake_case`, TS `camelCase`. API routes under `/api`.

**Errors:** Return `{"error": "message"}` + HTTP status. Never leak internals.

**Frontend:**
- Client-side API calls via `lib/api-client.ts` — never raw fetch in components
- Types in `lib/types.ts`, components in `components/`, pages in `app/`
- Dashboard is a Server Component (direct DB access, no loading spinner)
- Entries pages are Client Components (interactive filters, pagination)

## Commands

```bash
docker compose up -d db         # Start PostgreSQL only
npm run dev                     # Next.js dev (:3000)
npm run build                   # Production build
docker compose up -d            # Full stack (PostgreSQL + Next.js)
```

## Database

PostgreSQL. Env: `DATABASE_URL` or `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASS`.
Local dev connects to port 5432 (docker PostgreSQL).
Drizzle schema in `lib/schema.ts`. Use `drizzle-kit` for migrations.

## Development Workflow

**Before code:** Read `lib/schema.ts` → check `lib/entries.ts` → check `lib/types.ts`
**After changes:** `npm run build` → `docker compose build`
**New endpoint:** `app/api/` route → `lib/entries.ts` service → `lib/schema.ts` if needed → `lib/api-client.ts` → `lib/types.ts`

## Self-Correction

When the user corrects a pattern, propose adding it to this file.