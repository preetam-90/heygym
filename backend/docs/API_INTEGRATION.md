# HeyGym API Integration Guide

Base: `http://localhost:4000/api/v1`. All success: `{success:true,data:{}}`. Errors: `{success:false,error:{code,message}}`.

## Auth (web + mobile)
- Web: HttpOnly `accessToken` (15m) + `refreshToken` (7d, `Secure/SameSite=Lax`) cookies. Send `credentials:include` + `Authorization: Bearer <access>` (frontend keeps Bearer for compat).
- Mobile: use tokens from response body (`POST /auth/login` returns `{user,accessToken,refreshToken}`), store securely, send `Authorization: Bearer`.
- `POST /auth/register {name,email,phone?,password(min8),role:USER|GYM_OWNER}` → 201. ADMIN cannot self-register.
- `POST /auth/login {email,password}` → 200 + rotates session. 401 `INVALID_CREDENTIALS`, 429 `RATE_LIMITED`, 403 `ACCOUNT_SUSPENDED/BANNED`.
- `POST /auth/refresh {refreshToken?}` (or cookie) → rotates (old invalidated). Reuse → 401.
- `POST /auth/logout` → revokes server session + clears cookies.
- `GET /auth/me` → current user (no passwordHash).

## Discovery (public, APPROVED only)
- `GET /gyms?q=fit&city=Noida&facilities=cardio,parking&minPrice=500&maxPrice=3000&minRating=4&sort=nearest|rating|price_low|price_high|newest&page=1&pageSize=20&lat=28.6&lng=77.3&radius=5`
- `pageSize<=100`. Sort allowlisted server-side.
- `GET /gyms/:idOrSlug` → gym + `facilities[]` (structured), `membershipPlans` (price number), `photos`, `hours`, `averageRating`, `reviewCount`. Owner email hidden (only name).
- `GET /gyms/facilities` → canonical list.

## Owner (canonical `/owner/*`, alias `/gyms/my` kept)
- `POST /owner/gyms {name,address,city,...}` → DRAFT + slug auto.
- `PATCH /owner/gyms/:id`, `DELETE /owner/gyms/:id`, `POST /owner/gyms/:id/submit` → PENDING_APPROVAL.
- Facilities: `POST /owner/gyms/:id/facilities {facilityId|slug|facilityIds[]}`, `DELETE .../:facilityId`.
- Plans: `POST /owner/gyms/:id/plans {name,price,durationDays,features[],isActive}`, PATCH/DELETE.
- Photos multipart: `POST /gyms/:id/photos (file)`, `PATCH .../photos/:photoId {altText,sortOrder}`, `PATCH .../primary`, `DELETE`.
- Hours: `PUT /gyms/:id/hours {hours:[{dayOfWeek:0=Sun..6=Sat,openTime:"06:00",closeTime:"22:00",isClosed:false}]}`.
- Enquiries inbox: `GET /owner/enquiries`, `GET /owner/enquiries/:id` (marks READ), `PATCH ... {status,response}` → notifies user.

## Admin
- `GET /admin/gyms/pending`, `GET /admin/gyms/:id`, `POST .../approve`, `POST .../reject {reason*}` → DRAFT + audit, `POST .../suspend`, `POST .../restore`. Legacy `PATCH /admin/gyms/:id/status` kept.
- `GET /admin/users?search=&page=`, `GET /admin/stats` (includes pending/approved/draft/suspended, enquiries, reviews), `GET /admin/enquiries`, `GET /admin/reviews` + `POST .../hide|restore`.

## Favorites / Enquiries / Reviews / Notifications
- Favorites: `POST /users/me/favorites/:gymId` (409 `FAVORITE_EXISTS`), `DELETE`, `GET`.
- Enquiries: `POST /gyms/:gymId/enquiries {message min10}` (APPROVED only, auth). Status NEW→READ→RESPONDED→CLOSED.
- Reviews: `POST /gyms/:gymId/reviews {rating 1-5,title?,comment?}` (409 if dup), `GET`, `PATCH /reviews/:id` (owner), `DELETE`.
- Notifications: `GET /users/me/notifications?unread=true`, `POST .../:id/read`, `POST .../read-all`. Triggered on enquiry new/response, gym approve/suspend/reject.

## Examples
```bash
# login (web)
curl -c cookies.txt -X POST localhost:4000/api/v1/auth/login -H 'Content-Type: application/json' -d '{"email":"user1@heygym.dev","password":"Password123!"}'
# discovery
curl 'localhost:4000/api/v1/gyms?city=Noida&sort=rating&page=1&pageSize=5'
# owner create
curl -b cookies.txt -X POST localhost:4000/api/v1/owner/gyms -H 'Content-Type: application/json' -d '{"name":"My Gym","address":"Sec 18","city":"Noida"}'
```
