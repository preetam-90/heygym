# Gym Owner MVP Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement owner dashboard + single-gym CRUD + local photos + submit/approval + preview using existing auth/RBAC.

**Architecture:** Extend Prisma Gym + new GymImage with imageUrl sync; add StorageService abstraction (local FS now, S3/Supabase later); owner routes under `/api/v1/gyms` with `authenticate → requireRole('GYM_OWNER')` + token-derived ownership; rework Next.js owner dashboard in place and reuse public gym detail for preview.

**Tech Stack:** Fastify 4.26, Prisma 5.10, PostgreSQL 15, Next.js 14, React 18, RHF + Zod, `@fastify/multipart`, `@fastify/static`.

**Spec:** `gym-platform/docs/superpowers/specs/2026-09-29-gym-owner-mvp-design.md`

## Global Constraints

- Reuse existing `GymStatus` enum values only: `PENDING, UNDER_REVIEW, APPROVED, REJECTED, SUSPENDED` — no rename, no new enum.
- Owner endpoints: `authenticate → requireRole('GYM_OWNER')` only (never `requireRole('GYM_OWNER','ADMIN')`); admin stays on existing `/admin/*` RBAC + `gyms.approve`.
- Never trust frontend `gymId/ownerId`; ownership = `gym.ownerId === token.id`, else uniform 404 `{success:false,error:{code:'NOT_FOUND'}}`.
- Owner can never write `status/ownerId/rejectionReason/internalNotes/verifiedAt/deletedAt`; submit only via `POST /gyms/:id/submit`.
- Photos: JPG/JPEG/PNG/WebP only, ≤5MB each, ≤10 per gym; DB stores URL only via `StorageService`.
- Backend Zod authoritative; frontend mirrors for UX.
- Do NOT build: customers, GymMembership, plans changes, bookings, payments, analytics, CRM, messaging, AI, multi-gym UI.
- Keep `Gym.imageUrl` synced to primary for public pages.

## Review Focus

- IDOR by swapping `:id` to another owner's gym/photo → expect 404, no existence leak, no mutation.
- Oversize/bad-mime upload (e.g. 6MB, .exe, .svg) → expect 400 `VALIDATION_ERROR`, no file left on disk, count unchanged.
- 11th photo when 10 exist → expect 400, no upload.
- `PATCH /gyms/:id {status:'APPROVED'}` → status unchanged, 403 or stripped.
- Public `GET /gyms/:id` for PENDING/UNDER_REVIEW gym by anonymous → expect 404 (after guard), owner fetch via `/my` still works.

---

### Task 1: Prisma schema + migration

**Files:**
- Modify: `gym-platform/backend/prisma/schema.prisma`
- Test: `gym-platform/backend/prisma/migrations/` (new migration dir)

**Interfaces:**
- Consumes: existing `Gym`, `GymStatus` enum.
- Produces: `Gym.{website,state,pincode,latitude,longitude,facilities,services,openingTime,closingTime,rejectionReason,images}`, `GymImage.{id,gymId,url,isPrimary,createdAt,updatedAt}` for Tasks 2–4, 6.

- [ ] **Step 1: Extend schema**

Add to `Gym`: `website String?`, `state String?`, `pincode String?`, `latitude Float?`, `longitude Float?`, `facilities String[] @default([])`, `services String[] @default([])`, `openingTime String?`, `closingTime String?`, `rejectionReason String?`, `images GymImage[]`. Add model `GymImage { id String @id @default(cuid()), gymId String, gym Gym @relation(fields:[gymId], references:[id], onDelete:Cascade), url String, isPrimary Boolean @default(false), createdAt DateTime @default(now()), updatedAt DateTime @updatedAt, @@index([gymId]) }`.

- [ ] **Step 2: Validate + migrate**

Run: `cd gym-platform/backend && npx prisma validate && npx prisma format && npm run prisma:migrate -- --name gym_owner_mvp`
Expected: `Prisma schema is valid`, migration applies cleanly.

- [ ] **Step 3: Regenerate client + typecheck**

Run: `cd gym-platform/backend && npx prisma generate && npx tsc --noEmit`
Expected: PASS, no type errors.

- [ ] **Step 4: Commit**

