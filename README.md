# Uncomfirmatives

Nonconformity tracking application for production environments. Track, manage, and report on nonconformities across an organization.

## Quick Start

```bash
# Full stack (MySQL + Backend + Frontend)
docker compose up -d

# Development (run separately)
cd backend && air                 # Go backend :8080
cd frontend && npm run dev        # Vite frontend :5173
```

Frontend dev server: http://localhost:5173
Backend API: http://localhost:8080/api/v1
MySQL: localhost:3307 (Docker mapped)

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | Go 1.23, Chi/v5 router, GORM ORM |
| Frontend | React 19, TypeScript 5.7, Vite 6, TanStack Table v8 |
| Database | MySQL 8 |
| Styling | VSCode dark theme (CSS variables) |
| Deploy | Docker Compose (multi-stage builds) |

## Architecture

Layered monorepo: **handler → service → model**

```
backend/
  cmd/server/main.go          → entry point
  internal/
    config/                    → env var config
    models/                    → GORM structs (entry, status, user)
    handlers/                  → HTTP handlers (parse request → call service → return JSON)
    services/                  → business logic + validation
    middleware/                → CORS, logging, auth
    router/                    → Chi route definitions

frontend/src/
  api/client.ts               → fetch wrapper (all API calls go through here)
  components/                  → EntryTable, EntryForm, StatusBadge, Layout
  pages/                       → Dashboard, Entries, Settings
  hooks/useEntries.ts          → data fetching hooks
  types/index.ts               → shared TypeScript interfaces
```

## API Endpoints

All under `/api/v1`:

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /entries | List (filterable: status, severity, search) |
| GET | /entries/:id | Get single entry |
| POST | /entries | Create entry |
| PUT | /entries/:id | Update entry |
| DELETE | /entries/:id | Delete entry |
| PATCH | /entries/:id/status | Change status |
| GET | /entries/stats | Dashboard statistics |
| GET | /entries/export | Export CSV/Excel |
| POST | /entries/import | Import CSV/Excel |
| GET | /statuses | List available statuses |

## Database

MySQL 8 with GORM auto-migration.

**Core tables:**
- `entries` — title, description, status, severity, assigned_to
- `statuses` — name, color (hex), display order
- `users` — username, email, password (bcrypt), role

**Statuses:** open → in_progress → resolved → closed
**Severity:** minor | major | critical

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| DB_HOST | localhost | MySQL host |
| DB_PORT | 3306 | MySQL port |
| DB_NAME | uncomfirmatives | Database name |
| DB_USER | app | Database user |
| DB_PASS | apppass | Database password |
| PORT | 8080 | Backend server port |

## Testing

```bash
cd backend && go test ./...    # Go tests
cd frontend && npm test        # Frontend tests
```

## Docker Production

```bash
docker compose build           # Build images
docker compose up -d           # Run (backend :8080, frontend :3000, MySQL :3307)
```

Backend: golang:1.23-alpine → alpine:3.20 (~15MB)
Frontend: node:22-alpine → nginx:alpine (serves static + proxies /api)
