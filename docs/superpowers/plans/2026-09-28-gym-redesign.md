# GymPlatform Dark Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild all frontend pages in dark volt athletic system per spec.

**Architecture:** Token-first: CSS vars + Tailwind extend, then primitives, then shared layout, then pages. No API changes, visual only.

**Tech Stack:** Next.js 14, Tailwind 3.4, next/font (Barlow Condensed + Inter), lucide-react, clsx/tailwind-merge

**Spec:** `docs/superpowers/specs/2026-09-28-gym-redesign-design.md`

## Global Constraints
- Dark base #09090B, surface #131316/#1A1A1E, card #151518, border white/10 (#26262B)
- Accent volt #D4FF4F, on-accent #0A0F00, muted #A1A1AA min 4.5:1
- Display font Barlow Condensed uppercase, body Inter via next/font
- No new heavy deps, keep lucide-react icons only (no emoji)
- Responsive 375px, 768px, 1024px, 1440px, prefers-reduced-motion respected, 44px targets
- `npm run build` must pass

## Review Focus
- Volt #D4FF4F on #09090B stays >12:1, zinc-400 on dark >4.5:1 — expect readable body in both hero and cards
- City filter with empty gyms list shows empty state, not blank grid — expect muted message + CTA
- Mobile menu focus trap/close on navigate — expect menu closes on link click
- Image missing (no imageUrl) renders gradient placeholder, not broken img — expect Dumbbell fallback
- Reduced-motion disables marquee/parallax — expect static layout with no animation

---
### Task 1: Design tokens + fonts

**Files:**
- Modify: `frontend/app/globals.css`
- Modify: `frontend/tailwind.config.ts`
- Modify: `frontend/app/layout.tsx`

