# Admin Layer 3 — Admin UI — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the complete SaaS admin shell and all management sections in `admin/`, every control wired to a Layer 1–2 API.

**Architecture:** App Router routes per section sharing the existing `lib/api.ts` + `AuthProvider` pattern; a sidebar shell layout with global search, notifications, and quick actions; charts with selectable ranges backed by stats endpoints.

**Tech Stack:** Next.js 14, React 18, Tailwind 3, TypeScript 5 (repo: `/home/preetam/Downloads/Gym/gym-platform/admin/`, port 3001).

**Spec:** `docs/superpowers/specs/2026-09-29-complete-admin-panel-design.md` (Sections 3–4)

## Global Constraints

- Work only in `admin/` inside the gym-platform repo; same backend only (`NEXT_PUBLIC_API_URL`).
- ADMIN-only pages via existing guard; every destructive action needs a confirmation dialog, and reject/suspend/ban/refund/hold need a reason field.
- Every control calls a real Layer 1–2 endpoint — no mock buttons; if an endpoint is missing, stop and report instead of faking it.
- Dark volt theme (`bg #09090B`, accent `#D4FF4F`); loading/empty/error states on every data view.

## Review Focus

- Clicking Approve on a gym with the backend down must show an error toast and keep the row PENDING, not silently drop it.
- Entering a destructive dialog and pressing Escape must cancel without firing the action.
- Global search for `gym@admin.com` must return grouped hits (user + related rows), not just the first match type.
- A bulk-approve of 20 gyms where 3 fail must report 17/20 with per-row errors, not a blanket success.
- Charts switching from 7d to 1y must refetch with the new range, not keep showing the old dataset.

---

### Task 1: SaaS shell (sidebar, search, quick actions)

**Files:**
- Create: `admin/components/admin-shell.tsx`, `admin/components/global-search.tsx`, `admin/components/quick-actions.tsx`
- Modify: `admin/app/layout.tsx`
- Test: `npm run build` + smoke

**Interfaces:**
- Consumes: existing `AuthProvider`, `lib/api.ts`.
- Produces: `<AdminShell>` (sidebar per spec section 28 + topbar with search/notifications/admin menu); global search hitting a new `api.globalSearch(q)` (`GET /api/v1/admin/search?q=` — if Layer 2 did not ship it, this task owns adding that endpoint in gym-platform backend and wiring it).

- [ ] **Step 1: Write the failing check**

```bash
[ -f /home/preetam/Downloads/Gym/gym-platform/admin/components/admin-shell.tsx ] && echo "shell exists" || echo "shell missing"
```

- [ ] **Step 2: Run check to verify it fails**

Run: same test command
Expected: `shell missing`

- [ ] **Step 3: Implement shell + search + quick actions**

Sidebar links: Dashboard, Users, Gym Owners, Gyms, Approvals, Plans, Bookings, Payments, Payouts, Reviews, Enquiries, Reports, Notifications, Content, Analytics, Admins, Audit Logs, Settings. Quick-action menu (create user/gym, approve queue, pending reports/payouts, send notification, create announcement) with keyboard shortcuts.

- [ ] **Step 4: Run verification**

Run: `cd admin && npm run build`; search `gym@admin.com` returns grouped hits; quick action opens the pending queue.
Expected: build passes; grouped search results (Review Focus line 3 pinned here).

- [ ] **Step 5: Commit** (in gym-platform repo)

```bash
git add admin/components/admin-shell.tsx admin/components/global-search.tsx admin/components/quick-actions.tsx admin/app/layout.tsx
git commit -m "feat(admin): add SaaS shell with global search and quick actions"
```

### Task 2: Dashboard + analytics charts

**Files:**
- Create: `admin/app/(dashboard)/page.tsx`, `admin/components/stat-card.tsx`, `admin/components/range-chart.tsx`, `admin/components/recent-activity.tsx`
- Test: build + range-switch check

