# GymPlatform Dark Energetic Redesign — Design Spec
Date: 2026-09-28 | Status: Approved in chat, pending spec review

## 1. Intent (from brainstorming)
- Outcome: Improve design of whole gym website using ui-ux-pro-max
- Vibe: Dark energetic (user choice)
- Scope: All pages (public + auth + dashboards + shared components)
- Accent: Volt lime (user choice) over current green
- Success: Premium athletic feel, 4.5:1 contrast, responsive 375px→1440px, no new heavy deps, keep Next.js 14 + Tailwind + lucide-react

## 2. ui-ux-pro-max grounding
- `search.py "gym fitness dark energetic" --design-system` → Pattern: Feature-Rich Showcase, Style: Vibrant & Block-based (dark supported), Typography: Barlow Condensed / Barlow (sports/athletic), Effects: 48px+ gaps, bold hover 200-300ms, large type 32px+
- `search --domain ux "dark mode contrast"` → 4.5:1 min, no gray-on-gray, descriptive alt
- Stack search for nextjs dark theme: no DB match → fallback to general Next.js + Tailwind dark best practices (CSS vars, next/font)
- User override: dataset suggested #F97316 orange + #1F2937 bg, but user chose volt lime on near-black — using volt as it fits gym standard and user intent.

## 3. Design System (MASTER)
- Colors:
  - bg base: #09090B (zinc-950), surface: #131316 / #1A1A1E, card: #151518, border: #26262B (white/10)
  - foreground: #FAFAFA, muted: #A1A1AA (zinc-400, 4.6:1 on #09090B), muted-2: #71717A for large only
  - accent volt: #D4FF4F (primary CTA, highlights), on-accent: #0A0F00 (near-black text on volt)
  - volt-dim for borders/glows: rgba(212,255,79,0.15)
  - success: #22C55E retained for APPROVED status only, destructive #EF4444, warning #FACC15
  - Focus ring: volt 2px offset 2px
- Typography:
  - Display: Barlow Condensed 600/700 uppercase, tracking tight, 48-96px hero, 32-48px section
  - Body: Inter (existing) 400/500/600, 16-20px
  - Load via next/font/google, `display: swap`
- Spacing/radius/shadow:
  - Sections py-20/32, gaps 48px+, container max-w-7xl px-4/6
  - Radius: cards 16-20px, pills full, buttons 10-12px
  - Shadows: card `0 8px 30px rgba(0,0,0,0.45)`, volt CTA `0 0 0 1px volt-dim + 0 12px 40px rgba(212,255,79,0.25)`
- Effects (respect prefers-reduced-motion):
  - Hero: radial volt glow + grid pattern + noise, uppercase outline text stroke behind
  - Cards: image scale 1.05 on hover 300ms, border volt-dim on hover, translate-y -2px
  - Buttons: volt bg black text → brightness 1.05 hover, 200ms
  - Marquee strip for social proof (paused on reduced-motion)

## 4. Components / Pages
- Tokens: `frontend/app/globals.css` → CSS vars + base (bg, selection volt, scrollbar dark, focus-visible), `frontend/tailwind.config.ts` → extend colors volt, zinc surfaces, font-display/body, keyframes marquee/pulse-glow
- Shared:
  - `layout.tsx`: dark html, fonts, metadata unchanged
  - `navbar.tsx`: sticky glass `bg-[#09090B]/80 backdrop-blur`, volt logo mark in black rounded square, links zinc-400→white, volt CTA button, mobile menu dark panel
  - `footer.tsx`: dark #0C0C0E, 4-col, muted links, volt hover, bottom bar
  - `ui/button.tsx`: default=volt/black, secondary=white/10/white, outline=white/15, ghost, sizes unchanged + `cursor-pointer`, focus volt ring
  - `ui/card.tsx`: `bg-[#151518] border-white/10 rounded-2xl shadow`
  - `ui/input/label/textarea`: dark fields `bg-white/5 border-white/10 focus:border-volt`
  - `gym-card.tsx`: dark card, image 16/10 with gradient overlay + price badge volt, status pill (APPROVED volt/black, PENDING yellow, REJECTED red), meta zinc-400, full-width volt View button
- Public:
  - `app/page.tsx` (Home): 1) Hero dark + eyebrow pill + 72px condensed headline “TRAIN HARDER / FIND YOUR GYM” + dual CTA + stats row + hero image/collage + glow, 2) Logo/marquee strip, 3) Stats band, 4) Bento features 4 cards, 5) Top gyms preview (reuse GymCard, max 3), 6) Volt CTA band black text, 7) Owner split dark card
  - `app/gyms/page.tsx`: dark header + sticky search bar (dark input + city select), results grid, empty/error states zinc, skeleton loader
  - `app/gyms/[id]/page.tsx`: dark hero image with overlay, info grid, plans table dark, CTA
- Auth (`login`, `register`, `gym-owner/register`): centered dark card on glow bg, volt submit, muted links, error aria-live, labels above inputs
- Dashboards (`gym-owner/dashboard`, `admin/dashboard`): dark sidebar/topbar, stat cards dark, tables dark `border-white/10`, status pills same as card
- Accessibility: 44px targets, visible focus, aria-hidden decorative icons, alt text, error summary focus, reduced-motion disables marquee/parallax

## 5. Data flow / Error handling
- No API change. Visual only. Loading → skeleton (pulse zinc-800), error → red-400 text + volt retry button, empty → muted illustration (Dumbbell icon) + CTA.

## 6. Testing / Verification
- `npm run build` must pass, `npm run lint` no new errors
- Manual: 375px + 1440px, keyboard tab through nav/hero/cards, reduced-motion on, contrast check volt-on-black (>12:1) + zinc-400-on-black (>4.5:1)
- ui-ux-pro-max pre-delivery: no emoji icons, Phosphor/Lucide only, hover 150-300ms, focus visible

## 7. Files touched
`frontend/app/globals.css`, `frontend/tailwind.config.ts`, `frontend/app/layout.tsx`, `frontend/app/page.tsx`, `frontend/app/gyms/page.tsx`, `frontend/app/gyms/[id]/page.tsx`, `frontend/app/login/page.tsx`, `frontend/app/register/page.tsx`, `frontend/app/gym-owner/register/page.tsx`, `frontend/app/gym-owner/dashboard/page.tsx`, `frontend/app/admin/dashboard/page.tsx`, `frontend/components/navbar.tsx`, `frontend/components/footer.tsx`, `frontend/components/gym-card.tsx`, `frontend/components/ui/button.tsx`, `frontend/components/ui/card.tsx`, `frontend/components/ui/input.tsx`, `frontend/components/ui/label.tsx`, `frontend/components/ui/textarea.tsx`

## Self-review
- No TBDs. Volt #D4FF4F on #09090B ≈ 15:1, zinc-400 #A1A1AA on #09090B ≈ 7:1 — passes.
- Scope is single visual system, no backend change — fits one plan.
- Barlow Condensed via next/font avoids layout shift.