**Interfaces:**
- Consumes: none
- Produces: `font-display` (Barlow Condensed), `colors.volt` (#D4FF4F), CSS vars `--bg --surface --card --border --volt` used by Tasks 2-8

- [ ] **Step 1: Write failing check** — run `npm run build` baseline, note current light styles; assert `grep -r "D4FF4F\|Barlow" frontend/app frontend/tailwind.config.ts` returns empty (fails = tokens missing)
- [ ] **Step 2: Update `tailwind.config.ts`** — extend `colors.volt.{DEFAULT:#D4FF4F,dim:rgba}`, `fontFamily.display:['Barlow Condensed']`, `keyframes marquee`
- [ ] **Step 3: Update `globals.css`** — dark base `bg-[#09090B] text-zinc-100`, selection volt, scrollbar dark, focus-visible volt ring, utilities `.text-outline`, `.bg-grid`, `@media (prefers-reduced-motion: reduce)` disable animation
- [ ] **Step 4: Update `layout.tsx`** — load `Barlow_Condensed` + `Inter` via next/font/google, `<html class="dark">`, body `bg-[#09090B]`
- [ ] **Step 5: Verify** — Run: `npm run build` in `frontend/` Expected: PASS; `grep -r volt` hits 3 files
- [ ] **Step 6: Commit** — `git add ...; git commit -m "feat: dark volt tokens and fonts"`

### Task 2: UI primitives (button, card, input)

**Files:**
- Modify: `frontend/components/ui/button.tsx`
- Modify: `frontend/components/ui/card.tsx`
- Modify: `frontend/components/ui/input.tsx`
- Modify: `frontend/components/ui/label.tsx`
- Modify: `frontend/components/ui/textarea.tsx`

**Interfaces:**
- Consumes: volt tokens from Task 1
- Produces: `Button variant=default→volt/black`, `Card dark`, dark inputs used by Tasks 4-8

- [ ] **Step 1: Failing check** — assert `grep -q "bg-volt\|bg-\[#151518\]" frontend/components/ui/button.tsx frontend/components/ui/card.tsx` fails (old light styles)
- [ ] **Step 2: Implement button** — `default: bg-[#D4FF4F] text-black hover:brightness-110`, `secondary: bg-white/10`, `outline: border-white/15`, add `cursor-pointer focus-visible:ring-volt`
- [ ] **Step 3: Implement card/input/label/textarea** — Card `bg-[#151518] border-white/10 rounded-2xl`; inputs `bg-white/5 border-white/10 focus:border-[#D4FF4F] placeholder:text-zinc-500`
- [ ] **Step 4: Verify** — Run: `npm run build` Expected: PASS; manual tab focus shows volt ring
- [ ] **Step 5: Commit**

### Task 3: Navbar + Footer

**Files:**
- Modify: `frontend/components/navbar.tsx`
- Modify: `frontend/components/footer.tsx`

**Interfaces:**
- Consumes: Button from Task 2
- Produces: Dark shell used by all pages

- [ ] **Step 1: Failing check** — `grep -q "09090B" frontend/components/navbar.tsx` fails
- [ ] **Step 2: Implement navbar** — `sticky bg-[#09090B]/80 backdrop-blur border-white/10`, logo volt square black Dumbbell, links `text-zinc-400 hover:text-white`, CTA volt button, mobile panel `bg-[#0C0C0E]` closes on click
- [ ] **Step 3: Implement footer** — `bg-[#0C0C0E] border-t-white/10`, muted links hover volt, bottom bar
- [ ] **Step 4: Verify** — `npm run build` PASS; check 375px menu opens/closes, 44px targets
- [ ] **Step 5: Commit**

### Task 4: GymCard

**Files:**
- Modify: `frontend/components/gym-card.tsx`

**Interfaces:**
- Consumes: Card + Button from Task 2
- Produces: Card used by Task 5 (preview) + Task 6 (grid)

- [ ] **Step 1: Failing check** — renders dark with price badge? No (old light)
- [ ] **Step 2: Implement** — dark card hover `-translate-y-1 border-volt/20 shadow`, image 16/10 gradient overlay + volt price badge top-left, status pill (APPROVED volt/black, PENDING yellow, else red), fallback gradient + Dumbbell when no imageUrl, `alt={gym.name}`
- [ ] **Step 3: Verify** — `npm run build` PASS; missing image → fallback, price shows `From $X`
- [ ] **Step 4: Commit**

### Task 5: Homepage

**Files:**
- Modify: `frontend/app/page.tsx`

**Interfaces:**
- Consumes: GymCard from Task 4
- Produces: none (leaf)

- [ ] **Step 1: Failing check** — `grep -q "TRAIN HARDER\|from-primary-50" frontend/app/page.tsx` — old hero present
- [ ] **Step 2: Implement sections** — Hero (eyebrow pill, Barlow 72px `FIND YOUR / GYM` volt slash, dual CTA, stats row, glow+grid), marquee strip, bento features 4 dark cards, top gyms (3), volt CTA band, owner split
- [ ] **Step 3: Verify** — `npm run build` PASS; 375px stacks, reduced-motion static
- [ ] **Step 4: Commit**

### Task 6: Gyms list + detail

**Files:**
- Modify: `frontend/app/gyms/page.tsx`
- Modify: `frontend/app/gyms/[id]/page.tsx`

**Interfaces:**
- Consumes: GymCard Task 4
- Produces: none

- [ ] **Step 1: Failing check** — old light inputs `focus:ring-primary-500` present
- [ ] **Step 2: Implement list** — dark header, sticky search `bg-white/5`, select dark, skeleton `bg-zinc-800 animate-pulse`, empty state Dumbbell + CTA, error red-400 + retry
- [ ] **Step 3: Implement detail** — hero image overlay gradient, info grid dark cards, plans table dark, volt Join CTA
- [ ] **Step 4: Verify** — `npm run build` PASS; empty search → empty state, error → retry works
- [ ] **Step 5: Commit**

### Task 7: Auth pages

**Files:**
- Modify: `frontend/app/login/page.tsx`
- Modify: `frontend/app/register/page.tsx`
- Modify: `frontend/app/gym-owner/register/page.tsx`

**Interfaces:**
- Consumes: inputs + button Task 2
- Produces: none

- [ ] **Step 1: Failing check** — light card `bg-white` present
- [ ] **Step 2: Implement** — centered `bg-[#151518] border-white/10` on glow bg, volt submit, labels above, `aria-live` errors, muted footer links
- [ ] **Step 3: Verify** — `npm run build` PASS; keyboard tab order logical, errors announced
- [ ] **Step 4: Commit**

### Task 8: Dashboards

**Files:**
- Modify: `frontend/app/gym-owner/dashboard/page.tsx`
- Modify: `frontend/app/admin/dashboard/page.tsx`

**Interfaces:**
- Consumes: all above
- Produces: none

- [ ] **Step 1: Failing check** — light tables/cards present
- [ ] **Step 2: Implement** — dark stat cards, tables `border-white/10 divide-white/10`, status pills same as GymCard, sidebar/topbar dark
- [ ] **Step 3: Verify** — `npm run build` + `npm run lint` PASS
- [ ] **Step 4: Commit**

### Task 9: Final verification

- [ ] **Step 1: Build + lint** — Run: `npm run build && npm run lint` in `frontend/` Expected: PASS no new warnings
- [ ] **Step 2: Contrast + responsive** — Check volt/black >12:1, zinc-400/black >4.5:1; 375px + 1440px no overflow; focus visible; reduced-motion on
- [ ] **Step 3: Pre-delivery** — No emoji icons, Lucide only, hover 150-300ms, alt text present
