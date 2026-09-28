# Gym Owner Basic MVP — Design Spec

Date: 2026-09-29
Status: Draft for review (DO NOT IMPLEMENT YET)
Scope: Owner auth (existing) + dashboard + create/edit one gym + photos + submit/approval status + preview + owner profile. No customers, no memberships, no future-phase features.

## 1. Existing Architecture Discovered (verified in repo)

### 1.1 Layout
- `gym-platform/frontend/`: Next.js 14 App Router + React 18 + Tailwind 3.4 + TS 5.3 + RHF 7.50 + Zod 3.22 + lucide-react. `app/layout.tsx` wraps `AuthProvider` + `Navbar` + `Footer`. Theme: dark `#09090B`, volt `#D4FF4F`, `Card/Button/Input/Label/Textarea` in `components/ui/`.
- `gym-platform/backend/`: Fastify 4.26 + TS + Prisma 5.10 + PostgreSQL 15 + Argon2 + `@fastify/jwt` + Zod + `fastify-zod`. Routes mounted in `src/app.ts`: `/api/v1/auth`, `/api/v1/users`, `/api/v1/gyms`, `/api/v1/admin` (admin + audit). Error shape `{success, data?, error:{code,message}}`.
- `gym-platform/backend/prisma/`: `schema.prisma` is source of truth. `supabase/schema.sql` is an alternative UUID/RLS schema (lowercase `pending/approved/rejected`, single `image_url`) — NOT primary. Do not mix.
- Docs: `gym-platform/README.md` documents API table and Prisma sketch (README sketch is stale vs actual `schema.prisma`).

### 1.2 Auth (reuse as-is)
- `src/plugins/auth.ts`: access JWT 15m (`JWT_ACCESS_SECRET`), refresh JWT 7d (`refreshAuthenticate`, namespace `refresh`), `@fastify/cookie`. `authenticate` does `jwtVerify` then per-request `prisma.user` lookup: missing → 401 `UNAUTHORIZED`; `SUSPENDED/BANNED` → 403 `ACCOUNT_SUSPENDED/ACCOUNT_BANNED` + audit write. This enforcement must keep working for all new owner routes.
- `requireRole(...roles)`: re-verifies JWT, checks `request.user.role ∈ roles`, else 403 `FORBIDDEN`. `requirePermission` (`src/plugins/permissions.ts`): `ADMIN` has all perms including `gyms.approve`; `GYM_OWNER` has none. Admin status route chains `authenticate + requireRole('ADMIN') + requirePermission('gyms.approve')`.
- `modules/auth/auth.schema.ts`: `register {name≥2, email, password≥8, role: USER|GYM_OWNER default USER}`, `login {email,password}`. No admin self-register. Frontend `lib/api.ts` stores `accessToken/refreshToken/user` in localStorage, silent refresh on 401, `lib/auth-context.tsx` verifies via `GET /auth/me`.
- Owner auth for MVP: existing register/login/me only. No new auth.

### 1.3 User → Gym relationship (actual Prisma)
```prisma
enum Role { USER GYM_OWNER ADMIN }
enum GymStatus { PENDING APPROVED REJECTED UNDER_REVIEW SUSPENDED }
enum UserStatus { ACTIVE SUSPENDED BANNED }
model User { id cuid PK, name, email unique, passwordHash, role default USER, status default ACTIVE, lastLoginAt?, deletedAt?, emailVerifiedAt?, phoneVerifiedAt?, createdAt, updatedAt, gyms Gym[], resetToken? unique, resetTokenExpiry? }
model Gym { id cuid PK, ownerId FK User.id cascade, owner, name, description?, address, city, phone?, email?, imageUrl?, status default PENDING, verifiedAt?, deletedAt?, internalNotes?, createdAt, updatedAt, membershipPlans MembershipPlan[] }
model MembershipPlan { id cuid PK, gymId FK cascade, name, description?, price Float, duration Int, createdAt, updatedAt }
model AuditLog { id cuid PK, actorId?, action, targetType?, targetId?, reason?, ip?, createdAt, @@index(actorId, createdAt) }
```
- No `website/state/pincode/latitude/longitude/facilities/services/openingTime/closingTime/rejectionReason` fields. No `GymImage`. No `GymMembership`/customer link. `internalNotes` is admin-only; rejection reason currently only lives in `AuditLog.reason` (see 1.4).
- Migration `20260929022602_admin_foundation` added `UNDER_REVIEW, SUSPENDED` to `GymStatus`, `User.status`, `verifiedAt/deletedAt/internalNotes`, `AuditLog`. `0_init` is base.

