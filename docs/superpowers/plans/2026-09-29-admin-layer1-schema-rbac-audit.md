# Admin Layer 1 — Schema, RBAC, Audit — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Extend the database and auth core so every later layer has statuses, granular permissions, and append-only audit logging to build on.

**Architecture:** Non-destructive Prisma migration adds status/verification/soft-delete fields plus new `AuditLog` model; a permission map + `requirePermission` decorator enforces granular checks after existing `authenticate`/`requireRole`; `AdminService` writes audit entries from existing gym-status actions.

**Tech Stack:** Fastify 4, Prisma 5, PostgreSQL 16, zod, TypeScript 5.

**Spec:** `docs/superpowers/specs/2026-09-29-complete-admin-panel-design.md` (Sections 1–2)

## Global Constraints

- Non-destructive migrations only — no dropped tables/columns; new columns nullable or defaulted (`User.status` default `ACTIVE`).
- Same Fastify backend — no new service, no duplicate auth system.
- Every admin route keeps `authenticate` → `requireRole` and adds permission checks; never rely on frontend-only guarding.
- `AuditLog` is append-only — no update/delete endpoints, ever.
- Secrets stay server-side and are never returned by any endpoint.

## Review Focus

- A `SUSPENDED`/`BANNED` user with a still-valid JWT must be rejected on the next authenticated request, not allowed until token expiry.
- A `Moderator` calling `PATCH /api/v1/admin/gyms/:id/status` without `gyms.approve` must get 403, not success.
- `DELETE` on any `/audit-logs` route must not exist — verify the router table, not just the service.
- Login brute force (20 rapid bad attempts) must be throttled, not served at full speed.
- An audit entry must exist for every gym approve/reject performed through the API, including the actor, action, target, and reason.

---

### Task 1: Schema extension migration

**Files:**
- Modify: `backend/prisma/schema.prisma`
- Create: `backend/prisma/migrations/<timestamp>_admin_foundation/migration.sql` (via `prisma migrate dev`)
- Test: shell + `npx prisma validate`

**Interfaces:**
- Consumes: existing `User`, `Gym`, `Role`, `GymStatus` enums.
- Produces: `UserStatus (ACTIVE/SUSPENDED/BANNED)`, extended `GymStatus (+UNDER_REVIEW, SUSPENDED)`, `User.status/lastLoginAt/deletedAt/emailVerifiedAt/phoneVerifiedAt`, `Gym.verifiedAt/deletedAt/internalNotes`, `AuditLog` model (id, actorId, action, targetType, targetId, reason, ip, createdAt).

- [ ] **Step 1: Write the failing check**

```bash
grep -q "model AuditLog" backend/prisma/schema.prisma && echo "audit exists" || echo "audit missing"
```

- [ ] **Step 2: Run check to verify it fails**

Run: same grep command
Expected: `audit missing`

- [ ] **Step 3: Implement schema changes in `backend/prisma/schema.prisma`**

Add `UserStatus` enum, extend `GymStatus` with `UNDER_REVIEW` and `SUSPENDED`, add the listed fields (all nullable except `User.status` defaulting to `ACTIVE`), add the `AuditLog` model. Do not alter existing columns.

- [ ] **Step 4: Run migration and validate**

Run: `cd backend && npx prisma migrate dev --name admin_foundation && npx prisma validate && npx tsc --noEmit`
Expected: migration applies cleanly on the dev DB; validate passes; `tsc` clean (regen client first via `prisma generate` if types complain).

- [ ] **Step 5: Commit**

```bash
git add backend/prisma/schema.prisma backend/prisma/migrations/
git commit -m "feat(backend): extend User/Gym statuses and add AuditLog model"
```

### Task 2: Permission map + enforcement

**Files:**
- Create: `backend/src/plugins/permissions.ts`
- Modify: `backend/src/plugins/auth.ts`, `backend/src/modules/admin/admin.routes.ts`
- Test: curl 403 proof + `npx tsc --noEmit`

**Interfaces:**
- Consumes: existing `fastify.authenticate`, `fastify.requireRole(...roles)` from `src/plugins/auth.ts`.
- Produces: `fastify.requirePermission('gyms.approve')` preHandler; exported `PERMISSIONS` list and `ROLE_PERMISSIONS: Record<Role, string[]>` with SuperAdmin=all, Admin=most, Moderator=users/gyms/reviews/reports scopes, FinanceAdmin=payments scope, SupportAdmin=users/enquiries/bookings scopes.

- [ ] **Step 1: Write the failing check**

```bash
grep -rq "requirePermission" backend/src/ && echo "perm exists" || echo "perm missing"
```

- [ ] **Step 2: Run check to verify it fails**

Run: same grep command
Expected: `perm missing`

