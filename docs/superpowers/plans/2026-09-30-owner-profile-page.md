# Owner Profile Page Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A dedicated `/owner/profile` page where gym owners edit name, phone, email, and avatar (file upload), reusing existing backend profile logic plus one new avatar-upload endpoint.

**Architecture:** Backend adds `POST /api/v1/users/me/avatar` in the existing users module, mirroring the gym-photo upload pattern (`request.file()` → validate mime/ext/size → `lib/storage.ts` → set `avatarUrl`). Frontend adds the page under the existing owner layout, extends the single `lib/api.ts` client, and refreshes auth state via `refreshUser()`. No new tables, no schema changes.

**Tech Stack:** Fastify + Prisma (backend), Next.js 14 + `lib/api.ts` + `auth-context` (frontend), Vitest (backend tests).

**Spec:** In-chat approved design (2026-09-30): dedicated `/owner/profile` page; fields name/phone/email(editable)/avatar-upload; removal via existing `PATCH avatarUrl: null`; password change out of scope; `/profile` untouched.

## Global Constraints

- Reuse existing architecture; no new features beyond the approved design.
- Do not modify unrelated files.
- Never return `passwordHash` in API responses (existing `publicSelect` already excludes it).
- Web auth stays HttpOnly-cookie based; no refresh tokens in localStorage.
- Backend avatar rules match gym photos exactly: JPG/PNG/WebP only, ≤5 MB.
- Frontend follows existing owner visual language (rounded-2xl cards, `ui-states` loading/empty/error).

## Review Focus

- Oversized avatar (>5 MB) is rejected with a clear message, not a silent failure.
- Non-image upload (e.g. `.exe` as `application/octet-stream`) is rejected.
- Unauthenticated avatar upload returns 401, not 500.
- Saving an email/phone already used by another account surfaces the conflict message.
- After upload, the displayed avatar updates without a stale cached image.

---
### Task 1: Backend avatar upload endpoint

**Files:**
- Modify: `backend/src/modules/users/users.service.ts` (add `setAvatar`)
- Modify: `backend/src/modules/users/users.controller.ts` (add `uploadAvatar`)
- Modify: `backend/src/modules/users/users.routes.ts` (register `POST /me/avatar`)
- Test: `backend/tests/profile.test.ts`

**Interfaces:**
- Consumes: `storage.upload(buffer, { mime, ext })` from `backend/src/lib/storage.ts`; existing `publicSelect` in `users.service.ts`.
- Produces: `UsersService.setAvatar(userId: string, buffer: Buffer, mime: string, filename: string) => Promise<User>` (validates mime/ext/size with the same `ALLOWED_PHOTO_MIME` map and 5 MB limit as gym photos, uploads via storage, updates `avatarUrl`, returns `publicSelect` user); `POST /api/v1/users/me/avatar` (authenticated multipart, returns `{ success: true, data: { user } }`).

- [ ] **Step 1: Write the failing tests in `backend/tests/profile.test.ts`**

```ts
// register a USER via helpers, then:
test('rejects unauthenticated avatar upload', ...) // POST /api/v1/users/me/avatar without token → 401
test('rejects non-image upload', ...)              // multipart .txt as application/octet-stream → 400
test('uploads avatar and returns avatarUrl', ...)  // multipart dummy buffer as image/png + .png → 200, data.user.avatarUrl contains '/uploads/'
test('clears avatar via PATCH', ...)               // PATCH /api/v1/users/me { avatarUrl: null } → 200, avatarUrl null
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `/usr/bin/node ./node_modules/vitest/vitest.mjs run tests/profile.test.ts` (from `backend/`)
Expected: FAIL — route `POST /api/v1/users/me/avatar` returns 404

- [ ] **Step 3: Implement `setAvatar` in `users.service.ts`, `uploadAvatar` in `users.controller.ts`, register route in `users.routes.ts`**

Mirror `gyms.controller.ts` `uploadPhoto`: `request.file()` → missing file 400 → service validates mime/ext/size → storage upload → `prisma.user.update({ avatarUrl })`. On storage success but DB failure, delete the uploaded file (same compensation as gym photos).

- [ ] **Step 4: Run tests to verify they pass**

Run: `/usr/bin/node ./node_modules/vitest/vitest.mjs run` (from `backend/`)
Expected: all suites PASS (existing 9 + new 4)

- [ ] **Step 5: Commit**

```bash
git add backend/src/modules/users backend/tests/profile.test.ts
git commit -m "feat(backend): owner avatar upload endpoint"
```

### Task 2: Frontend owner profile page

**Files:**
- Create: `frontend/app/owner/profile/page.tsx`
- Modify: `frontend/lib/api.ts` (add `uploadAvatar`)
- Modify: `frontend/app/owner/layout.tsx` (add `{ href: '/owner/profile', label: 'Profile' }` to `NAV`)
- Test: no frontend test runner exists; verification is typecheck + build + live click-through (see steps)

**Interfaces:**
- Consumes: `api.updateProfile({ name, phone, email, avatarUrl })` (exists), `useAuth().refreshUser()` (exists), `LoadingSkeleton`/`ErrorState` from `components/ui-states` (exist).
- Produces: `api.uploadAvatar(file: File) => Promise<User>` (FormData POST to `/users/me/avatar` with Bearer + `credentials: include`, mirroring `uploadGymPhoto`); `/owner/profile` page rendering avatar preview, name/phone/email inputs, save with busy/error/saved states.

- [ ] **Step 1: Add `uploadAvatar` to `frontend/lib/api.ts`**

Exact signature: `async uploadAvatar(file: File): Promise<User>` — builds `FormData` with `file`, POSTs `/users/me/avatar`, returns `data.user`, throws friendly message on non-OK.

- [ ] **Step 2: Add Profile entry to owner `NAV` in `frontend/app/owner/layout.tsx`**

- [ ] **Step 3: Create `frontend/app/owner/profile/page.tsx`**

Sections: avatar block (current image via `photoSrc(user.avatarUrl)` or initial fallback, file input accept `image/jpeg,image/png,image/webp`, client-side 5 MB pre-check, Upload button with progress state), fields block (name min 2, phone pattern hint, email), Save calling `updateProfile` then `refreshUser()`, Remove-avatar button calling `updateProfile({ avatarUrl: null })`. Reuse `/profile` page structure and classes; unauthenticated state shows login `EmptyState`.

- [ ] **Step 4: Run typecheck and build**

Run: `npx tsc --noEmit` then `/usr/bin/node ./node_modules/next/dist/bin/next build` (from `frontend/`)
Expected: zero errors; `/owner/profile` listed in routes

- [ ] **Step 5: Live verification against local backend**

Backend up (`/health` 200). Click-through: log in as `owner1@heygym.dev`, open `/owner/profile`, change phone → save → reload (persists), upload PNG (avatar appears), remove avatar, attempt duplicate email (conflict message shows). Confirm legacy `/profile` and dashboards unaffected.

- [ ] **Step 6: Commit**

```bash
git add frontend/app/owner frontend/lib/api.ts
git commit -m "feat(frontend): dedicated owner profile page with avatar upload"
```