**Interfaces:**
- Consumes: `GET /api/v1/admin/stats` (extended in Layer 2 with all spec counters + `?from=&to=` range params and per-day series).
- Produces: dashboard with all Section-1 counters, 9 charts, range selector (Today/7d/30d/3m/6m/1y/custom), recent-activity feed.

- [ ] **Step 1: Write the failing check**

```bash
grep -rq "range-chart\|RangeChart" /home/preetam/Downloads/Gym/gym-platform/admin/components/ 2>/dev/null && echo "charts exist" || echo "charts missing"
```

- [ ] **Step 2: Run check to verify it fails**

Run: same grep command
Expected: `charts missing`

- [ ] **Step 3: Implement dashboard + charts + activity feed**

Stat cards for every counter in spec section 1; charts for registrations/bookings/revenue/commission/activity/enquiries/reviews/cancellations; range changes refetch series.

- [ ] **Step 4: Run verification**

Run: `npm run build`; switch chart range 7d→1y and confirm a new network request with the new params (devtools/network or logged URL).
Expected: build passes; refetch observed (Review Focus line 5 pinned here).

- [ ] **Step 5: Commit**

```bash
git add admin/"app/(dashboard)/" admin/components/stat-card.tsx admin/components/range-chart.tsx admin/components/recent-activity.tsx
git commit -m "feat(admin): add dashboard with analytics charts"
```

### Task 3: Users, owners, gyms, approvals, plans

**Files:**
- Create: `admin/app/users/[id]/page.tsx`, `admin/app/owners/`, `admin/app/gyms/[id]/page.tsx`, `admin/app/approvals/page.tsx`, `admin/app/plans/page.tsx`, `admin/components/confirm-dialog.tsx`
- Modify: extend `admin/lib/api.ts`, existing users/gyms pages.
- Test: build + action roundtrips

**Interfaces:**
- Consumes: Layer 1–2 user/gym/plan endpoints incl. suspend/ban/verify/role-change, `UNDER_REVIEW` status, plan CRUD.
- Produces: user detail (profile, bookings, payments, reviews, timeline), owner profiles, gym detail (full spec section 4), approval workflow PENDING→UNDER_REVIEW→APPROVED/REJECTED with notes + owner notification, plan manager, reusable `<ConfirmDialog reasonRequired?>`.

- [ ] **Step 1: Write the failing check**

```bash
[ -f /home/preetam/Downloads/Gym/gym-platform/admin/app/approvals/page.tsx ] && echo "approvals exists" || echo "approvals missing"
```

- [ ] **Step 2: Run check to verify it fails**

Run: same test command
Expected: `approvals missing`

- [ ] **Step 3: Implement the five sections + confirm dialog**

Suspend/ban/delete/reject dialogs require typed or selected reason; failed actions toast + preserve row state; Escape cancels dialogs.

- [ ] **Step 4: Run verification**

Run: `npm run build`; suspend then unsuspend a test user; reject a test gym with reason; Escape a delete dialog and confirm nothing fired.
Expected: build passes; state changes persist via API; Escape cancels (Review Focus lines 1–2 pinned here).

- [ ] **Step 5: Commit**

```bash
git add admin/app/users admin/app/owners admin/app/gyms admin/app/approvals admin/app/plans admin/components/confirm-dialog.tsx admin/lib/api.ts
git commit -m "feat(admin): add users, owners, gyms, approvals, and plans management"
```

### Task 4: Bookings, payments, payouts, commission

**Files:**
- Create: `admin/app/bookings/`, `admin/app/payments/`, `admin/app/payouts/`, `admin/app/commission/page.tsx`
- Test: build + money-flow roundtrip

**Interfaces:**
- Consumes: Layer 2 bookings/billing/payouts endpoints.
- Produces: booking list→detail with transitions + dispute resolution + refund; transaction list→detail with refund; payout board with approve/hold/release/complete; commission rule editor showing payment→commission→owner math preview.

- [ ] **Step 1: Write the failing check**