```bash
git add gym-platform/backend/prisma/schema.prisma gym-platform/backend/prisma/migrations
git commit -m "feat(backend): extend Gym + GymImage for owner MVP"
```

### Task 2: Storage abstraction + upload plumbing

**Files:**
- Create: `gym-platform/backend/src/lib/storage.ts`
- Modify: `gym-platform/backend/src/app.ts`, `gym-platform/backend/package.json`
- Test: manual node check `gym-platform/backend/src/lib/storage.ts` exports

**Interfaces:**
- Consumes: `GymImage.url` shape from Task 1.
- Produces: `StorageService.upload(buffer: Buffer, opts:{mime:string,ext:string}) => Promise<{path:string,url:string}>`, `StorageService.delete(url:string) => Promise<void>`, `StorageService.getUrl(path:string)=>string` for Task 4.

- [ ] **Step 1: Install deps**

Run: `cd gym-platform/backend && npm i @fastify/multipart @fastify/static && npm i -D @types/node`
Expected: `package.json` lists both.

- [ ] **Step 2: Implement `LocalStorageService` in `src/lib/storage.ts`**

Env `STORAGE_DIR` default `<backend>/uploads`, `STORAGE_URL_PREFIX` default `/uploads/`. Random filename `cuid()+ext`, write buffer, return `{path, url}`. `delete()` resolves inside dir only (anti-traversal), ignores ENOENT. No DB logic here.

- [ ] **Step 3: Register plugins in `src/app.ts`**

Register `@fastify/multipart` with limits `{fileSize: 5*1024*1024, files: 1}` and `@fastify/static` `{root: STORAGE_DIR, prefix: '/uploads/'}`. Ensure `GET /uploads/*` public (no auth hook).

- [ ] **Step 4: Verify build**

