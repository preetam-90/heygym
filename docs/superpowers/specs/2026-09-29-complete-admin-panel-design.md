# Complete Admin Panel Design — horizontal layers

Date: 2026-09-29
Status: sections 1–3 approved in chat; pending written-spec review
Strategy: horizontal layers (chosen over vertical slices) — full schema + all backend modules first, then full admin UI.

## 1. Goal

The admin panel (`heygym-admin`, separate repo) becomes the single operational control center for the Gym Platform on the same Fastify backend. No routine task requires database, backend, or hosting dashboards. Every UI control is wired to a real backend operation (no mock controls).

## 2. Section 1 — Data model (approved)

Prisma, non-destructive migrations only:

- User: add status `ACTIVE/SUSPENDED/BANNED` (default ACTIVE), `emailVerifiedAt`, `phoneVerifiedAt`, `lastLoginAt`, `deletedAt` (soft delete). Existing fields unchanged.
- Gym: extend status to `PENDING/UNDER_REVIEW/APPROVED/REJECTED/SUSPENDED`, add `featured`, `featuredOrder`, `featuredUntil`, `verifiedAt`, `deletedAt`, internal notes field.
- Booking: `PENDING/CONFIRMED/CANCELLED/COMPLETED/REFUNDED/DISPUTED`; links user/gym/plan; amount, paymentStatus, bookingDate, cancellationReason, refundStatus.
- Transaction: transactionId, user/gym/owner refs, amount, commission, gymAmount, method, status (SUCCESSFUL/FAILED/PENDING), refundStatus, timestamps.
- Payout: `PENDING/PROCESSING/COMPLETED/FAILED/HELD`; owner ref; amount; history entries; every action audit-logged.
- Review: user/gym refs, rating, text, moderationStatus `VISIBLE/HIDDEN/FLAGGED/DELETED`, reports count.
- Enquiry: user/gym/owner refs, message, status `NEW/OPEN/RESPONDED/RESOLVED/CLOSED`, assignee.
- Report: reporter/target refs, category, status `OPEN/INVESTIGATING/RESOLVED/REJECTED`, internal notes.
- Notification/Announcement: audience selector, type (in-app/email/push), title/body, publishedAt, expiry.
- PlatformSetting: key-value store; secrets server-only, never exposed to frontend.
- CommissionRule: scope `GLOBAL/GYM/OWNER`, percent, validFrom/validTo. Calculation order: Customer Payment → Platform Commission → Gym Owner Amount.
- AuditLog: append-only (no update/delete endpoints): actor, action, target type/id, reason, timestamp, IP where legally appropriate.

## 3. Section 2 — Backend (approved)

Same Fastify service. New modules: bookings, transactions, payouts, reviews, enquiries, reports, notifications, content, settings, audit. Authorization chain on every admin route: authenticate → requireRole → granular permission (`users.suspend`, `gyms.approve`, `payments.refund`, …) via permissions map. Roles seeded: SuperAdmin (all), Admin (most), Moderator (users/gyms/reviews/reports), FinanceAdmin (payments/commission/payouts), SupportAdmin (users/enquiries/bookings). SuperAdmin manages admin accounts/roles. Sensitive actions write AuditLog. Login throttling + failed-attempt logging; SUSPENDED/BANNED rejected at auth; zod preHandler validation throughout; existing admin/users/gyms/stats endpoints extended, not replaced.

## 4. Section 3 — Admin UI (approved)

`heygym-admin` SaaS shell: sidebar (Dashboard, Users, Gym Owners, Gyms, Approvals, Plans, Bookings, Payments, Payouts, Reviews, Enquiries, Reports, Notifications, Content, Analytics, Admins, Audit Logs, Settings), global search (users/owners/gyms/bookings/transactions/reviews/enquiries/reports), quick-action menu with shortcuts, charts (registrations, bookings, revenue, commission, activity, cancellations) with Today/7d/30d/3m/6m/1y/custom ranges. Confirmations on destructive actions; reason required for reject/suspend/ban/refund/hold/payout-hold/permission changes. Toasts, loading/empty/error states, pagination, sorting, bulk actions with confirmation. Dark volt theme carried over.

## 5. Layer order (horizontal)

Layer 1: schema migrations + seeds (statuses, roles, permissions, settings defaults). Layer 2: backend modules + RBAC + audit + tests per module. Layer 3: admin UI sections + global shell + charts. Layer 4: verification pass as real administrator per Section 35 of the request.

## 6. Non-goals

No separate auth system/database/API; no hardcoded plans, filters, or commission values in frontend; no secret exposure; no unrestricted DB access from frontend; negative reviews moderated by rules, never auto-deleted for being negative.

## 7. Open details for planning

Chart library choice; CSV vs Excel export scope; 2FA provider support; push-notification provider; exact seed permission matrix per role.