### 1.4 Approval / rejection workflow (actual)
- Admin: `PATCH /api/v1/admin/gyms/:id/status` body `{status: APPROVED|REJECTED, reason? ≤1000}` (`admin.schema.ts`). Service `AdminService.updateGymStatus` runs transaction: `gym.update status` + `writeAudit(gym.approve|gym.reject, reason, actorId, ip)`. `GET /admin/gyms`, `GET /admin/stats` (`totalUsers,totalGyms,pendingGyms,approvedGyms,rejectedGyms`).
- Gap: admin API only exposes `APPROVED|REJECTED`; `UNDER_REVIEW/SUSPENDED` exist in enum but have no admin route. Owner submit flow does not exist.
- Reused business flow for MVP (no enum change):
  `Owner POST /gyms → PENDING (initial, editable) → Owner POST /gyms/:id/submit → UNDER_REVIEW → Admin APPROVED|REJECTED (reason in AuditLog + surfaced) → REJECTED owner edits → resubmit → UNDER_REVIEW`.
  Owner never writes `status` directly. `SUSPENDED/verifiedAt/deletedAt/internalNotes` remain admin-only.

### 1.5 Existing gym / user APIs (reuse, with fixes)
- `GET /gyms` → approved only. `GET /gyms/:id` → public by id (currently returns ANY status — preview/isolation risk noted in §8). `GET /gyms/my` → `authenticate` only (no role check today), returns `where ownerId=token.id + membershipPlans`. `POST /gyms` → `authenticate + requireRole(GYM_OWNER,ADMIN)`; `PATCH /gyms/:id` same; service checks `gym.ownerId===ownerId` but controller maps to 400 (should be 403/404-safe per §5). Membership-plan routes out of MVP scope (do not extend).
- `GET/PATCH /users/me` → `authenticate`; service allows `name,email` only. `changePassword` exists in `UsersService` but has NO route — owner password change reuses existing auth reset flow or a later phase; do not add new password API in MVP unless trivial reuse. Owner profile = existing `/me` only (+ name/email). No phone/photo on User today — do not add User columns in MVP.
- Validation convention: Zod `*.schema.ts` with `{body, params}` shapes (`fastify-zod` installed but routes currently call controllers directly without schema hooks — follow existing controller-try/catch + `{success:false,error:{code,message}}` pattern; add Zod parsing in controller/service, backend authoritative).

### 1.6 Frontend conventions (follow, don't reinvent)
- Owner dashboard exists at `app/gym-owner/dashboard/page.tsx`: multi-gym list + inline create-gym (`name,address,city,phone,email,description`) + plans management. MVP reworks this route in place toward single-gym UX (keep multi-compatible backend). `Navbar` already links Owner Dashboard for `GYM_OWNER,ADMIN`.
- Public gym UI to reuse for preview: `app/gyms/[id]/page.tsx` (cover `imageUrl`, status badge, address/city, phone/email cards, plans, owner card) + `components/gym-card.tsx`. Preview must link to / reuse this UI, not duplicate it.
- `types/index.ts`: `Role`, `GymStatus='PENDING'|'APPROVED'|'REJECTED'` (narrower than backend enum — must widen to include `UNDER_REVIEW|SUSPENDED` for status display), `Gym`, `MembershipPlan`, `ApiResponse`, `AuthResponse`. `lib/api.ts` is the single client (add methods there, same `request()` + refresh pattern).

## 2. Proposed Database Changes (only genuinely missing)

- Extend `Gym` (all nullable/optional except where noted, to avoid backfill):
  `website String?`, `state String?`, `pincode String?`, `latitude Float?`, `longitude Float?`, `facilities String[] @default([])`, `services String[] @default([])`, `openingTime String?` (HH:MM 24h), `closingTime String?`.
  Rejection surfacing: add `rejectionReason String?` (owner-readable, set only by admin flow; keeps MVP simple vs querying AuditLog). Keep `internalNotes` admin-only, `imageUrl` for backward compat.
- New `GymImage`:
  `id cuid PK, gymId FK Gym.id onDelete Cascade, url String, isPrimary Boolean @default(false), createdAt default now, updatedAt @updatedAt, @@index([gymId])` + relation `Gym.images GymImage[]`.
  Sync rule: create/update/delete/primary ops maintain `Gym.imageUrl = primary?.url ?? newest?.url ?? null` in same transaction so public pages (`imageUrl`) keep working.
- No `GymMembership`, no User columns, no enum change, no `GymStatus` rename. Migration via `prisma migrate dev` + `prisma generate`; no data deletion.

## 3. API Changes (reuse first)

