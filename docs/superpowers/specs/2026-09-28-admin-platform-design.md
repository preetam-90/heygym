# Admin Platform Design — heygym-admin (separate repo, same backend)

Date: 2026-09-28
Status: approved sections 1–3 in chat; pending written-spec review

## 1. Understanding

- Said: gym-owner submissions go PENDING; admin must approve; want a separate admin platform; ask if same backend is right.
- Assumptions confirmed: same Fastify backend is correct; separate frontend repo; full backoffice scope; same login + ADMIN role.
- Success: admin logs in separately, sees pending queue first, approves/rejects with feedback, manages users/gyms/stats without touching main app.

## 2. Architecture (Section 1)

- Same backend. No new service. Reuse existing endpoints:
  - POST /api/v1/auth/login, GET /api/v1/auth/me
  - GET /api/v1/admin/users, GET /api/v1/admin/gyms
  - GET /api/v1/admin/stats, PATCH /api/v1/admin/gyms/:id/status
- New repo `heygym-admin` (Next.js 14, Tailwind, same dark volt theme family but distinct admin chrome).
- Env: NEXT_PUBLIC_API_URL points to same backend (e.g. https://api.heygym.example/api/v1 locally http://localhost:4000/api/v1).
- Only backend change: CORS allowlist adds admin origin alongside main FRONTEND_URL.
- Main repo untouched at runtime; admin repo copies api client + AuthProvider patterns (no shared package in v1).

## 3. Components (Section 2)

- /login — ADMIN-only guard: after /me, non-ADMIN gets access-denied, no silent redirect loop.
- / — stats overview cards (totalUsers, totalGyms, pendingGyms, approvedGyms, rejectedGyms).
- /gyms-pending — default landing queue: table with gym, owner, city, created date, plans count; Approve / Reject with optional reason; detail drawer with photos, description, contact.
- /gyms — all gyms with status filter + search; same actions for pending rows.
- /users — users table with role badge, joined date, search.
- Shared: api client (SSR-safe storage, single-flight refresh), AuthProvider, ui button/card/table primitives.

## 4. Data flow & safety (Section 3)

- Flow: admin login -> JWT stored -> /me role check -> stats + pending load in parallel -> PATCH status -> optimistic update with rollback on failure -> refetch stats.
- Gym lifecycle unchanged: owner POST /gyms creates PENDING; only ADMIN PATCH flips to APPROVED/REJECTED.
- Errors: 401 triggers refresh then logout to /login; 403 shows access-denied; network errors surface inline with retry; approve/reject failures roll back row state.
- Testing (v1 manual): ADMIN login guard, non-ADMIN blocked, pending approve roundtrip, reject roundtrip, users/stats load, CORS from admin origin.

## 5. Non-goals (v1)

- No new auth system, no separate users table, no backend rewrite.
- No shared component package, no SSO, no audit-log table (client-side reason note only).
- No changes to owner or member flows.

## 6. Open details for plan phase

- Admin deploy origin (for CORS value), admin creation/bootstrap method for first ADMIN user, rejection reason persistence (note-only vs column).
