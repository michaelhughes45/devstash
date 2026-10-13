# Homepage UI Review

**Last review:** 2026-10-13
**Scope:** `/` signed out and signed in (`src/app/page.tsx`, `src/components/homepage/*`)
**Method:** Playwright on the dev server at 375px, 768px and 1280px. View only, no data changed.

## Summary

| Severity | Count |
| --- | --- |
| High | 0 |
| Medium | 3 |
| Low | 5 |

No horizontal scroll at any width and no console errors. The main problems are hero content that's hidden until the page's JavaScript loads, no sign-in link in the nav on phones, and no social proof.

## Findings

### [MEDIUM] Hero is blank on first paint

- **Viewport:** All (clearest at 768px)
- **Location:** `Hero` (the headline, subheadline and CTAs are wrapped in `Reveal`)
- **Issue:** A screenshot taken straight after loading `/` showed only the nav and the background glow. The headline and buttons fade in a second or two later, once the page's JavaScript has loaded.
- **Impact:** The value proposition and CTAs aren't visible above the fold at first, and the main content paints late (worse LCP).
- **Fix:** Don't wrap the hero copy and CTAs in `Reveal`; render them visible on the server. Keep the reveal for the sections further down.

### [MEDIUM] No sign-in link in the nav on phones

- **Viewport:** 375px (anything at or below 420px)
- **Location:** `HomeNav`
- **Issue:** Signed out, the nav shows only the logo and "Get Started", with no menu. Returning users have to scroll to the footer to sign in.
- **Fix:** Keep a compact "Sign in" text link at small widths, or add a small menu.

### [MEDIUM] No social proof

- **Viewport:** All
- **Location:** Page-wide
- **Issue:** There are no testimonials, user counts, logos, GitHub stars or ratings. The CTA's "Join developers who…" is the only reference to other users.
- **Fix:** Add a proof strip under the hero CTAs or above Pricing.

### [LOW] Footer and nav links are small tap targets

- **Viewport:** 375px (footer); larger widths (nav)
- **Location:** `HomeFooter`, `HomeNav`
- **Issue:** Footer links are 20px tall, and "AI" is 13×20px, under the 24px minimum. The Features and Pricing nav links are also 20px tall.
- **Fix:** Add `py-2` or `inline-block min-h-6`; aim for 44px on mobile.

### [LOW] AI code block can't be scrolled by keyboard

- **Viewport:** 375px
- **Location:** `AiSection` code editor mockup (`<pre>`)
- **Issue:** The block scrolls sideways (scrollWidth 492px against a 326px width) but can't take focus, so keyboard users can't scroll it.
- **Fix:** Add `tabIndex={0}` and an `aria-label`, or wrap the code on small screens.

### [LOW] Single words left alone on heading lines

- **Viewport:** 1280px ("place" in the Features heading), 375px ("hub.")
- **Location:** `SectionHeader`
- **Fix:** `text-balance` on section titles and `text-pretty` on lead text.

### [LOW] Hero visual is very tall on phones

- **Viewport:** 375px
- **Location:** `Hero` (`ChaosIcons` panel plus `MiniDashboard`)
- **Issue:** Stacked, the two panels take about 1,300px, pushing Features far down. Chaos icons also overlap each other (a known behaviour).
- **Fix:** Show fewer mini-dashboard cards, or shorten the chaos box, below `md`.

### [LOW] Free plan button says "Get Started" when signed in

- **Viewport:** All, signed in
- **Location:** `Pricing` / `PlanCard`
- **Issue:** The button goes to `/dashboard` but still reads "Get Started", while the hero and CTA read "Go to Dashboard".
- **Fix:** Label it "Go to Dashboard" (or "Current plan") when signed in.

## Looks good

- No horizontal scroll at 375, 768 or 1280px; no console errors or warnings.
- Clear hierarchy: eyebrow, gradient headline, lead text, then primary and secondary CTAs.
- The Monthly/Yearly toggle works and updates `aria-pressed` ($8/month ↔ $72/year, "$6/month, billed yearly").
- Pro stands out with the "Most Popular" badge.
- Signed in, the nav shows "Dashboard" and the hero and CTA read "Go to Dashboard".
- The decorative chaos icons are `aria-hidden`, and no image is missing alt text.
- Focus rings are visible on the pricing toggle and nav buttons.

## Not checked

- Light mode.
- A real screen reader (accessible names were checked through the DOM and accessibility snapshot only).
- Contrast was checked with a script; the cases it flagged were false positives from translucent backgrounds and gradient text.