Reuse unchanged: `POST /auth/*`, `GET /auth/me`, `GET /users/me`, `PATCH /users/me`, `GET /gyms`, `GET /gyms/:id`, `GET /admin/*`, `PATCH /admin/gyms/:id/status`.
Modify:
- `POST /gyms`: extend Zod body with §2 fields (arrays capped, times, lat/lng, website/url, pincode). Auth: `authenticate + requireRole('GYM_OWNER')` (drop ADMIN from owner path per correction; admins use admin routes). Creates `PENDING`.
- `GET /gyms/my` → renamed semantics `Get My Gym`: add `requireRole('GYM_OWNER')`, include `images orderBy isPrimary desc, createdAt desc` + `owner select id,name,email`. Keep returning list for compat but frontend treats first as primary; alternatively add `GET /gyms/mine/primary`. Prefer keeping `/my` + frontend single-gym UX.
- `PATCH /gyms/:id`: extend Zod (same fields, all optional), strip/forbid `status/ownerId/imageUrl-direct/rejectionReason/internalNotes/verifiedAt` from owner input (return 403 if attempted). Auth `authenticate + requireRole('GYM_OWNER')` + ownership check. If gym is `UNDER_REVIEW/APPROVED`, edit allowed but sets back to `PENDING`? Decision: editing `REJECTED` keeps `REJECTED` until resubmit; editing `UNDER_REVIEW` stays `UNDER_REVIEW` (no silent status change); editing `APPROVED` stays `APPROVED` (admin re-review out of scope). Document choice in implementation.
New (owner):
- `POST /gyms/:id/photos` (multipart): `authenticate + requireRole('GYM_OWNER')` + ownership + limits (§6). Returns `{image}` + updated `gym.imageUrl`.
- `DELETE /gyms/:id/photos/:photoId`: ownership + delete file via StorageService + DB; resync primary.
- `PATCH /gyms/:id/photos/:photoId/primary`: ownership + transaction unset others + set one + sync `imageUrl`.
- `POST /gyms/:id/submit`: ownership; allowed from `PENDING|REJECTED` (and optionally `UNDER_REVIEW` idempotent); sets `UNDER_REVIEW`, clears `rejectionReason` on resubmit. From `APPROVED/SUSPENDED` → 403. Never accepts a status from body.
Response codes: unauthenticated 401; wrong role 403; not-owner / not-found → 404 `{code:'NOT_FOUND'}` without leaking existence (do not distinguish); validation → 400 `VALIDATION_ERROR`; suspended/banned handled by `authenticate` (403).

## 4. Authorization Model

- Owner endpoints: `authenticate → requireRole('GYM_OWNER') → load gym by :id → if !gym or gym.ownerId !== token.id → 404` (uniform, no existence leak) → operate. Never trust body `gymId/ownerId`. `GET /gyms/my` derives owner from token only (no param).
- Admin: unchanged `authenticate + requireRole('ADMIN') + requirePermission('gyms.approve')` on `/admin/*`. Owner routes must NOT grant ADMIN (separation per correction).
- `USER` role on owner routes → 403. No-token → 401 via `authenticate`. Suspended/banned → existing 403 via `authenticate`.
- Photos inherit gym ownership (check parent gym, not image id alone). `updateGym` must also verify `plan.gymId` style consistency already in service — reuse pattern.

## 5. Storage Approach (abstracted local FS)

- New `backend/src/lib/storage.ts`:
  `StorageService { upload(buffer, {mime, ext}) => {path, url}, delete(url|path), getUrl(path) }`.
  MVP impl `LocalStorageService`: writes under `STORAGE_DIR` (default `<backend>/uploads`, env-overridable), serves via `@fastify/static` prefix `/uploads/` (add `GET /uploads/*` — public read, no auth; random filenames `cuid + ext` to avoid traversal). DB stores only URL path (`/uploads/<file>`); `GymImage` + frontend APIs unchanged when swapping to S3/Supabase later (new class implementing same interface + `STORAGE_PROVIDER` env).
- Need new deps: `@fastify/multipart`, `@fastify/static`. No other infra.
- Validation (§6) enforced server-side before `upload()`; client mirrors for UX only.

## 6. Validation (Zod, backend authoritative)

Backend (`gyms.schema.ts` extended):
- `name` required 2–120; `description` ≤2000 optional; `email` email optional; `phone` `^[+0-9()\-\s]{7,20}$` optional; `website` url optional; `address` ≥5, `city` ≥2, `state` optional, `pincode` `^[1-9][0-9]{5}$` (India) optional — keep optional for MVP flexibility; `latitude -90..90`, `longitude -180..180` optional; `facilities` from allowlist `[Cardio,Weight Training,CrossFit,Yoga,Parking,Locker,Shower,AC,Personal Training]` ≤20; `services` string[] each 2–80, ≤30; `openingTime/closingTime` `^([01]\d|2[0-3]):[0-5]\d$`, require open≠close (allow overnight close<open? MVP: require open<close, document).
- Photos: mime `image/jpeg|image/png|image/webp` (extension check too), ≤5MB each, ≤10 per gym (count check in transaction), `isPrimary` single enforced.
Frontend: mirror with RHF+Zod for instant errors; server messages displayed verbatim.