Run: `cd gym-platform/backend && npx tsc --noEmit && npm run build`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add gym-platform/backend/src/lib/storage.ts gym-platform/backend/src/app.ts gym-platform/backend/package.json gym-platform/backend/package-lock.json
git commit -m "feat(backend): abstracted local storage for gym photos"
```

### Task 3: Gym validation schemas (Zod, backend authoritative)

**Files:**
- Modify: `gym-platform/backend/src/modules/gyms/gyms.schema.ts`
- Test: `npx tsc --noEmit` + manual zod parse node one-liner

**Interfaces:**
- Consumes: Task 1 fields.
- Produces: `CreateGymInput`, `UpdateGymInput`, `SubmitGymParams`, `PhotoParams` for Task 4; frontend mirrors in Task 6.

- [ ] **Step 1: Extend `createGymSchema.body` / `updateGymSchema.body`**

`name 2–120 req (create) / opt (update)`, `description ≤2000 opt`, `email email opt`, `phone ^[+0-9()\-\s]{7,20}$ opt`, `website url opt`, `address ≥5`, `city ≥2`, `state opt`, `pincode ^[1-9][0-9]{5}$ opt`, `latitude -90..90 opt`, `longitude -180..180 opt`, `facilities: enum[Cardio,Weight Training,CrossFit,Yoga,Parking,Locker,Shower,AC,Personal Training][] ≤20`, `services: string[2–80][] ≤30`, `openingTime/closingTime ^([01]\d|2[0-3]):[0-5]\d$ opt + refine open!==close`. Forbid `status/ownerId/imageUrl/rejectionReason/internalNotes/verifiedAt/deletedAt` via `.strict()` + strip list in controller. Photo schemas: `photoId cuid`, `gym id cuid`.

- [ ] **Step 2: Verify**

Run: `cd gym-platform/backend && npx tsc --noEmit`
Expected: PASS. Manual: `node -e "require('./dist/modules/gyms/gyms.schema.js')"` after build parses valid + rejects `{status:'APPROVED'}` and bad pincode.

- [ ] **Step 3: Commit**

```bash
git add gym-platform/backend/src/modules/gyms/gyms.schema.ts
git commit -m "feat(backend): owner gym validation (info, hours, photos)"
```

### Task 4: Owner gym service/controller/routes (CRUD + photos + submit + isolation)

**Files:**
- Modify: `gym-platform/backend/src/modules/gyms/gyms.service.ts`, `gyms.controller.ts`, `gyms.routes.ts`
- Modify (small): `gym-platform/backend/src/modules/admin/admin.service.ts` (set/clear `rejectionReason` on approve/reject)
- Test: backend build + curl matrix against dev server + seeded two owners

**Interfaces:**
- Consumes: Tasks 1–3, `StorageService`, existing `authenticate/requireRole`, `AuditLog`.
- Produces: `POST /gyms`, `GET /gyms/my`, `PATCH /gyms/:id`, `POST /gyms/:id/photos`, `DELETE /gyms/:id/photos/:photoId`, `PATCH /gyms/:id/photos/:photoId/primary`, `POST /gyms/:id/submit` for Task 6–7.

- [ ] **Step 1: Service — extend CRUD + ownership helper**

`requireOwnedGym(gymId, ownerId)` → returns gym+images or throws `NOT_FOUND` (single error for missing vs not-owned). `createGym` sets `PENDING`, includes images. `getGymsByOwner` includes `images orderBy isPrimary desc, createdAt desc`. `updateGym` strips forbidden keys, updates allowed, returns with images. Photo methods transactional: count ≤10 check, create (first photo → `isPrimary=true`), delete (file via Storage + resync `imageUrl`), setPrimary (unset others, sync `imageUrl`), all via `requireOwnedGym`. `submitGym`: allow `PENDING|REJECTED` (idempotent `UNDER_REVIEW`), clear `rejectionReason`, set `UNDER_REVIEW`; else throw `FORBIDDEN_STATE`. `syncImageUrl(tx,gymId)` = `primary?.url ?? newest?.url ?? null`.

- [ ] **Step 2: Service — guard public fetch + admin rejectionReason**

`getGymById(id, viewer?)`: if `status!==APPROVED` and viewer not owner/admin → return null (controller →404). `AdminService.updateGymStatus`: on `REJECTED` set `rejectionReason=reason ?? null`; on `APPROVED` clear `rejectionReason=null`, set `verifiedAt=now()`.

- [ ] **Step 3: Controller — status stripping + code mapping**

Map `NOT_FOUND→404`, `FORBIDDEN_STATE→403 {code:'FORBIDDEN'}`, Zod→400 `VALIDATION_ERROR`. Multipart handler: check `mime ∈ image/jpeg,image/png,image/webp` + ext match, buffer ≤5MB (plugin limit + explicit), then service. Never echo stack.

- [ ] **Step 4: Routes — GYM_OWNER-only + public guard**

`POST / + PATCH /:id + POST /:id/photos + DELETE /:id/photos/:photoId + PATCH /:id/photos/:photoId/primary + POST /:id/submit + GET /my` → `preHandler [authenticate, requireRole('GYM_OWNER')]`. `GET / + GET /:id` stay public (service guard handles). No `ADMIN` on owner routes.

- [ ] **Step 5: Verify (dev server + isolation matrix)**

Run: `npm run build && npm run dev` (port 4000), seed ownerA/ownerB gyms, then: `A GET /gyms/my` 200 only A's; `A GET/PATCH/POST-photos/POST-submit B-id` →404; `USER token POST /gyms` →403; no token →401; `PATCH {status:APPROVED}` unchanged; bad mime/6MB/11th →400; public anon `GET B-pending-id` →404.
Expected: all matrix lines pass.

- [ ] **Step 6: Commit**

```bash
git add gym-platform/backend/src/modules/gyms gym-platform/backend/src/modules/admin/admin.service.ts
git commit -m "feat(backend): owner gym CRUD, photos, submit with isolation"
```

### Task 5: Frontend types + API client

**Files:**
- Modify: `gym-platform/frontend/types/index.ts`, `gym-platform/frontend/lib/api.ts`
- Test: `cd gym-platform/frontend && npx tsc --noEmit`

**Interfaces:**
- Consumes: Task 4 endpoints.
- Produces: `GymImage`, extended `Gym`, `api.{getMyGyms,createGym,updateGym,uploadGymPhoto,deleteGymPhoto,setPrimaryPhoto,submitGym,getProfile,updateProfile}` for Task 6.

- [ ] **Step 1: Extend types**

`GymStatus += 'UNDER_REVIEW'|'SUSPENDED'`; `Gym += website?,state?,pincode?,latitude?,longitude?,facilities:string[],services:string[],openingTime?,closingTime?,rejectionReason?,images?:GymImage[]`; `interface GymImage{id,gymId,url,isPrimary,createdAt,updatedAt}`. Keep `imageUrl` deprecated-but-synced.

- [ ] **Step 2: Extend `ApiClient`**

`getMyGyms():Gym[]` (include images), `createGym/updateGym(Partial<Gym>)`, `uploadGymPhoto(gymId, File)` via `FormData` (no JSON content-type override; keep auth header + credentials), `deleteGymPhoto/setPrimaryPhoto/submitGym(gymId)`, reuse `me()` for profile. Parse `ApiResponse` same as existing.

- [ ] **Step 3: Verify**

Run: `cd gym-platform/frontend && npx tsc --noEmit && npm run lint`
Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add gym-platform/frontend/types/index.ts gym-platform/frontend/lib/api.ts
git commit -m "feat(frontend): owner gym types + photo/submit client"
```