- [ ] **Step 3: Implement `requirePermission(permission: string)` in `backend/src/plugins/permissions.ts`**

Reads `request.user.role`, resolves `ROLE_PERMISSIONS`, returns 403 `{ success:false, error:{ code:'FORBIDDEN' } }` when missing; SuperAdmin bypasses. Wire into `auth.ts` plugin decoration and add to the existing `PATCH /admin/gyms/:id/status` route as `[authenticate, requireRole('ADMIN'), requirePermission('gyms.approve')]`.

- [ ] **Step 4: Run verification**

Run: `npx tsc --noEmit`; restart backend; `curl` the status endpoint with a Moderator-scoped token (downgrade a test user) and confirm 403; re-confirm ADMIN still succeeds.
Expected: `tsc` clean; 403 for missing permission; success path unchanged (Review Focus line 2 pinned here).

- [ ] **Step 5: Commit**

```bash
git add backend/src/plugins/permissions.ts backend/src/plugins/auth.ts backend/src/modules/admin/admin.routes.ts
git commit -m "feat(backend): add granular RBAC permission enforcement"
```

### Task 3: Audit logging on existing admin actions

**Files:**
- Create: `backend/src/lib/audit.ts`, `backend/src/modules/audit/audit.routes.ts`
- Modify: `backend/src/modules/admin/admin.service.ts`
- Test: curl + DB check

**Interfaces:**
- Consumes: `AuditLog` model from Task 1.
- Produces: `writeAudit(entry: { actorId, action, targetType, targetId, reason?, ip? })`; `GET /api/v1/admin/audit-logs` (ADMIN + `audit.view`, search/filter/pagination); gym approve/reject writes entries with actor/action/target/reason.

- [ ] **Step 1: Write the failing check**

```bash
curl -s http://localhost:4000/api/v1/admin/audit-logs -H "Authorization: Bearer $ADMIN_TOKEN" | grep -q "audit" && echo "audit api exists" || echo "audit api missing"
```

- [ ] **Step 2: Run check to verify it fails**

Run: same curl (obtain `$ADMIN_TOKEN` via login first)
Expected: `audit api missing` (404 route)

- [ ] **Step 3: Implement `writeAudit` + audit routes + hook into `AdminService.updateGymStatus`**

Append-only writes (create only); list endpoint with `?search=&action=&actorId=&page=&pageSize=`; no update/delete routes exist anywhere. Gym approve/reject passes actor id, action `gym.approve`/`gym.reject`, target, and reason.

- [ ] **Step 4: Run verification**

Run: approve then reject a test gym via API; `GET /admin/audit-logs` shows both entries with actor/action/target/reason; `curl -X DELETE` on an audit-logs path returns 404.
Expected: both entries present; no DELETE route (Review Focus lines 3 and 5 pinned here).

- [ ] **Step 5: Commit**

```bash
git add backend/src/lib/audit.ts backend/src/modules/audit/ backend/src/modules/admin/admin.service.ts backend/src/app.ts
git commit -m "feat(backend): append-only audit log wired into gym approvals"
```

### Task 4: Suspended/banned enforcement + login throttling

**Files:**
- Modify: `backend/src/plugins/auth.ts`, `backend/src/modules/auth/auth.service.ts`
- Test: curl behavior proofs

**Interfaces:**
- Consumes: `User.status` from Task 1, audit writer from Task 3.
- Produces: `authenticate` rejects `SUSPENDED`/`BANNED` with 403 even on valid JWT; login rate-limit (max 10 attempts/IP/5min → 429) with failed attempts audit-logged; `lastLoginAt` updated on successful login.

- [ ] **Step 1: Write the failing check**

```bash
grep -q "SUSPENDED" backend/src/plugins/auth.ts && echo "status check exists" || echo "status check missing"
```

- [ ] **Step 2: Run check to verify it fails**

Run: same grep command
Expected: `status check missing`

- [ ] **Step 3: Implement status check in `authenticate` + login throttle in `AuthService.login`**

Status lookup on the token's user id per request (or cached ≤60s); throttle counter keyed by IP+email; 429 body `{ success:false, error:{ code:'RATE_LIMITED' } }`.

- [ ] **Step 4: Run verification**

Run: suspend a test user holding a valid JWT, call `GET /auth/me` → 403; fire 20 rapid bad-password logins → 429s appear; successful login updates `lastLoginAt` in DB.
Expected: 403 / 429 / timestamp update all observed (Review Focus lines 1 and 4 pinned here).

- [ ] **Step 5: Commit**

```bash
git add backend/src/plugins/auth.ts backend/src/modules/auth/auth.service.ts
git commit -m "feat(backend): enforce suspended/banned sessions and throttle login"
```