## 7. Frontend UX / Pages (follow existing conventions)

Reuse `app/gym-owner/dashboard` structure, Volt/Card/Button patterns, `api.ts` + `useAuth`.
- `app/gym-owner/dashboard/page.tsx` (rework): states loading/error/empty (`"You haven't added your gym yet" → [Add Your Gym]`). With gym: header `Welcome, name`; cards: My Gym `{name, status badge (PENDING/UNDER_REVIEW/APPROVED/REJECTED/SUSPENDED colors), completion %, photo count, [Manage Gym] [Preview Gym]}`; status banner with `rejectionReason` when REJECTED + `[Edit Gym] [Resubmit]`; primary action selector by state (no-gym→create, PENDING/REJECTED→submit, UNDER_REVIEW→disabled pending, APPROVED→manage/preview).
- `app/gym-owner/my-gym/page.tsx` (edit): sections Basic/Location/Gym Info (facilities multi-select chips, services tag-list add/remove, times). Save → `PATCH`, toast success, persist check.
- `app/gym-owner/my-gym/photos/page.tsx`: grid, upload input (progress/loading, type/size errors), primary badge, Set primary, Delete with confirm dialog, empty state (`No photos → [Upload Photos]`).
- `app/gym-owner/my-gym/preview/page.tsx` or direct link: render existing `GymDetail`/`GymCard` components with `GET /gyms/:id` data (actual saved data). No duplicate detail markup — import/refactor shared component if needed.
- Owner profile: existing `/users/me` GET/PATCH via settings section (name/email); no new UI beyond wiring into dashboard Settings link. Follow `Navbar` role links.
- Completion %: required set `{name,description,address,city,phone,email,≥1 photo,≥1 facility,times}` → percent.

## 8. Approval Flow (existing statuses only)

`POST /gyms → PENDING → POST /:id/submit → UNDER_REVIEW → Admin PATCH /admin/gyms/:id/status {APPROVED|REJECTED, reason} → APPROVED (public in GET /gyms) | REJECTED (owner sees reason, edits, POST /:id/submit again)`.
Owner cannot set APPROVED/SUSPENDED/any status directly (stripped + 403). `GET /gyms/:id` public leak note: today returns non-approved gyms too — for MVP either (a) restrict public to APPROVED + owner/admin bypass, or (b) leave + document as known issue with preview using owner-scoped fetch. Recommended (a) in implementation (small service guard).

## 9. Security / Data Isolation Tests

- A→B gym access/modify/photo/submit by ID swap → 404 (not 403-leak). USER token on owner routes → 403. No token → 401. Owner body `{status:APPROVED}` → ignored/403, status unchanged. Suspended/banned owner → 403 via `authenticate`. `GET /gyms/my` never accepts owner id param.

## 10. Testing / Acceptance

Manual flow: Register GYM_OWNER → Dashboard empty → Create gym → Edit → Upload ≤10 (reject bad mime/oversize) → Set primary (imageUrl sync) → Delete (confirm) → Preview matches saved → Submit (PENDING/REJECTED→UNDER_REVIEW) → Admin REJECT with reason → owner sees reason → Edit → Resubmit → Admin APPROVE → public listing shows it.
Checks: `tsc --noEmit` (frontend+backend), `eslint`, `prisma validate + migrate dev`, `npm run build` both, refresh-persistence, isolation matrix above.

## 11. Explicitly Deferred (do not build)

Customers section, `GymMembership`, membership-plan management changes, bookings, payments/payouts/commission, staff, promotions/coupons, analytics, CRM, messaging, AI, advanced notifications, multi-gym UI, User phone/photo columns, password-change route, Supabase/S3 swap (interface-ready only).

## 12. Files / Models / APIs Affected (anticipated)

- `backend/prisma/schema.prisma` (+migration): `Gym` fields, `GymImage` + relation.
- `backend/src/lib/storage.ts` (new), `src/app.ts` (register multipart/static), `package.json` (+2 deps).
- `backend/src/modules/gyms/{gyms.schema,gyms.service,gyms.controller,gyms.routes}.ts` (extend + photos + submit + 401/403/404 mapping + GYM_OWNER-only).
- `frontend/types/index.ts` (widen `GymStatus`, add `GymImage`, extend `Gym`), `lib/api.ts` (my gym, photos, submit, profile), `app/gym-owner/dashboard/page.tsx` (rework) + `my-gym/*` pages, reuse `app/gyms/[id]`, `gym-card`.
- No changes to `admin/*`, `permissions.ts`, `supabase/schema.sql`, auth core.