```bash
ls -d /home/preetam/Downloads/Gym/gym-platform/admin/app/bookings /home/preetam/Downloads/Gym/gym-platform/admin/app/payouts 2>/dev/null || echo "money sections missing"
```

- [ ] **Step 2: Run check to verify it fails**

Run: same ls command
Expected: `money sections missing`

- [ ] **Step 3: Implement the four sections**

Payout actions record + display history; refund requires reason; commission preview recomputes on percent edit.

- [ ] **Step 4: Run verification**

Run: `npm run build`; hold then release a test payout; issue a test refund with reason; set a gym commission and verify preview math matches `resolveCommission`.
Expected: build passes; ledger entries correct; math matches backend.

- [ ] **Step 5: Commit**

```bash
git add admin/app/bookings admin/app/payments admin/app/payouts admin/app/commission
git commit -m "feat(admin): add bookings, payments, payouts, and commission"
```

### Task 5: Moderation, messaging, content, admins, audit, settings

**Files:**
- Create: `admin/app/reviews/`, `admin/app/enquiries/`, `admin/app/reports/`, `admin/app/notifications/`, `admin/app/content/`, `admin/app/admins/`, `admin/app/audit-logs/`, `admin/app/settings/`
- Test: build + moderation roundtrip

**Interfaces:**
- Consumes: Layer 2 reviews/enquiries/reports/notify/content/settings/audit endpoints.
- Produces: review moderation queue; enquiry inbox with respond/assign; report investigation with notes; notification composer; CMS editor (publish/unpublish); admin accounts + role assignment (SuperAdmin only); searchable audit-log viewer; settings forms (general/registration/gym/payment/maintenance/flags) with secrets never rendered.

- [ ] **Step 1: Write the failing check**

```bash
ls -d /home/preetam/Downloads/Gym/gym-platform/admin/app/audit-logs /home/preetam/Downloads/Gym/gym-platform/admin/app/settings 2>/dev/null || echo "ops sections missing"
```

- [ ] **Step 2: Run check to verify it fails**

Run: same ls command
Expected: `ops sections missing`

- [ ] **Step 3: Implement the eight sections**

Bulk approve/delete with confirmation + partial-failure reporting (e.g. "17/20 approved, 3 failed" with per-row errors); settings forms per spec section 22 + maintenance + flags.

- [ ] **Step 4: Run verification**

Run: `npm run build`; bulk-moderate 20 test reviews with 3 forced failures → summary shows 17/20 + row errors; toggle a feature flag and confirm settings persist.
Expected: build passes; partial-failure summary correct (Review Focus line 4 pinned here).

- [ ] **Step 5: Commit**

```bash
git add admin/app/reviews admin/app/enquiries admin/app/reports admin/app/notifications admin/app/content admin/app/admins admin/app/audit-logs admin/app/settings
git commit -m "feat(admin): add moderation, messaging, admins, audit, and settings"
```

### Task 6: Administrator verification pass

**Files:**
- Test: live walkthrough checklist (no code unless fixes needed)
- Test record: `/tmp/opencode/admin-verification.md` (or repo note if fixes land)

**Interfaces:**
- Consumes: everything above.
- Produces: signed checklist proving a real admin can operate the platform end-to-end without touching DB/backend/hosting dashboards.

- [ ] **Step 1: Write the checklist**

Checklist: login as gym@admin.com → pending gym approve → suspend/unsuspend user → refund transaction → hold/release payout → moderate review → send announcement → toggle flag → inspect audit log for all actions.

- [ ] **Step 2: Run the walkthrough**

Run: start backend + admin app; execute each step as gym@admin.com; record pass/fail per step with evidence (screenshots or API responses).

- [ ] **Step 3: Fix or file**

Any failure becomes a fix commit (same repo conventions) or a filed issue with repro; re-run the failed step.

- [ ] **Step 4: Run verification**

Run: full checklist green; `npm run build` in admin; `npx tsc --noEmit` in backend.
Expected: all green.

- [ ] **Step 5: Commit** (only if fixes landed)

```bash
git commit -m "fix(admin): verification-pass findings"
```
