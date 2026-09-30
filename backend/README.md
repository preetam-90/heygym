# HeyGym Backend

Production MVP backend for HeyGym: Fastify + TypeScript + Prisma + PostgreSQL, Argon2, JWT (HttpOnly cookies + Bearer for mobile), Zod, Vitest.

## Quick start
```bash
cp .env.example .env
# edit DATABASE_URL, JWT secrets
npm install
npx prisma migrate deploy
npm run prisma:seed   # dev only: admin@heygym.dev / owner1@heygym.dev / user1@heygym.dev / Password123!
npm run dev           # :4000
```

## Structure
```
src/
 config/env.ts plugins/cors.ts plugins/auth.ts plugins/permissions.ts
 lib/prisma.ts lib/audit.ts lib/slug.ts lib/money.ts lib/errors.ts lib/storage.ts lib/validate.ts
 modules/auth/ modules/users/ modules/gyms/ modules/owner/
 modules/admin/ modules/audit/ modules/enquiries/ modules/favorites/
 modules/reviews/ modules/notifications/
 app.ts server.ts
prisma/schema.prisma prisma/migrations/ prisma/seed.ts
tests/ docs/openapi.json docs/API_INTEGRATION.md
```

## Lifecycle
`DRAFT --POST submit--> PENDING_APPROVAL --approve--> APPROVED --suspend--> SUSPENDED`. Reject → `DRAFT` + reason in `AdminAction`. Only `APPROVED` public.

## Key endpoints
- Auth: `POST /api/v1/auth/register|login|logout|refresh`, `GET /auth/me`
- Public: `GET /api/v1/gyms?q&city&facilities&minPrice&maxPrice&minRating&sort&page&pageSize&lat&lng&radius`, `GET /gyms/:slug`
- Owner canonical: `/api/v1/owner/gyms/*` (+ facilities/plans/photos/hours/enquiries). Alias `/gyms/my` kept.
- Admin: `GET /admin/gyms/pending`, `POST /admin/gyms/:id/approve|reject|suspend|restore`
- Social: favorites, enquiries, reviews, notifications (see `docs/API_INTEGRATION.md`, `docs/openapi.json`)

## Verification
```bash
npm run typecheck && npm test && npm run build
npx prisma validate && npx prisma migrate deploy
curl localhost:4000/health; curl localhost:4000/ready
```

## Security
Helmet, rate-limit (200/min), 1MB body limit, CORS allowlist, HttpOnly Secure SameSite cookies, refresh rotation (jti + sha256 + revoked), argon2, Zod everywhere, IDOR ownership checks, centralized `{success,error{code,message}}` (no stack in prod), audit `AdminAction` + legacy `AuditLog`.

## Money/pricing
`Decimal(10,2)` in DB, serialized as `number` in API. `durationDays`, `features[]`, `isActive`.
