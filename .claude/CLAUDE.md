# CLAUDE.md: uncomfirmatives

## 1. Project Context

**Uncomfirmatives** — nonconformity tracking for production environments. Track, manage, and report on nonconformities with filtering, import/export, and a mobile-ready PWA interface.

**Architecture:** Layered monorepo (handler → service → model) with strict separation.
**Tech Stack:** Go 1.23 | Chi/v5 | GORM | MySQL 8 | React 19 + TypeScript 5.7 | Vite 6 | TanStack Table v8 | PWA | Docker Compose

## 2. Project Structure

```
backend/
├── cmd/server/main.go
├── internal/
│   ├── config/config.go
│   ├── database/mysql.go
│   ├── models/{entry,status,user}.go
│   ├── handlers/{entries,statuses,export,import}.go
│   ├── services/{entry_service,export_service,import_service}.go
│   ├── middleware/{auth,cors,logging}.go
│   └── router/router.go
├── go.mod / go.sum

frontend/src/
├── main.tsx, App.tsx
├── api/client.ts
├── components/{EntryTable,EntryForm,StatusBadge,Layout}.tsx
├── pages/{Dashboard,Entries,Settings}.tsx
├── hooks/useEntries.ts
└── types/index.ts

.claude/
├── CLAUDE.md
└── agents/{architect,architect-assistant,researcher,planner,coder,code-reviewer,tester}.md

docker-compose.yml, Dockerfile.{backend,frontend}
```

## 3. Coding Standards

### Layer Separation
- **Handlers** — HTTP only: parse request, call service, return JSON
- **Services** — business logic, validation, orchestration
- **Models** — GORM structs with DB tags, no business logic

### Naming
- JSON: `snake_case` | Go structs: `CamelCase`
- Routes in `internal/router/router.go` — all prefixed `/api/v1`
- Config from env vars via `internal/config/config.go`

### Error Handling
- JSON: `{"error": "message"}` with appropriate HTTP status
- Handlers don't leak internal errors
- Services return typed errors → handlers map to HTTP status

### Frontend
- API calls through `src/api/client.ts` — never raw fetch in components
- Types in `src/types/index.ts`
- Data fetching via hooks in `src/hooks/`
- Components in `src/components/`, pages in `src/pages/`

### Code Patterns

```go
// Handler — HTTP concerns only
func (h *EntryHandler) Create(w http.ResponseWriter, r *http.Request) {
    // 1. Parse + validate  2. Call service  3. Return JSON
}

// Service — business logic
func (s *EntryService) Create(ctx context.Context, input CreateEntryInput) (*Entry, error) {
    // 1. Validate  2. Persist via GORM  3. Return result
}

// Model — GORM struct
type Entry struct {
    ID uint `gorm:"primaryKey" json:"id"`
    Title string `gorm:"size:255;not null" json:"title"`
    // ... snake_case json, CamelCase Go
}
```

## 4. Commands

```bash
docker compose up -d          # Full stack
cd backend && air             # Backend hot reload
cd frontend && npm run dev    # Frontend (Vite :5173)
cd backend && go test ./...   # Backend tests
cd frontend && npm test       # Frontend tests
docker compose build          # Production build
```

## 5. Database

MySQL 8 — env vars: `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASS`. GORM auto-migrates in dev.

**entries:** id (PK), title (VARCHAR 255), description (TEXT), status (VARCHAR 50), severity (VARCHAR 50), assigned_to (VARCHAR 255), created_at, updated_at
**statuses:** id (PK), name (VARCHAR 50 unique), color (VARCHAR 7 hex), order (INT)
**users:** id (PK), username (VARCHAR 100 unique), email (VARCHAR 255), password (VARCHAR 255 bcrypt), role (VARCHAR 50), created_at

Default statuses: `open` → `in_progress` → `resolved` → `closed`
Severity levels: `minor` | `major` | `critical`

## 6. API Reference

All under `/api/v1`. Backend `:8080`, frontend dev `:5173`.

| Method | Endpoint | Description |
|---|---|---|
| GET | /entries | List (paginated, filterable) |
| GET | /entries/:id | Get single |
| POST | /entries | Create |
| PUT | /entries/:id | Update |
| DELETE | /entries/:id | Delete |
| PATCH | /entries/:id/status | Change status |
| GET | /entries/export | Export CSV/Excel |
| POST | /entries/import | Import CSV/Excel |
| GET | /statuses | List statuses |
| GET | /entries/stats | Dashboard stats |

## 7. Frontend Architecture

- VSCode dark theme (CSS variables: `--bg-primary: #1e1e1e`, `--accent: #007acc`)
- Tab navigation: Dashboard | Entries | Settings
- TanStack Table: sorting, filtering, row actions (edit, delete, status change)
- PWA: service worker, manifest, responsive (mobile < 768px, tablet 768–1024px, desktop > 1024px)

## 8. Deployment

Docker multi-stage: backend (golang:1.23-alpine → alpine:3.20 ~15MB), frontend (node:22-alpine → nginx:alpine).
Vite proxies `/api` in dev; Nginx proxies in production.
Env vars: `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASS`, `PORT`, `MYSQL_ROOT_PASSWORD`

## 9. Development Workflow

**Before code:** Read models → check existing handlers/services → check `src/types/index.ts`
**After changes:** `go test ./...` → `npm test` → `docker compose build`

**New API endpoint:** route (`router.go`) → handler → service → model → `client.ts` → `types/index.ts`

## 10. Agent Team

Definitions in `.claude/agents/`. Pipeline orchestrated by architect.

| Agent | Model | Role |
|---|---|---|
| architect | opus | Team lead — decomposes, delegates, decides |
| architect-assistant | opus | Guardrail — validates decisions, prevents scope creep |
| researcher | sonnet | Codebase explorer — read-only |
| planner | opus | Plan designer — step-by-step with file paths |
| coder | opus | Implementer — follows approved plans |
| code-reviewer | opus | Quality gate — reviews ALL code |
| tester | sonnet | Validator — writes/runs tests |

**Pipeline:** User → architect → assistant (validate) → researcher → planner → architect (approve) → coder → code-reviewer (may loop) → tester → architect (report)

**Hard rules:** Code-reviewer never skipped. Assistant consulted on decisions. Researcher never writes code. Coder follows the plan.

## 11. Self-Correction Rule

When the user corrects a pattern, propose adding it to this file.