### Task 6: Owner dashboard + my-gym + photos + preview (reuse conventions)

**Files:**
- Modify: `gym-platform/frontend/app/gym-owner/dashboard/page.tsx`
- Create: `gym-platform/frontend/app/gym-owner/my-gym/page.tsx`, `gym-platform/frontend/app/gym-owner/my-gym/photos/page.tsx`
- Reuse (import, no duplicate): `gym-platform/frontend/app/gyms/[id]/page.tsx` display bits + `components/gym-card.tsx`, `components/ui/*`
- Test: `npm run build`, manual flow

**Interfaces:**
- Consumes: Task 5 client.
- Produces: working owner UI for verification Task 7.

- [ ] **Step 1: Dashboard rework (single-gym UX, multi-tolerant)**

Empty → `"You haven't added your gym yet" + [Add Your Gym] → /gym-owner/my-gym`. With gym (first of `/my`): `Welcome, name` (from `api.me()` reuse); cards: name, status badge (PENDING yellow / UNDER_REVIEW blue / APPROVED green / REJECTED red / SUSPENDED gray), completion % (9 checks: name,description,address,city,phone,email,≥1 photo,≥1 facility,times), photo count; primary action by state (none→create, PENDING/REJECTED→Submit/Resubmit, UNDER_REVIEW→disabled, APPROVED→Manage/Preview); REJECTED banner shows `rejectionReason + [Edit][Resubmit]`; links `[Manage Gym] → my-gym`, `[Preview Gym] → /gyms/:id` (existing public page, no duplicate markup), `[Settings]` reuses `GET/PATCH /users/me` (name/email only). Loading/empty/error states + toasts per existing Button/Card patterns.

- [ ] **Step 2: `my-gym` edit form**

RHF+Zod mirror of backend (name req, lengths, email/phone/pincode/times, facilities chips allowlist, services tag add/remove, lat/lng numeric). Save → `updateGym` (create if none) → success toast, persist after refresh.

- [ ] **Step 3: `my-gym/photos` grid**

Grid, file input (accept jpg/png/webp), per-file progress/loading, primary badge, Set primary, Delete confirm dialog, mime/size/count errors from server verbatim, empty state.

- [ ] **Step 4: Verify**

Run: `cd gym-platform/frontend && npx tsc --noEmit && npm run lint && npm run build`
Expected: PASS. Manual: create→edit→upload→primary→delete→preview matches saved→submit→status.

- [ ] **Step 5: Commit**

```bash
git add gym-platform/frontend/app/gym-owner
git commit -m "feat(frontend): owner dashboard, edit, photos, preview"
```

### Task 7: End-to-end verification + security matrix

**Files:** none (verification only; fix forward in owning task if failures).

- [ ] **Step 1: Checks**

Run: `cd gym-platform/backend && npx tsc --noEmit && npx prisma validate && npm run build`; `cd ../frontend && npx tsc --noEmit && npm run lint && npm run build`.
Expected: all PASS.

- [ ] **Step 2: Flow + matrix**

Run Task 4 Step 5 matrix + full flow: register GYM_OWNER → dashboard → create → upload → primary → edit → preview → submit → admin reject w/ reason → see reason → edit → resubmit → admin approve → public listing. Confirm refresh persistence, suspended/banned still 403.
Expected: documented PASS lines, no 500s.

- [ ] **Step 3: Final commit if fixes**

```bash
git status --short
# commit only if fixes were needed
```
