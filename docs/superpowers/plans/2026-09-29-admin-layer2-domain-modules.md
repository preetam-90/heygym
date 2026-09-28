# Admin Layer 2 — Domain Modules — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add backend modules for bookings, transactions, payouts, reviews, enquiries, reports, notifications/content, and settings/commission — all admin-governed, all audit-logged.

**Architecture:** One Fastify module per domain following the existing `*.controller.ts / *.routes.ts / *.schema.ts / *.service.ts` pattern, registered in `src/app.ts`; every admin route uses `authenticate` → `requireRole` → `requirePermission`; sensitive mutations call `writeAudit`.

**Tech Stack:** Fastify 4, Prisma 5, PostgreSQL 16, zod, TypeScript 5.

**Spec:** `docs/superpowers/specs/2026-09-29-complete-admin-panel-design.md` (Sections 1–2)

## Global Constraints

- Module layout mirrors `src/modules/admin/` — controller/routes/schema/service per domain, registered with `/api/v1/...` prefix in `src/app.ts`.
- Every admin route enforces `authenticate` → `requireRole` → `requirePermission`; permission names from Layer 1 `PERMISSIONS`.
- Sensitive mutations (suspend, refund, payout hold/release, moderation, settings change) write `AuditLog` with actor/action/target/reason.
- Non-destructive migrations only; secrets never leave the server.
- Commission math is `customer payment → platform commission → gym owner amount`, resolved GLOBAL → GYM → OWNER precedence.

## Review Focus

- Creating a booking for a `SUSPENDED` gym must fail validation, not create a dangling booking.
- A `Moderator` calling `POST /refunds` must get 403 (needs `payments.refund`, a FinanceAdmin permission).
- Deleting a review must soft-moderate (`DELETED`), never hard-delete the row, so reports stay joinable.
- A payout marked `COMPLETED` twice must not double-record history or change the amount (idempotent).
- A `HELD` payout must be excluded from pending-payout totals until released.

---

### Task 1: Booking + Transaction models and migration

**Files:**
- Modify: `backend/prisma/schema.prisma`, migrate.
- Test: `npx prisma validate` + `tsc`

**Interfaces:**
- Consumes: `User`, `Gym`, `MembershipPlan` ids; Layer 1 statuses.
- Produces: `Booking` (status `PENDING/CONFIRMED/CANCELLED/COMPLETED/REFUNDED/DISPUTED`, user/gym/plan refs, amount, paymentStatus, bookingDate, cancellationReason, refundStatus) and `Transaction` (transactionId unique, user/gym/owner refs, amount, commission, gymAmount, method, status, refundStatus) models.

- [ ] **Step 1: Write the failing check**

```bash
grep -q "model Booking" backend/prisma/schema.prisma && echo "booking exists" || echo "booking missing"
```

- [ ] **Step 2: Run check to verify it fails**

Run: same grep command
Expected: `booking missing`

- [ ] **Step 3: Implement the two models in `backend/prisma/schema.prisma`**

All refs with `onDelete: Cascade` matching existing style; `transactionId` `@unique`; amounts `Float`; timestamps.

- [ ] **Step 4: Run verification**

Run: `cd backend && npx prisma migrate dev --name bookings_transactions && npx prisma validate && npx tsc --noEmit`
Expected: migration applies; validate + `tsc` clean.

- [ ] **Step 5: Commit**

```bash
git add backend/prisma/schema.prisma backend/prisma/migrations/
git commit -m "feat(backend): add Booking and Transaction models"
```

### Task 2: Bookings module

**Files:**
- Create: `backend/src/modules/bookings/{bookings.controller.ts,bookings.routes.ts,bookings.schema.ts,bookings.service.ts}`
- Modify: `backend/src/app.ts`
- Test: curl CRUD + status transitions

**Interfaces:**
- Consumes: `writeAudit` (Layer 1), `requirePermission`.
- Produces: `POST /api/v1/bookings` (user), `GET /api/v1/admin/bookings?status=&search=&page=` (`bookings.view`), `PATCH /api/v1/admin/bookings/:id` (`bookings.manage`: cancel/modify/confirm/complete/dispute), all transition-validated.

- [ ] **Step 1: Write the failing check**

```bash
curl -s -o /dev/null -w "%{http_code}" http://localhost:4000/api/v1/admin/bookings -H "Authorization: Bearer $ADMIN_TOKEN" | grep -q 404 && echo "bookings missing" || echo "bookings exists"
```

- [ ] **Step 2: Run check to verify it fails**

Run: same curl (login for `$ADMIN_TOKEN` first)
Expected: `bookings missing` (404)

- [ ] **Step 3: Implement the bookings module**

Service validates transitions (e.g. no COMPLETED from PENDING; no booking on SUSPENDED gym — Review Focus line 1); admin mutations audit-logged with reason.

- [ ] **Step 4: Run verification**

