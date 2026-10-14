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
- **Identity kept:** navy + gold, the owner's logo, the slogan "Nourishes
  the soul with the Qur'an", Amiri for display and Work Sans for text (both
  already self-hosted). Since round 3 the page shows the logo without its
  background (see below); the original JPEG stays in the JSON-LD, and the
  root `logo.png`/favicons are unchanged.
- **Primary action** stays "Book a free trial" → `/apply`. WhatsApp contact
  and its anonymous signal are unchanged.

## Round 2 (owner, 2026-10-14)

- **Video removed** at the owner's request, with its eight poster files and the
  YouTube facade script. `vercel.json` still allows `youtube.com` in the
  report-only CSP `frame-src`; it is now unused and can be tightened in a
  separate change.
- **Water and growth motion** for Suqya ("giving water"): a plant watered by
  falling drops in the hero, four growth stages (seed, sprout, young plant,
  grown plant) for the four trial steps, and a slow water line along the top
  of the two navy sections. Inline SVG drawn in code, animated with
  transform and opacity only; loops pause off screen; reduced motion shows
  the grown plants and still water; without script everything still shows.
  Scroll-driven CSS animations were not used because Firefox does not ship
  them by default yet.
- **Wide screens:** the hero board and bar stop at the content width plus
  margins, so text edges line up from laptops to 2560 px screens.

## Round 3 (owner, 2026-10-14)

The owner found the round 2 design too plain, liked the live site's hero
better, asked for photographs and a background-free logo, and asked whether
to drop the programme duration map. Changes:

- **Duration map removed.** Programmes are now six image cards (Tajweed,
  Memorization, Ijazah, Understanding & Reflection, Islamic Studies,
  Arabic) with the LMS catalogue description and skills, and no durations.
  How long a learner needs depends on level and lessons per week, which the
  free trial assesses; a fixed map promised more than the page can know.
  The arithmetic below is kept for the record in case durations return.
- **Photographs** supplied by the owner (AI-generated illustrations): the
  hero (a boy in a one-to-one online lesson) and one image per programme,
  cropped and exported as AVIF + WebP at 480/800 px (hero 640/1024/1590,
  phone crop 480/800; closing band 1600). Watermarks and a stray sparkle
  were removed. Book pages in the images are illustrative and not readable
  Quran text; the owner should still review them before launch.
- **Logo without background:** alpha taken from the original artwork's dark
  background (soft threshold, colours un-premultiplied), exported as WebP
  128/256 px. The SVG alpha-key filter is gone.
- **Layout:** a full-height photographic hero (navy shade, rising gold
  motes, glowing logo, gold headline words; on phones the photo sits above
  the copy so the child and teacher stay visible); About with the Arabic
  motto and Mission / Vision / Approach cards using the approved wording;
  "Why families choose Suqya" feature cards and a band of truthful figures
  (6,236 ayahs tracked, 1:1, 6 programmes, $0 first lesson); step cards for
  the trial; pricing cards with a "Most popular" tag (same data hooks and
  maths); FAQ as native `<details>`; a photographic closing band; a new
  footer. Exactly two `/login` links remain.
- **Behaviour:** the bar is solid without script; the page script marks it
  live, so it is clear over the hero and solid once the page scrolls (wide
  screens show the bar's logo only after scrolling, as the hero carries the
  large one). `select_program` now fires from the programme card links.

## Roadmap durations: the arithmetic (no longer shown)

Assumptions, as they were stated on the page: three 30-minute classes a week (the
most popular plan), about 48 teaching weeks a year, the 604-page Madinah
Mushaf, 240 quarters of a hizb.

| Item | Before | After | Why |
| --- | --- | --- | --- |
| Tajweed phase 1 | 2.5–3 months (steps sum to 8–10 weeks) | steps kept; totals removed | sum was inconsistent |
| Juz Amma and basic Tajweed | "recitation or memorization" in 2–2.5 months | recitation only | memorizing Juz Amma from scratch takes far longer |
| Recitation khatmah | 2–2.5 years | about 1.5–2 years | 240 quarters at one or more per class is under 240 classes, about 1.7 years at three a week |
| Memorization, intensive | 2.5–3 years at 1–2 pages per class | 2.5–3 years at five classes a week, about one page per class | 604 ÷ 240 pages a year = 2.5 years; two new pages in 30 minutes is unrealistic |
| Memorization, regular | 4–5 years at ½–1 page per class | about 4–8 years at three classes a week | 604 ÷ 72–144 pages a year = 4.2–8.4 years |
| Tafsir stage 4 | 12–14 months, Yunus to Al-Hadid | 18–22 months, Yunus to At-Tahrim | Juz 28 was missing from every stage; ~314 pages at stage 3's pace |
| Arabic phase 3 | "advanced fluency" | "building fluency" | ~1 year of three 30-minute lessons is not general fluency |

Islamic Studies (7 months, 84 classes) and the other Arabic and Tafsir
stages are internally consistent and were kept.

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

- Since round 3 the LCP element is the hero photograph. It is preloaded in
  AVIF for the breakpoint that will use it (phone crop or wide image), with
  `fetchpriority="high"`; every other photo is lazy. Fonts are not
  preloaded (lab: font preloads delayed first paint). The page script
  initialises after the first paint; hero entrances are transform/opacity
  only.
- Lab comparison (Playwright, 412 px, 4× CPU, 1.6 Mbps/150 ms, brotli):
  old page LCP ≈ 0.83 s, CLS 0.011, 206 KB; round 2 LCP ≈ 0.83 s, 117 KB;
  round 3 LCP ≈ 0.94–1.04 s, CLS 0, 172 KB on first load. Real-device and
  field data are UNVERIFIED.
- The portal tabs follow the WAI-ARIA tabs pattern; pricing choices and the role switch
  are native radios; the demo dialog traps focus and closes on Escape;
  reduced motion and no-script both leave every section visible.

## Checks

`python3 .github/scripts/verify_asset_hashes.py .`
`python3 .github/scripts/scan_secrets.py .`
`node --test .github/scripts/test_pricing.mjs .github/scripts/test_whatsapp_signal.mjs`
