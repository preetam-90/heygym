# Admin Platform Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build `heygym-admin` as a separate Next.js repo that reuses the same Fastify backend to review PENDING gyms and run full backoffice.

**Architecture:** New repo `heygym-admin` calls existing `POST /auth/login`, `GET /auth/me`, and `GET/PATCH /api/v1/admin/*` with ADMIN JWT; only backend change is CORS allowlist for the admin origin.

**Tech Stack:** Next.js 14 (App Router), React 18, Tailwind CSS 3, TypeScript 5, existing Fastify + Prisma backend (unchanged except CORS).

**Spec:** `docs/superpowers/specs/2026-09-28-admin-platform-design.md`

## Global Constraints

- Same backend: reuse `POST /api/v1/auth/login`, `GET /api/v1/auth/me`, `GET /api/v1/admin/users`, `GET /api/v1/admin/gyms`, `GET /api/v1/admin/stats`, `PATCH /api/v1/admin/gyms/:id/status` — no new endpoints in v1.
- ADMIN-only: every admin page verifies `GET /auth/me` role is `ADMIN`, otherwise shows access-denied.
- Gym lifecycle unchanged: owner `POST /gyms` creates `PENDING`; only `PATCH /admin/gyms/:id/status` flips to `APPROVED`/`REJECTED`.
- Admin origin must be added to backend CORS allowlist alongside `FRONTEND_URL`.
- New repo lives outside `gym-platform/` (sibling `heygym-admin/`), committed separately.

## Review Focus

- Non-ADMIN JWT opening an admin URL must see access-denied, not data or a redirect loop.
- Expired access token must refresh once then retry, else redirect to `/login`.
- Approve/reject failure must roll back the row to PENDING rather than leaving a false APPROVED badge.
- Backend preflight `OPTIONS` from the admin origin must return `Access-Control-Allow-Origin`, not a CORS block.
- Empty pending queue must render an explicit empty state, not a blank table or infinite spinner.

---

### Task 1: Scaffold heygym-admin repo

**Files:**
- Create: `heygym-admin/package.json`, `heygym-admin/tsconfig.json`, `heygym-admin/tailwind.config.ts`, `heygym-admin/next.config.js`, `heygym-admin/app/layout.tsx`, `heygym-admin/app/globals.css`, `heygym-admin/.env.example`, `heygym-admin/README.md`
- Test: shell verification (build + route smoke)

**Interfaces:**
- Consumes: main `frontend/` theme tokens (`bg #09090B`, accent `#D4FF4F`) — copy values, no import.
- Produces: runnable Next.js app with `NEXT_PUBLIC_API_URL` env; `GET /login` renders.

- [ ] **Step 1: Write the failing check**

```bash
[ -f heygym-admin/app/login/page.tsx ] && echo "login exists" || echo "login missing"
```

- [ ] **Step 2: Run check to verify it fails**

Run: `[ -f heygym-admin/app/login/page.tsx ] && echo "login exists" || echo "login missing"`
Expected: `login missing`

- [ ] **Step 3: Implement scaffold in `heygym-admin/`**

Scaffold Next.js 14 App Router + TS + Tailwind; copy dark theme (`bg-[#09090B]`, `#D4FF4F` accents) into `app/globals.css`; `app/layout.tsx` with minimal nav shell; `.env.example` with `NEXT_PUBLIC_API_URL=http://localhost:4000/api/v1` and `NEXT_PUBLIC_ADMIN_URL=http://localhost:3001`; stub `app/login/page.tsx` rendering "Admin login".

- [ ] **Step 4: Run verification**

Run: `cd heygym-admin && npm install && npm run build`
Expected: build succeeds with `/login` route listed.

- [ ] **Step 5: Commit**

```bash
git add heygym-admin
git commit -m "feat(admin): scaffold heygym-admin Next.js repo"
```

### Task 2: Admin auth (api client + guard + login)

**Files:**
- Create: `heygym-admin/lib/api.ts`, `heygym-admin/lib/auth-context.tsx`, `heygym-admin/app/login/page.tsx`
- Modify: `heygym-admin/app/layout.tsx`
- Test: `heygym-admin` manual QA + curl against backend

**Interfaces:**
- Consumes: backend `POST /api/v1/auth/login`, `GET /api/v1/auth/me` — exact paths.
- Produces: `api.login(email, password)`, `api.me()`, `useAuth() -> { user, login, logout }`; login page redirects ADMIN to `/gyms-pending`.

- [ ] **Step 1: Write the failing check**

```bash
grep -q "requireRole\|role !== 'ADMIN'" heygym-admin/app/login/page.tsx && echo "guard exists" || echo "guard missing"
```

- [ ] **Step 2: Run check to verify it fails**

Run: same grep command
Expected: `guard missing`

- [ ] **Step 3: Implement `lib/api.ts` + `lib/auth-context.tsx` + `app/login/page.tsx` in `heygym-admin/`**

Copy SSR-safe storage + single-flight refresh pattern from main `frontend/lib/api.ts`; `AuthProvider` wrapping layout; login page calls `api.login`, then `api.me()`, allows only `role === 'ADMIN'` else shows access-denied and clears tokens.

- [ ] **Step 4: Run verification**

Run: `cd heygym-admin && npm run build && curl -s -X POST http://localhost:4000/api/v1/auth/login -H 'Content-Type: application/json' -d '{"email":"admin@example.com","password":"wrong"}' | head -c 200`
Expected: build passes; backend returns 401 for bad creds (proves wiring target correct). Then manual: login with real ADMIN shows `/gyms-pending`.

