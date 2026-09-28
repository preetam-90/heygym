# Admin Program — Plan Index

> These plans implement `docs/superpowers/specs/2026-09-29-complete-admin-panel-design.md` (horizontal layers). Work them in order; each plan is independently testable.

1. `2026-09-29-admin-layer1-schema-rbac-audit.md` — schema extensions, migration, role/permission seeds, permission enforcement infra, append-only audit log wired into existing admin actions.
2. `2026-09-29-admin-layer2-domain-modules.md` — new backend modules: bookings, transactions, payouts, reviews, enquiries, reports, notifications/content, settings/commission.
3. `2026-09-29-admin-layer3-ui.md` — admin shell + all UI sections + charts + global search + quick actions, every control wired to Plans 1–2 APIs.

**For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement these plans task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.
