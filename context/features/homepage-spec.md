# Homepage

## Overview

Replace the placeholder `src/app/page.tsx` with the real marketing homepage, built from the static prototype in `prototypes/homepage/` (`index.html`, `styles.css`, `script.js`). Keep the same sections, copy, layout and animations, rebuilt with React, Tailwind v4 and shadcn/ui. The prototype stays as it is for reference.

## Requirements

- `/` renders the homepage for everyone (it stays out of the proxy matcher)
- Server components by default; `"use client"` only for the pieces that need state, effects or browser APIs (see below)
- Tailwind for all styling and shadcn `Button` (with `asChild` for links), `Badge` and `Card` where they fit; no new CSS file and no copy of `styles.css`
- Keep it DRY: repeated markup (feature cards, plan cards, footer columns, mini dashboard rows) is rendered from typed arrays, not copy-pasted
- Every button and link goes somewhere real (see Links); no `href="#"`
- Page metadata: title "DevStash — Store Smarter. Build Faster." and the prototype's description

## Component Structure

Put the components in `src/components/homepage/`. `page.tsx` only composes them.

| Component | Kind | Notes |
| --- | --- | --- |
| `HomeNav` | client | Fixed nav; adds a more opaque background and border after scrolling 16px (passive scroll listener). Takes `signedIn` from the page |
| `Hero` | server | Eyebrow, headline with gradient text, subtitle and CTAs, then the chaos → arrow → dashboard visual |
| `ChaosIcons` | client | The 8 floating icons. `requestAnimationFrame` loop with the prototype's behavior: drift, wall bounce (velocity pointed away from the wall), subtle rotation and scale pulse, repelled by the pointer, paused while off screen and when reduced motion is on. Positions held in refs, written to `style.transform` (no re-render per frame); listeners and the frame cancelled on unmount |
| `MiniDashboard` | server | The "...with DevStash" preview; sidebar rows and cards rendered from the item type list |
| `Features` | server | 6 cards from a `FEATURES` array (title, description, Lucide icon, color) |
| `AiSection` | server | Pro Feature badge, checklist, and the editor mockup (window dots reuse the `--color-window-*` tokens from the Code Editor) |
| `AiTags` | client | The 5 AI tags popping in one at a time once the editor is in view; all shown straight away with reduced motion |
| `Pricing` | client | Monthly/Yearly toggle (`aria-pressed`) plus the two plans; switches Pro between $8/month and $72/year |
| `PlanCard` | server-safe | Presentational plan card used by `Pricing` (no hooks, so it can render inside the client component) |
| `CtaSection` | server | "Ready to Organize Your Knowledge?" |
| `HomeFooter` | server | Logo, link columns from an array, © current year |
| `Reveal` | client | Fade/slide-in wrapper using one `IntersectionObserver` per element; content renders visible when reduced motion is on |

- Extract the logo (gradient square with Lucide `Layers` + "DevStash") into a shared `Logo` component in `src/components/` and use it in `HomeNav`, `HomeFooter` and the `(auth)` layout, which currently has its own copy
- Brand icons (Notion, GitHub, Slack, VS Code) aren't in `lucide-react` v1: keep the prototype's inline SVGs as small components in `ChaosIcons`; use Lucide for the rest (browser tabs, terminal, text file, bookmark, feature icons, checklist checks, arrow)
- Static content (features, plans, footer links, chaos icons, AI tags, code sample) lives in `src/components/homepage/content.ts` as typed constants, so the components stay markup-only
- Pull the chaos physics (`stepIcon`: repel, speed easing, wall bounce, rotation) into a pure function in `src/lib/chaos-physics.ts` so it can be unit-tested and `ChaosIcons` only handles DOM, refs and the frame loop

## Links

The page reads the session (`auth()`) to choose the nav and CTA targets.

| Element | Signed out | Signed in |
| --- | --- | --- |
| Logo (nav, footer) | `#top` | `#top` |
| Features / Pricing nav links, footer Product links | `#features`, `#pricing`, `#ai` | same |
| Nav Sign In | `/sign-in` | hidden |
| Nav Get Started | `/register` | "Dashboard" → `/dashboard` |
| Hero "Get Started Free", CTA button | `/register` | `/dashboard` |
| Hero "See Features" | `#features` | `#features` |
| Free plan "Get Started" | `/register` | `/dashboard` |
| Pro plan "Upgrade to Pro" | `/register` | `/settings` (placeholder until Stripe phase 2 adds the real upgrade flow) |

- Smooth scrolling for in-page anchors (`scroll-smooth` on the page wrapper), with `scroll-mt` on sections so headings clear the fixed nav
- Drop the footer's Resources and Company columns (Docs, Changelog, Support, About, Privacy, Terms): those pages don't exist. Keep Product, and add an Account column (Sign In, Register; Dashboard when signed in)

## Styling

- Dark theme from the existing tokens in `globals.css` (`bg-background`, `bg-card`, `text-muted-foreground`, `border`)
- Use the app's seeded item type colors (see `context/project-overview.md`) instead of the prototype's palette, so the homepage matches the sidebar and cards. Define them once in `content.ts`; colors are applied via a CSS variable on the element (e.g. `style={{ "--type-color": color }}` with `border-(--type-color)`), which is the only inline style allowed
- Gradient text with `bg-linear-to-r … bg-clip-text text-transparent`, matching the logo gradient (blue-500 → violet-600)
- Pulsing arrow and tag pop-in as `@keyframes` in `globals.css` via `@theme` animations (e.g. `--animate-pulse-arrow`), wrapped in `motion-safe:`
- Responsive as in the prototype: hero visual stacks below `md` with the arrow rotated 90° to point down, feature and plan grids go to one column, nav links hide below `sm`, Sign In hides at the smallest widths; no horizontal scroll at 320px (only the code sample scrolls inside its box)

## Testing

- Unit tests for `src/lib/chaos-physics.ts`: bouncing off each wall reverses velocity away from it and clamps the position, the pointer pushes a nearby icon away and not a distant one, speed eases back toward the base speed and never exceeds the max
- Verify in the browser at 1440, 1024, 768, 390 and 320px: every link from the table (signed out and as the demo user), anchors landing below the nav, nav opacity change, icons moving, staying in bounds and moving away from the cursor, the pricing toggle, tags popping in, reveal on scroll, reduced motion (no motion, all content visible), and no console errors

## Out of Scope

- Stripe checkout from the pricing cards (Stripe phase 2)
- Pages for the removed footer links
- Changing the prototype files