- [ ] **Step 5: Commit**

```bash
git add heygym-admin/lib heygym-admin/app/login heygym-admin/app/layout.tsx
git commit -m "feat(admin): add ADMIN-guarded login with shared auth pattern"
```

### Task 3: Pending queue with approve/reject

**Files:**
- Create: `heygym-admin/app/gyms-pending/page.tsx`, `heygym-admin/components/gym-detail-drawer.tsx`
- Test: manual roundtrip + curl status check

**Interfaces:**
- Consumes: `api.getPendingGyms()` -> `GET /api/v1/admin/gyms?status=PENDING` (or client filter), `api.updateGymStatus(id, status)` -> `PATCH /api/v1/admin/gyms/:id/status`.
- Produces: default landing queue UI with optimistic approve/reject + rollback.

- [ ] **Step 1: Write the failing check**

```bash
grep -q "gyms-pending\|Approve" heygym-admin/app/gyms-pending/page.tsx 2>/dev/null && echo "queue exists" || echo "queue missing"
```

- [ ] **Step 2: Run check to verify it fails**

Run: same grep command
Expected: `queue missing`

- [ ] **Step 3: Implement `app/gyms-pending/page.tsx` in `heygym-admin/`**

Table (gym, owner, city, created, plans count) default-sorted oldest first; Approve/Reject buttons call `PATCH /api/v1/admin/gyms/:id/status`; optimistic row update with rollback + inline error on failure; detail drawer shows description, address, contact, plans; empty state when zero pending.

- [ ] **Step 4: Run verification**

Run: `cd heygym-admin && npm run build` then manual: create owner gym (PENDING), approve in admin, `curl http://localhost:4000/api/v1/gyms` shows it approved; reject path restores row on simulated failure.
Expected: build passes; roundtrip works; Review Focus rollback + empty-state lines verified here.

- [ ] **Step 5: Commit**

```bash
git add heygym-admin/app/gyms-pending heygym-admin/components/gym-detail-drawer.tsx
git commit -m "feat(admin): add pending gym queue with approve/reject"
```

### Task 4: Overview, all gyms, users

**Files:**
- Create: `heygym-admin/app/page.tsx`, `heygym-admin/app/gyms/page.tsx`, `heygym-admin/app/users/page.tsx`
- Test: build + page-load checks

**Interfaces:**
- Consumes: `GET /api/v1/admin/stats`, `GET /api/v1/admin/gyms`, `GET /api/v1/admin/users` via `lib/api.ts` from Task 2.
- Produces: `/` stats cards, `/gyms` filterable table, `/users` role table.

- [ ] **Step 1: Write the failing check**

```bash
for p in "app/page.tsx" "app/gyms/page.tsx" "app/users/page.tsx"; do [ -f heygym-admin/$p ] && echo "$p ok" || echo "$p missing"; done
```

- [ ] **Step 2: Run check to verify it fails**

Run: same loop
Expected: three `missing` lines

- [ ] **Step 3: Implement the three pages in `heygym-admin/`**

`/` renders `totalUsers/totalGyms/pendingGyms/approvedGyms/rejectedGyms` cards; `/gyms` reuses queue row + status filter + search; `/users` table with role badge + search; all with loading, error+retry, and ADMIN guard redirect.

- [ ] **Step 4: Run verification**

Run: `cd heygym-admin && npm run build && curl -s -o /dev/null -w "admin-home:%{http_code}\n" http://localhost:3001/`
Expected: build passes; admin app serves 200 on `/` (after `next start -p 3001`).

- [ ] **Step 5: Commit**

```bash
git add heygym-admin/app/page.tsx heygym-admin/app/gyms heygym-admin/app/users
git commit -m "feat(admin): add overview, gyms, and users pages"
```

### Task 5: Backend CORS for admin origin

**Files:**
- Modify: `gym-platform/backend/src/plugins/cors.ts`, `gym-platform/backend/.env.example`
- Test: preflight curl from admin origin

**Interfaces:**
- Consumes: `FRONTEND_URL` env + new `ADMIN_URL` env (exact names).
- Produces: `OPTIONS` from admin origin returns `Access-Control-Allow-Origin`.

- [ ] **Step 1: Write the failing check**

```bash
curl -s -D - -o /dev/null -X OPTIONS http://localhost:4000/api/v1/admin/stats -H 'Origin: http://localhost:3001' | grep -i "access-control-allow-origin" || echo "cors missing"
```

- [ ] **Step 2: Run check to verify it fails**

Run: same curl command
Expected: `cors missing` (admin origin not yet allowlisted)

- [ ] **Step 3: Implement CORS allowlist in `backend/src/plugins/cors.ts`**

Change `origin` from single `env.FRONTEND_URL` to allowlist `[env.FRONTEND_URL, process.env.ADMIN_URL ?? 'http://localhost:3001']`; add `ADMIN_URL` to `src/config/env.ts` and `.env.example`; keep credentials + methods/headers unchanged.

- [ ] **Step 4: Run verification**

Run: restart backend, then same preflight curl + `curl -s -o /dev/null -w "%{http_code}\n" http://localhost:4000/api/v1/gyms`
Expected: preflight returns `Access-Control-Allow-Origin: http://localhost:3001`; gyms API 200; main frontend origin still allowed.

- [ ] **Step 5: Commit**

```bash
cd gym-platform && git add backend/src/plugins/cors.ts backend/src/config/env.ts backend/.env.example
git commit -m "fix(backend): allowlist admin origin for CORS"
```
