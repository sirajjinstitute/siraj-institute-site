# Landing page redesign (October 2026)

Owner request, 2026-10-14: a new, conversion-focused landing page with full
authority to rewrite content, an interactive student/parent demo that mirrors
the live LMS, the existing logo, and the current pricing presentation at
**$14.99 per teaching hour**.

## Decisions recorded here

- **Hourly rate: $14.99** (owner, 2026-10-14). Each package is its monthly
  teaching hours at that rate (4/6/8/10 h → $59.96/$89.94/$119.92/$149.90).
  Family discounts (2/3/4 learners: 10/15/20%) and billing discounts
  (quarterly/semi-annual/annual: 5/10/15%) are unchanged and never stack: the
  bigger one applies. "Design your own plan" uses the same $14.99 rate.
  Amounts are rounded to cents per month; the billed total is that monthly
  figure times the months. `.github/scripts/test_pricing.mjs` runs the page's
  own pricing block. This changes only the public page; LMS package prices
  are separate data and were not touched.
- **Identity kept:** navy + gold, the owner's logo (the original JPEG, plus
  two cropped WebP copies of the same artwork for small sizes), the slogan
  "Nourishes the soul with the Qur'an", Amiri for display and Work Sans for
  text (both already self-hosted).
- **Primary action** stays "Book a free trial" → `/apply`. WhatsApp contact
  and its anonymous signal are unchanged.

## The portal demo

The "Try the Suqya portal" section rebuilds the student portal (Today, My
Lessons, Homework & Evaluation, My Progress, Balance) and the guardian child
page (balance, next lesson, Overview / Quran & books / Achievements / Listen,
monthly report, share card) in static HTML with **sample data only**. Labels
follow the LMS (`STUDENT_NAV`, `components/guardian/child-view.tsx`, badge
catalogue). Nothing is stored or sent, no microphone is opened, and
recordings play silence. Surah names are English transliterations; no Quran
text is reproduced. If an LMS label or flow changes, update the demo.

## Performance and accessibility notes

- LCP is text; nothing is preloaded (lab: font preloads delayed first paint).
  The page script initialises after the first paint. Hero entrances are
  transform-only, so they never hold back the LCP paint.
- Lab comparison (Playwright, 412 px, 4× CPU, 1.6 Mbps/150 ms, brotli):
  old page LCP ≈ 0.83 s, CLS 0.011, 206 KB; new page LCP ≈ 0.83 s, CLS ≈ 0,
  117 KB. Real-device and field data are UNVERIFIED.
- Tabs follow the WAI-ARIA tabs pattern; pricing choices and the role switch
  are native radios; the demo dialog traps focus and closes on Escape;
  reduced motion and no-script both leave every section visible.

## Checks

`python3 .github/scripts/verify_asset_hashes.py .`
`python3 .github/scripts/scan_secrets.py .`
`node --test .github/scripts/test_pricing.mjs .github/scripts/test_whatsapp_signal.mjs`