Run: create booking, walk PENDING→CONFIRMED→COMPLETED via admin PATCH; attempt illegal transition → 422; attempt booking on suspended gym → 422.
Expected: legal path 200s; illegal paths 422 with error codes.

- [ ] **Step 5: Commit**

```bash
git add backend/src/modules/bookings/ backend/src/app.ts
git commit -m "feat(backend): add bookings module with admin transitions"
```

### Task 3: Transactions + refunds + commission engine

**Files:**
- Create: `backend/src/modules/billing/{billing.controller.ts,billing.routes.ts,billing.schema.ts,billing.service.ts}`
- Modify: `backend/src/app.ts`
- Test: curl + math assertions

**Interfaces:**
- Consumes: `CommissionRule` model (created in this task's migration), `writeAudit`.
- Produces: `GET /api/v1/admin/transactions` (`payments.view`); `POST /api/v1/admin/transactions/:id/refund` (`payments.refund`); `GET/PUT /api/v1/admin/commission` (`payments.config`); `resolveCommission(gymId, ownerId, amount) -> { commission, gymAmount }` with GLOBAL→GYM→OWNER precedence and validity windows.

- [ ] **Step 1: Write the failing check**

```bash
grep -q "resolveCommission" backend/src/modules/billing/billing.service.ts 2>/dev/null && echo "billing exists" || echo "billing missing"
```

- [ ] **Step 2: Run check to verify it fails**

Run: same grep command
Expected: `billing missing`

- [ ] **Step 3: Implement commission rules migration + billing module**

`CommissionRule` (scope, gymId?, ownerId?, percent, validFrom/validTo); refund sets `refundStatus` + audit entry; never returns secret provider config.

- [ ] **Step 4: Run verification**

Run: seed GLOBAL 10% + gym-specific 8%; `resolveCommission` on that gym's 1000 payment → `{ commission: 80, gymAmount: 920 }` (assert via a script or endpoint); Moderator refund attempt → 403.
Expected: math correct; 403 for missing `payments.refund` (Review Focus line 2 pinned here).

- [ ] **Step 5: Commit**

```bash
git add backend/prisma/ backend/src/modules/billing/ backend/src/app.ts
git commit -m "feat(backend): add transactions, refunds, and commission engine"
```

### Task 4: Payouts module

**Files:**
- Create: `backend/src/modules/payouts/{payouts.controller.ts,payouts.routes.ts,payouts.schema.ts,payouts.service.ts}` (+ migration for `Payout`)
- Modify: `backend/src/app.ts`
- Test: curl lifecycle + idempotency

**Interfaces:**
- Consumes: `Transaction.gymAmount`, `writeAudit`.
- Produces: `GET /api/v1/admin/payouts?status=` (`payouts.view`); `POST /api/v1/admin/payouts/:id/{approve,hold,release,complete}` (`payouts.manage`); pending totals exclude `HELD`.

- [ ] **Step 1: Write the failing check**

```bash
curl -s -o /dev/null -w "%{http_code}" http://localhost:4000/api/v1/admin/payouts -H "Authorization: Bearer $ADMIN_TOKEN" | grep -q 404 && echo "payouts missing" || echo "payouts exists"
```

- [ ] **Step 2: Run check to verify it fails**

Run: same curl
Expected: `payouts missing` (404)

- [ ] **Step 3: Implement Payout model + module**

Statuses `PENDING/PROCESSING/COMPLETED/FAILED/HELD` with append-only history entries; COMPLETED transition idempotent; every action audit-logged.

- [ ] **Step 4: Run verification**

Run: full lifecycle PENDING→PROCESSING→COMPLETED; repeat COMPLETED → single history entry, amount unchanged; HELD payout absent from pending totals.
Expected: idempotent + totals correct (Review Focus lines 4–5 pinned here).

- [ ] **Step 5: Commit**

```bash
git add backend/prisma/ backend/src/modules/payouts/ backend/src/app.ts
git commit -m "feat(backend): add payout lifecycle with audit trail"
```

### Task 5: Reviews, enquiries, reports moderation

**Files:**
- Create: `backend/src/modules/reviews/`, `backend/src/modules/enquiries/`, `backend/src/modules/reports/` (controller/routes/schema/service each + migrations for `Review`, `Enquiry`, `Report`)
- Modify: `backend/src/app.ts`
- Test: curl moderation flows

**Interfaces:**
- Consumes: `writeAudit`, `requirePermission`.
- Produces: review moderation (`reviews.moderate`: approve/hide/flag; `reviews.delete` soft-`DELETED`), enquiry assignment/status (`enquiries.manage`), report investigation (`reports.manage`: notes, resolve/reject/reopen). Public `POST /reviews`, `POST /enquiries`, `POST /reports` for users.

- [ ] **Step 1: Write the failing check**

```bash
ls backend/src/modules/reviews/ backend/src/modules/enquiries/ backend/src/modules/reports/ 2>/dev/null || echo "moderation modules missing"
```

- [ ] **Step 2: Run check to verify it fails**

Run: same ls command
Expected: `moderation modules missing`

- [ ] **Step 3: Implement the three models + modules**

`Review.moderationStatus VISIBLE/HIDDEN/FLAGGED/DELETED`; delete = status flip, row retained; report statuses `OPEN/INVESTIGATING/RESOLVED/REJECTED`; enquiry statuses `NEW/OPEN/RESPONDED/RESOLVED/CLOSED`.

- [ ] **Step 4: Run verification**

Run: post review → flag → hide → delete → row still present with `DELETED`; report lifecycle OPEN→INVESTIGATING→RESOLVED with note; enquiry NEW→RESPONDED→RESOLVED.
Expected: all transitions 200 + audit-logged; deleted review row retained (Review Focus line 3 pinned here).

- [ ] **Step 5: Commit**

```bash
git add backend/prisma/ backend/src/modules/reviews/ backend/src/modules/enquiries/ backend/src/modules/reports/ backend/src/app.ts
git commit -m "feat(backend): add reviews, enquiries, and reports moderation"
```

### Task 6: Extended stats + global search endpoints

**Files:**
- Modify: `backend/src/modules/admin/admin.service.ts`, `backend/src/modules/admin/admin.controller.ts`, `backend/src/modules/admin/admin.routes.ts`
- Create: `backend/src/modules/search/search.routes.ts` (thin aggregator; service logic inline)
- Test: curl range + search proofs

**Interfaces:**
- Consumes: all Layer 2 models; `requirePermission`.
- Produces: `GET /api/v1/admin/stats?from=&to=` returning every Section-1 counter plus per-day series for registrations/bookings/revenue/commission/activity/enquiries/reviews/cancellations (`stats.view`); `GET /api/v1/admin/search?q=` returning grouped hits across users/owners/gyms/bookings/transactions/reviews/enquiries/reports (`search.use`).

- [ ] **Step 1: Write the failing check**

```bash
curl -s "http://localhost:4000/api/v1/admin/search?q=gym@admin.com" -H "Authorization: Bearer $ADMIN_TOKEN" | grep -q "users" && echo "search exists" || echo "search missing"
```

- [ ] **Step 2: Run check to verify it fails**

Run: same curl
Expected: `search missing` (404)

- [ ] **Step 3: Implement stats extension + search aggregator**

Counters computed with date-range filters; series bucketed per day; search runs bounded `take: 5` per entity and groups by type; both endpoints paginated/bounded for performance.

- [ ] **Step 4: Run verification**

Run: `GET /stats?from=<30d>&to=<today>` returns counters + 30-point series; `GET /search?q=gym@admin.com` returns a `users` group containing that email plus any related groups.
Expected: both 200 with correct shapes (Layer 3 Review Focus line 3 relies on this).

- [ ] **Step 5: Commit**

```bash
git add backend/src/modules/admin/ backend/src/modules/search/
git commit -m "feat(backend): extend admin stats with ranges and add global search"
```

### Task 7: Notifications, content, settings

**Files:**
- Create: `backend/src/modules/notify/`, `backend/src/modules/content/`, `backend/src/modules/settings/` (controller/routes/schema/service each + migrations)
- Modify: `backend/src/app.ts`
- Test: curl publish + settings flows

**Interfaces:**
- Consumes: `writeAudit`, `requirePermission`.
- Produces: `POST /api/v1/admin/notifications` (audience + type + payload; `notifications.send`); content CRUD for banners/FAQ/pages/terms (`content.manage`, publish/unpublish — no code changes needed downstream); `GET/PUT /api/v1/admin/settings` incl. maintenance mode + feature flags (`settings.manage`); settings GET never returns secret values.

- [ ] **Step 1: Write the failing check**

```bash
curl -s -o /dev/null -w "%{http_code}" http://localhost:4000/api/v1/admin/settings -H "Authorization: Bearer $ADMIN_TOKEN" | grep -q 404 && echo "settings missing" || echo "settings exists"
```

- [ ] **Step 2: Run check to verify it fails**

Run: same curl
Expected: `settings missing` (404)

- [ ] **Step 3: Implement the three modules**

`PlatformSetting` key-value (e.g. `maintenance.mode`, `features.bookings`, `platform.name`); notification records audience/type/status; content items with slug + published flag.

- [ ] **Step 4: Run verification**

Run: toggle `features.bookings` off/on via PUT; publish + unpublish a banner; send announcement to all owners; GET settings shows keys with secrets redacted.
Expected: all 200; secrets absent from GET responses.

- [ ] **Step 5: Commit**

```bash
git add backend/prisma/ backend/src/modules/notify/ backend/src/modules/content/ backend/src/modules/settings/ backend/src/app.ts
git commit -m "feat(backend): add notifications, content, and settings modules"
```
