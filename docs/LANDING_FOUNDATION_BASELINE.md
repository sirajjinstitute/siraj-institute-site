# Siraj Institute Landing Page — Technical Baseline

**Wave:** 1A — Foundation, Security, Technical SEO & Search Identity
**Audit date:** 2026-08-16
**Base commit (`origin/main`):** `8161890e7d88fecb8f87adc1838f20376a735d7d`
**Branch:** `claude/siraj-landing-wave-1a-yzag91`

This document records the measured state of the repository at the Wave 1A
baseline. It is intentionally factual: measurements are labelled with how they
were obtained, and anything that could not be verified is marked as such rather
than inferred.

---

## 1. Evidence classes

Three classes are used throughout this document. They are not interchangeable.

| Class | Meaning |
| --- | --- |
| **REPO** | Read directly from the repository at the base SHA. |
| **LAB** | Measured in this session against a local static server serving the repository files, using Chromium 1194 / Lighthouse 13.4.1. |
| **UNVERIFIED** | Could not be observed from this session. Stated as an open question, never as a finding. |

### Verification gap — live production was not reachable

The session's network egress policy denied all outbound HTTPS to the production
hostnames and to Google's documentation:

```
sirajinst.com:443       -> gateway answered 403 to CONNECT (policy denial)
www.sirajinst.com:443   -> EGRESS_BLOCKED
developers.google.com   -> EGRESS_BLOCKED
```

Per the proxy's operating rules a policy denial must be reported rather than
routed around, so no third-party fetching service was used to reach the site
indirectly. Consequently the following were **not** empirically established and
remain UNVERIFIED:

- the apex/www redirect direction and status codes
- live response headers (including whether Vercel is already sending HSTS)
- live canonical/OG values as served
- transfer encoding and caching behaviour in production
- third-party request behaviour in production

On the first item: the redirect direction was **verified visually by the
owner/CTO** (`sirajinst.com` → 308 → `www.sirajinst.com`) and is recorded in §4
on that authority. This session did not and could not observe it. What keeps
F-01 open is not the routing — that is already correct — but that this PR's
corrected metadata is not live until deployed.

DNS did resolve, and is recorded as REPO-adjacent factual evidence:

```
sirajinst.com       -> 64.29.17.1, 216.198.79.65
www.sirajinst.com   -> 216.198.79.65, 216.198.79.1
```

Both hostnames resolve into Vercel address space, consistent with Vercel
hosting, but DNS does not disambiguate which hostname is canonical.

---

## 2. Repository architecture (REPO)

A flat, static, single-page site. No build step, no framework, no package
manifest, no dependency tree.

```
index.html                    226.9 KiB   entire site: markup + inline CSS + inline JS
logo.png                      306.8 KiB   512x512 RGBA — social/structured-data only, never rendered
favicon.png                   290.8 KiB   512x512 — byte-identical duplicate of android-chrome-512x512.png
android-chrome-512x512.png    290.8 KiB   512x512
android-chrome-192x192.png     43.2 KiB   192x192
apple-touch-icon.png           38.8 KiB   180x180
favicon.ico                     8.0 KiB   contains 16x16, 32x32, 48x48
favicon-32x32.png               2.5 KiB
favicon-16x16.png               0.8 KiB
robots.txt                       67 B
sitemap.xml                     230 B
site.webmanifest                439 B
```

Added by Wave 1A: `vercel.json`, `.github/workflows/secret-scan.yml`,
`.github/scripts/scan_secrets.py`, `docs/LANDING_FOUNDATION_BASELINE.md`.

### Document structure (REPO)

| Region | Lines (post-change) | Notes |
| --- | --- | --- |
| `<head>` | 1–529 | metadata, 2 JSON-LD blocks, Google Fonts, inline `<style>`, gtag |
| inline `<style>` | 72–520 | ~449 lines, the site's entire stylesheet |
| `<body>` | 530–1058 | nav, hero, why, about, programs, pricing, next steps, FAQ, footer |
| inline `<script>` | 913–1057 | ~144 lines, the site's entire JavaScript |

There is no external CSS or JS file. All styling and behaviour is inline, which
is the single most important constraint on CSP work (see §6).

### JavaScript behaviour (REPO / LAB)

The inline script is self-contained and does the following: sets the footer
year; builds WhatsApp deep links and rewrites the four `.wa-link` hrefs;
reveals a floating WhatsApp button past 260px scroll; toggles the mobile menu;
generates 22 randomised decorative "motes" (skipped under
`prefers-reduced-motion: reduce`); drives the program tabs; and renders the
pricing grid.

No `eval`, no `document.write`, no inline event-handler attributes, no
`javascript:` URLs, and no `localStorage` / `sessionStorage` / `document.cookie`
use by the site's own code. One `innerHTML` assignment renders the pricing grid
from static in-script data with no user-controlled input.

### Third parties (REPO)

| Service | Purpose | Loaded |
| --- | --- | --- |
| `www.googletagmanager.com/gtag/js?id=G-667Q0LLEH2` | Google Analytics 4 | `async`, in `<head>` |
| `fonts.googleapis.com` / `fonts.gstatic.com` | Amiri + Work Sans | render-blocking `<link rel=stylesheet>`, with `preconnect` |
| `www.youtube.com/embed/Ng5P2SusEsQ` | "Why families choose us" video | `<iframe loading="lazy">` |

Outbound user destinations: `wa.me/201004751455` (booking + contact),
`siraj-lms.vercel.app/login` (Login, two links), `mailto:sirajjinstitute@gmail.com`,
and Facebook / YouTube / Instagram profile links.

---

## 3. Security

### Secrets audit — result

**No Siraj-owned privileged secret exposure found in the audited client repository.**

Scope and method:

- Keyword sweep across the working tree for key/secret/token/credential/provider
  patterns, with base64 `data:` URIs elided so embedded images could not mask or
  fabricate matches. **0 hits.**
- High-entropy sweep for opaque strings ≥20 chars in `index.html` with data URIs
  elided. All 9 survivors were CSS property names or schema type names
  (`-webkit-backdrop-filter`, `EducationalOrganization`, …). **0 credential-shaped strings.**
- **Full git history**: every blob in `git rev-list --objects --all` (18 text
  blobs across 40 commits) scanned. **0 matches.**

Candidate values that exist and were each classified rather than flagged:

| Value | What it is | Intended public? | Privileges | Verdict |
| --- | --- | --- | --- | --- |
| `G-667Q0LLEH2` | GA4 Measurement ID | Yes — required client-side by design | Write-only event ingestion; cannot read reports or alter the property | Not a vulnerability. Worst case is event spam, a known property of every GA4 site. |
| `201004751455` | WhatsApp business number | Yes — published contact | None | Not a secret. |
| `sirajjinstitute@gmail.com` | Contact email | Yes — published contact | None | Not a secret. Corrected spelling — see F-09. |
| `siraj-lms.vercel.app/login` | LMS login URL | Yes | None; auth enforced by the LMS | Not a secret. |
| `Ng5P2SusEsQ` | YouTube video ID | Yes | None | Not a secret. |

No `.env` file, no PEM/key material, no service-role key, no bearer token, and
no privileged endpoint has ever existed in this repository's history.

Note that this repository is **public**, so its entire contents are already
public by definition. That is consistent with its function — a static marketing
page has no server side and therefore no legitimate need for any secret.

### Secret-regression protection

The repository had **no** CI and no security scanning before Wave 1A.

Added: `.github/workflows/secret-scan.yml`, running
`.github/scripts/scan_secrets.py` on every push, every PR, and manual dispatch.

Rationale for this shape over a third-party Action:

- The repo is 12 files with no build and no dependencies. A pinned third-party
  Action would add a supply-chain surface and a version to keep current, for a
  project whose entire attack surface is static files.
- The script has **no dependencies and makes no network calls**, so there is no
  artifact to pin, no checksum to rotate, and nothing that can drift.
- It was verifiable from this session. A downloaded binary pinned to a checksum
  could not have been validated here, which would have meant committing an
  untested workflow.

**What it detects:** AWS access keys, GitHub tokens (classic + fine-grained),
Google API keys, Slack tokens, live Stripe keys, npm and SendGrid tokens,
OpenAI/Anthropic keys, any JWT (the shape a Supabase service-role key takes),
PEM private-key blocks, and secret-named variables assigned long opaque literals.

**What it does not detect:** secrets shaped like ordinary text (a bare password,
a short token), anything already in history before it was added, secrets in
binary files, and leaks that happen outside this repository. It is a net, not a
guarantee.

**Log safety:** matched values are never printed. Findings emit rule name, file
and line number only, so a candidate secret is not copied into public CI logs.

**Validation performed (LAB):**

| Test | Expectation | Result |
| --- | --- | --- |
| Scan the real repository | clean | 15 files scanned, **0 findings**, exit 0 |
| Scan 9 synthetic, structurally-valid fake credentials | all caught | **9/9 caught**, exit 1 |
| Negative controls: 4000-char base64 data URI, GA4 ID, WhatsApp number, CSS | no findings | **0 false positives** |

The workflow itself has not executed on GitHub — it will run for the first time
on the Wave 1A pull request. Its YAML parses and its `permissions` are
`contents: read`.

**Recommended primary control (owner action, not committed):** GitHub's native
secret scanning with **push protection** is free for public repositories and
blocks a push containing a recognised provider secret, rather than reporting it
after the fact. Enable at *Settings → Code security and analysis*. The committed
workflow is then a second net rather than the only one. This session could not
confirm whether it is already enabled — the GHAS-backed API returned
"Repository does not have GitHub Advanced Security enabled", which reports on
the paid product and does not settle the free public-repo setting.

### HTTP security headers

**Before (REPO):** no `vercel.json` existed, so the repository configured **no**
headers at all. Whatever production sends today comes entirely from Vercel
defaults. Because live headers were unreachable (§1), the "before" state on the
wire is UNVERIFIED.

**After (REPO):** `vercel.json` applies to `/(.*)`:

| Header | Value | Why |
| --- | --- | --- |
| `X-Content-Type-Options` | `nosniff` | Stops MIME-type sniffing. No downside for a static site. |
| `Referrer-Policy` | `strict-origin-when-cross-origin` | Full referrer same-origin, origin-only cross-origin, nothing over a downgrade. Matches modern browser defaults, made explicit. |
| `Permissions-Policy` | `geolocation=(), microphone=(), camera=(), payment=(), usb=(), magnetometer=(), midi=(), serial=(), bluetooth=(), browsing-topics=()` | Disables powerful features the page never uses. |
| `Content-Security-Policy` | `base-uri 'none'; object-src 'none'; frame-ancestors 'self'` | See §6. |

**`Permissions-Policy` — the constraint that shaped the list.** An iframe can
only ever receive permissions the parent document holds, so a top-level policy
that omits a feature disables it inside the YouTube embed too. The embed's
`allow` attribute requests `accelerometer`, `autoplay`, `clipboard-write`,
`encrypted-media`, `gyroscope`, `picture-in-picture` and `web-share` — and
`encrypted-media` in particular is required for playback. **None of those seven
appear in the policy**, by design. Only features neither the page nor the embed
uses are disabled.

**Deliberately not added:**

- `Strict-Transport-Security` — Vercel enables HSTS by default on custom
  domains. Since live headers were unreachable, adding a second, unverifiable
  HSTS with a long `max-age` is a foot-gun. **Verify after deploying the preview**
  and add only if genuinely absent (§9).
- `X-Frame-Options` — superseded by CSP `frame-ancestors`, which every browser
  that matters supports. Adding it would be a legacy header added purely to move
  a scanner grade.

---

## 4. Canonical / domain consistency — FINAL CTO DECISION: www

**Canonical public URL:**

```
https://www.sirajinst.com/
```

### Production routing — already configured, unchanged, out of scope

The Vercel Production domain configuration was **visually verified by the
owner/CTO** (not by this session — see §1 for why live hosts are unreachable
from here):

```
https://sirajinst.com/       -> HTTP 308 -> https://www.sirajinst.com/
https://www.sirajinst.com/   -> Production
```

This routing is **intentional and must remain unchanged**. Vercel domain
settings are out of scope and were not modified.

**Browser UX note.** The owner's actual requirement was that Chrome's address
bar visually show `sirajinst.com` without the `www`. Chrome hides the `www`
prefix in its display regardless of the underlying host, so that requirement is
**already satisfied** by the current routing. Address-bar presentation is a
browser display choice and is not a reason to reverse Production routing.

An earlier revision of this document recorded the opposite decision (apex
canonical, with a plan to reverse the redirect to `www -> apex`). That decision
was **revoked by the CTO** and all of that language has been removed.

### What this PR changed

The repository metadata pointed at the apex, which 308-redirects away —
i.e. `rel=canonical` named a URL that is not the one Production serves. This PR
aligns all 11 signals with the existing Production routing:

| # | Location | Before | After |
| --- | --- | --- | --- |
| 1 | `index.html` `rel=canonical` | `https://sirajinst.com/` | `https://www.sirajinst.com/` |
| 2 | `index.html` `og:url` | `https://sirajinst.com/` | `https://www.sirajinst.com/` |
| 3 | `index.html` `og:image` | `https://sirajinst.com/logo.png` | `https://www.sirajinst.com/logo.png` |
| 4 | `index.html` `twitter:image` | `https://sirajinst.com/logo.png` | `https://www.sirajinst.com/logo.png` |
| 5 | `index.html` Organization `url` | `https://sirajinst.com/` | `https://www.sirajinst.com/` |
| 6 | `index.html` Organization `logo` | `https://sirajinst.com/logo.png` | `https://www.sirajinst.com/logo.png` |
| 7 | `index.html` Organization `image` | `https://sirajinst.com/logo.png` | `https://www.sirajinst.com/logo.png` |
| 8 | `index.html` WebSite `url` | `https://sirajinst.com/` | `https://www.sirajinst.com/` |
| 9 | `index.html` WebSite publisher `logo` | `https://sirajinst.com/logo.png` | `https://www.sirajinst.com/logo.png` |
| 10 | `robots.txt` `Sitemap:` | `https://sirajinst.com/sitemap.xml` | `https://www.sirajinst.com/sitemap.xml` |
| 11 | `sitemap.xml` `<loc>` | `https://sirajinst.com/` | `https://www.sirajinst.com/` |

Only URL-form occurrences were rewritten. The bare string `"sirajinst.com"`
inside `WebSite.alternateName` is a **site-name candidate, not a URL**, and was
deliberately left as-is (§5).

`site.webmanifest` uses relative URLs (`/`, `/android-chrome-*.png`) and needs
no change. LMS, WhatsApp, YouTube, social, font and analytics URLs were
classified as out-of-scope external services and left untouched.

### F-01 status

> **CODE FIXED IN PR — REQUIRES PRODUCTION DEPLOYMENT & LIVE VERIFICATION TO CLOSE.**

Production routing already matches the final decision, so **no Vercel routing
change is required** and the earlier "Production routing change still required"
status is stale and removed. What remains is purely that this PR's metadata is
not live until it is deployed.

Three states, kept distinct on purpose:

| State | Status |
| --- | --- |
| Production routing (apex 308 → www) | **Already configured** — owner-verified, unchanged by this PR |
| Repository canonical metadata | **Fixed in this PR** (table above) |
| Live metadata as served | **Not yet corrected** — requires an authorised deployment |

Do **not** claim the live site's metadata is corrected until deployed. After a
future authorised Production deployment, verify:

1. `sirajinst.com` returns a permanent redirect to `www`
2. `www.sirajinst.com` serves Production
3. `rel=canonical` points to `www`
4. `sitemap.xml` uses `www`
5. structured data uses `www`
6. security headers are actually delivered on the wire

That deployment is **not authorised in Wave 1A** and was not performed.

---

## 5. Google Search site name

The stated goal is for Google to display **Siraj Institute** rather than the raw
domain above the result title.

### Owner-specified search identity

The owner/CTO has specified the preference order directly:

| Role | Value |
| --- | --- |
| Primary site name (`name`) | **Siraj Institute** |
| Alternate 1 (`alternateName[0]`) | **Siraj-Institute** |
| Alternate 2 (`alternateName[1]`) | **Siraj Institute Online** |
| Alternate 3 (`alternateName[2]`) | **sirajinst.com** — final domain fallback only |

`Siraj-Institute` exists to give Google a second candidate should the preferred
name collide with another global site of a similar name. `sirajinst.com` is a
last-resort fallback, **not** a preferred display name.

### Before (REPO, at base SHA)

| Signal | Value | Assessment |
| --- | --- | --- |
| WebSite `name` | `Siraj Institute` | Correct |
| WebSite `alternateName` | `["Siraj Institute Online", "sirajinst.com"]` | Did not express the owner's preference order; missing `Siraj-Institute`, and the domain was not marked as a last resort |
| `og:site_name` | `Siraj Institute` | Correct |
| `<title>` | `Siraj Institute — Learn Quran & Arabic Online, 1-on-1` | Correct; brand leads |
| `application-name` | `Siraj Institute` | Correct |
| `apple-mobile-web-app-title` | `Siraj Institute` | Correct |
| manifest `name` / `short_name` | `Siraj Institute` | Correct |
| Visible brand (nav, hero, footer) | `Siraj Institute` | Correct |
| Favicon | `favicon.ico` includes a **48×48** entry | Meets Google's favicon requirement |

### After (this PR)

```json
{
  "@context": "https://schema.org",
  "@type": "WebSite",
  "name": "Siraj Institute",
  "alternateName": [
    "Siraj-Institute",
    "Siraj Institute Online",
    "sirajinst.com"
  ],
  "url": "https://www.sirajinst.com/",
  "publisher": {
    "@type": "EducationalOrganization",
    "name": "Siraj Institute",
    "logo": "https://www.sirajinst.com/logo.png"
  }
}
```

`name` carries the primary site name; `alternateName` carries the three
fallbacks in descending preference. `WebSite.url` is the canonical **www**
host (§4).

Note the deliberate distinction: `alternateName` still contains the bare string
`sirajinst.com`. That is a **site-name candidate**, not a URL — it is the
last-resort name Google may display, and it is unrelated to `WebSite.url`. The
two are different concepts and were treated separately.

### Correction to earlier guidance in this document

An earlier revision of this document and of PR #2 stated that Google supports
**only one** `alternateName`, and reasoned from that premise that adopting
`Siraj-Institute` would mean **giving up** `Siraj Institute Online`.

**Both statements were wrong and have been removed.** Current Google Search
Central guidance supports **multiple** `alternateName` values for `WebSite`
structured data, ordered by preference — so no trade-off between the two names
was ever required.

Provenance of this correction, stated plainly: it was supplied by **CTO
review**, not verified against Google's live documentation from this session.
`developers.google.com` is blocked by the session's egress policy (§1), so
independent re-verification was not possible here. The correction is applied on
CTO authority; the blocked lookup is recorded, not treated as a blocker.

### Visible brand — unchanged

The visible brand remains **Siraj Institute** everywhere: logo text, navbar,
hero, footer, and the Organization entity. `Siraj-Institute` is a
*search-identity signal only* and was deliberately **not** propagated to any
user-visible branding.

### Consistency audit

| Signal | Value | Agrees? |
| --- | --- | --- |
| `WebSite.name` | `Siraj Institute` | ✅ |
| `WebSite.alternateName` | ordered 3-value array | ✅ owner order |
| `EducationalOrganization.name` | `Siraj Institute` | ✅ |
| `WebSite.publisher.name` | `Siraj Institute` | ✅ |
| `og:site_name` | `Siraj Institute` | ✅ |
| `<title>` | leads with `Siraj Institute` | ✅ |
| `<h1>` / visible nav / hero / footer | `Siraj Institute` | ✅ |
| Favicon | `favicon.ico` with 48×48 entry | ✅ |
| Canonical | `https://www.sirajinst.com/` | ✅ matches `WebSite.url` |

### Limitation

**Google controls the final rendered Site Name.** Structured data expresses a
*preference*; it does not guarantee the displayed result. Google selects the
displayed name from several converging signals and may keep showing the domain
regardless of correct markup. Any change also requires Google to recrawl and
reprocess the homepage **after** a Production deployment — which has not
happened and is not authorised here.

---

## 6. Content Security Policy

The page has ~449 lines of inline CSS and ~144 lines of inline JavaScript in a
single document. A policy with `default-src` / `script-src` / `style-src` would
therefore require either `'unsafe-inline'` — which is security theatre — or the
inline-to-external extraction that belongs to Wave 1B. Both were rejected.

**Shipped:** `base-uri 'none'; object-src 'none'; frame-ancestors 'self'`

Each directive was checked against the actual document before being included:

| Directive | Verified precondition (LAB/REPO) | Effect |
| --- | --- | --- |
| `base-uri 'none'` | 0 `<base>` elements | Blocks base-tag injection re-pointing every relative URL |
| `object-src 'none'` | 0 `<object>` / `<embed>` / `<applet>` | Removes a legacy plugin vector |
| `frame-ancestors 'self'` | Page is not designed to be embedded | Clickjacking protection |

Because `default-src` is absent, unlisted resource types are **unrestricted**:
inline CSS/JS, Google Fonts, gtag and the YouTube iframe are all untouched. This
was confirmed empirically — the full regression suite (§8) shows zero
functional differences.

`frame-ancestors` governs who may frame *us*; it has no effect on the YouTube
iframe, which is governed by `frame-src` and is deliberately not set.

**Report-Only was considered and judged unnecessary** for these three
directives, because each precondition is verifiable by inspection and none can
block a resource the page actually loads. Report-Only *is* the right first step
for the Wave 1B policy that adds `script-src` / `style-src` — collect violations
before enforcing.

---

## 7. Performance baseline

Lighthouse 13.4.1, mobile form factor, simulated throttling, local static
server. **Third-party hosts were blocked by the egress policy in both runs**, so
these numbers exclude Google Fonts, gtag and YouTube. Real-world figures will be
worse; before/after remains a valid controlled comparison because both runs
faced identical conditions.

| Metric | Before | After | Target |
| --- | --- | --- | --- |
| Performance | 78 | **81** | — |
| Accessibility | 93 | 93 | — |
| Best practices | 96 | 96 | — |
| SEO | 100 | 100 | — |
| First Contentful Paint | 2.9 s | **2.6 s** | — |
| **Largest Contentful Paint** | 3.2 s | **2.9 s** | ≤ 2.5 s |
| Total Blocking Time | 0 ms | 0 ms | INP ≤ 200 ms |
| Cumulative Layout Shift | 0 | 0 | ≤ 0.1 |
| Time to Interactive | 3.2 s | 2.9 s | — |
| Total transfer | 336 KiB | **279 KiB** | — |
| `index.html` raw | 284.0 KiB | **226.9 KiB** | — |
| `index.html` gzip | 190.3 KiB | **147.3 KiB** | — |

LCP still exceeds 2.5 s, and does so with third parties excluded. Field INP was
unavailable; TBT of 0 ms is the lab proxy and reflects a page with very little
JavaScript. CLS is already 0 — every `<img>` carries explicit `width`/`height`.

### The dominant finding: one logo, inlined four times

`index.html` contained the **same** 640×640 palette PNG (42.7 KiB decoded,
58,338 base64 chars) **four times**, totalling 233,264 characters — **80.2% of
the entire document**:

| Occurrence | Element | Rendered size (LAB) |
| --- | --- | --- |
| line 36 | `<link rel="preload" as="image" fetchpriority="high">` | *never rendered* |
| line 537 | nav brand `<img>` | 42×42 |
| line 565 | hero `<img fetchpriority="high">` | 118×118 |
| line 873 | footer `<img loading="lazy">` | 56×56 |

Two observations follow. First, **the preload was a no-op**: a `data:` URI is
already inline in the document, so "preloading" it fetches nothing, while
costing 58 KiB of parse ahead of the font `preconnect` further down `<head>`.
Second, a 640×640 source is decoded to paint at 42×42, 118×118 and 56×56 — and
`loading="lazy"` on a data URI is meaningless, since the bytes have already
arrived.

**Fixed in Wave 1A:** the preload was removed. One line, −58,418 raw bytes
(−43,938 gzipped), no rendered element affected. Proven safe in §8.

**Deferred to Wave 1B:** the remaining 3× duplication.

### Other measured costs

- `favicon.png` is a **byte-identical duplicate** of `android-chrome-512x512.png`
  (297,819 bytes each, same SHA-256) — 291 KiB of pure repository duplication,
  and it is referenced as a 512×512 `rel=icon`.
- `logo.png` (306.8 KiB, 512×512) is never rendered on the page. It exists only
  as `og:image` and structured-data `logo`/`image`.
- Google Fonts loads as a **render-blocking** stylesheet requesting two families
  and 9 weights (Work Sans 300–800 plus Amiri 400/700 + italic). Lighthouse
  attributed ~660 ms of render-blocking to it.
- Lighthouse's "Document request latency — 190 KiB" is a **local-server
  artefact**: the test server sends no compression, whereas Vercel serves gzip
  or brotli. Do not carry that number forward.

### Wave 1B — Performance Architecture (specification)

1. **Externalise the logo.** Extract the inline PNG to a single cached file and
   point all three `<img>` elements at it. Expected: `index.html` ~227 KiB → ~52 KiB
   raw (~147 KiB → ~15 KiB gzipped), with the 42.7 KiB image fetched once and
   cached thereafter. Net first load ≈ −132 KiB; repeat visits ≈ −175 KiB.
2. **Serve correctly-sized logos.** Generate variants near the real paint sizes
   (roughly 96 / 256 / 128 CSS px, times DPR) instead of one 640×640 for all three.
3. **De-duplicate `favicon.png`** against `android-chrome-512x512.png`.
4. **Fonts.** Cut weights to those actually used; consider self-hosting to remove
   the third-party render-blocking round trip; `preload` only genuinely critical faces.
5. **YouTube façade.** Replace the eager iframe with a poster image that loads
   the player on click, and switch to `youtube-nocookie.com` (§10).
6. **Extract inline CSS/JS**, which unlocks the stricter CSP in §6.
7. **Re-measure** with third parties reachable; the numbers above are a floor.

---

## 8. Regression verification (LAB)

Chromium 1194 via Playwright, against the pre-change and post-change builds
served identically. **32 functional assertions plus 6 viewport widths, all
identical before and after.**

| Area | Result |
| --- | --- |
| Widths 320 / 375 / 430 / 768 / 1024 / 1440 | No horizontal overflow at any width, before or after (`scrollWidth == clientWidth` throughout) |
| Desktop navigation | 8 anchors, 0 broken (every `href="#id"` resolves) |
| Mobile hamburger | Opens on tap, `aria-expanded` flips, closes after link tap |
| Login | Both links → `https://siraj-lms.vercel.app/login` |
| Free-trial CTA | All 4 `.wa-link` elements rewritten to `https://wa.me/201004751455?text=…` |
| Pricing | 4 cards; 1 student/monthly `$35.90`; 4 students `$28.90`; +annual `$28.90` (bigger discount wins, not stacked); resets to `$35.90` |
| Program tabs | 4 tabs; switching activates the target roadmap and deactivates the previous |
| FAQ | 5 `<details>`; closed items open on click |
| Video | `loading="lazy"`, `title` present, src unchanged |
| Images | 3 `<img>`, all loaded, **0 missing alt** |
| Keyboard | 43 focusable elements; visible gold focus ring (`solid 2px rgb(201,162,76)`); tabs reachable and activate on Enter |
| Floating WhatsApp button | Appears past 260 px scroll |
| JavaScript errors | **0 page errors** before and after |

The only console errors in either run were `ERR_TUNNEL_CONNECTION_FAILED` /
`ERR_CONNECTION_RESET` for gtag, Google Fonts and YouTube — the sandbox's egress
policy, not site defects. They are identical in both runs.

### CTO correction pass — re-verification (LAB)

Re-run after the correction pass, comparing the previous PR head
(`5ba4afe`) against the corrected tree, served identically.

The only `index.html` difference is the two intended changes: the JSON-LD
`alternateName` array and the contact email. Everything else is byte-identical.

| Area | Result |
| --- | --- |
| 31 functional assertions | **0 changed** — all identical to the previous head |
| 8 mobile assertions | **0 changed** |
| Widths 320 / 375 / 430 / 768 / 1024 / 1440 | no horizontal overflow at any width, both trees |
| JavaScript page errors | **0** in both trees |
| JSON-LD as parsed by the browser | `name` = `Siraj Institute`; `alternateName` = `['Siraj-Institute', 'Siraj Institute Online', 'sirajinst.com']`; `url` = `https://sirajinst.com/` |
| Rendered `mailto:` | `mailto:sirajjinstitute@gmail.com` (corrected) |
| Login / WhatsApp / video / pricing / tabs / FAQ | unchanged |
| Secret scanner after the workflow pin | real repo clean (16 files, 0 findings); 9/9 synthetic caught; values not printed |

### Visual proof

Screenshots are not byte-reproducible by default, because the hero generates 22
randomly-positioned motes per load. Two independent comparisons were run.

**1. Deterministic render.** The motes are skipped under
`prefers-reduced-motion: reduce`, which makes the page render deterministically.
Diffed under that emulation, before and after are **pixel-identical**:

| Width | Differing pixels | Max channel delta |
| --- | --- | --- |
| 375 px | **0 / 337,500 (0.0000%)** | **0** |
| 1440 px | **0 / 1,296,000 (0.0000%)** | **0** |

**2. Motion enabled, against a measured noise floor.** With motes active, a
noise floor was established by diffing the **same** build across two runs:

| Comparison | @1440 | @375 |
| --- | --- | --- |
| baseline vs baseline (noise floor) | 0.008% | 0.031% |
| before vs after (this PR) | 0.008% | 0.033% |

The residual delta equals the same-build noise floor at an identical maximum
channel delta, confirming it is the random motes rather than the change.

---

## 9. Post-deployment verification checklist

### Preview deployment

Vercel built a preview automatically from the Wave 1A pull request (project
`sirajinstitute`), status **Ready**:

```
https://sirajinstitute-git-claude-4acd32-sirajjinstitute-5235s-projects.vercel.app
```

No production deployment was created.

That the build reached **Ready** confirms Vercel parsed and accepted
`vercel.json` — an invalid config fails the build. It does **not** confirm the
headers on the wire: the preview hostname is denied by the same egress policy
as production.

```
sirajinstitute-git-claude-4acd32-…vercel.app:443
  -> gateway answered 403 to CONNECT (policy denial)
```

⚠️ A curl to a blocked host returns the **proxy's own** 403 error page, which
itself carries `X-Content-Type-Options: nosniff`. That header comes from the
proxy, not from the site, and must not be read as evidence that the site's
headers are live.

### Checks to run

None of these could be performed from this session. Run them against the
**preview** deployment above, and again after any eventual production deploy.

```sh
# Headers actually delivered
 curl -sSI https://sirajinstitute-git-claude-4acd32-sirajjinstitute-5235s-projects.vercel.app/ | grep -iE \
  'content-security-policy|x-content-type|referrer-policy|permissions-policy|strict-transport'

# Is Vercel already sending HSTS? If absent, add it to vercel.json.
curl -sSI https://www.sirajinst.com/ | grep -i strict-transport-security

# Confirm the (already correct, owner-verified) routing is unchanged:
# expect apex -> 308 -> www, and www serving 200.
curl -sSI    https://sirajinst.com/     | grep -iE '^HTTP|^location:'
curl -sSI -L https://www.sirajinst.com/ -o /dev/null -w 'www -> %{url_effective} %{http_code}\n'

# After deployment, confirm the canonical served is www:
curl -sS https://www.sirajinst.com/ | grep -i 'rel="canonical"'
```

Then confirm in a real browser that the YouTube embed still plays (the one
functional risk of `Permissions-Policy`), the mobile menu works, and pricing
controls recalculate.

---

## 10. Privacy / third parties — discovery only

No policy wording was written, and none should be inferred from this section.

**Observed (REPO/LAB):**

- **Google Analytics 4** (`G-667Q0LLEH2`) loads on every page view and sets
  first-party cookies via `gtag.js`. No consent mechanism of any kind exists.
- **Google Fonts** — `fonts.googleapis.com` / `fonts.gstatic.com` receive the
  visitor's IP and user-agent on every load.
- **YouTube** — a standard `youtube.com/embed/` iframe, not the
  `youtube-nocookie.com` privacy-enhanced variant. It is `loading="lazy"`, so
  it loads when scrolled near, not necessarily on every visit.
- The site's **own** code sets no cookies and uses no `localStorage` /
  `sessionStorage`.
- **No forms exist.** Every conversion path is an outbound link to WhatsApp,
  so the landing page itself collects no data directly; personal data is entered
  in WhatsApp, and the prefilled message text is visible in the URL.
- **No privacy policy, terms, refund, or cancellation link exists anywhere on
  the page.** The footer has Contact / Follow / Explore columns only.

**Unresolved questions for the owner (legal input required — deliberately not answered here):**

1. The service is marketed to children, and analytics runs with no consent
   gate. Which markets are targeted, and what consent obligations follow?
2. Is a Privacy Policy needed before further marketing? Its wording must come
   from the owner or counsel.
3. Should the YouTube embed move to `youtube-nocookie.com`? Low-risk and
   privacy-improving, but it is a live-behaviour change and was not made here.
4. What is retained from WhatsApp conversations, and by whom?
5. The FAQ and pricing sections both reference a "Family Guide" containing
   rescheduling and cancellation rights. That document is not published — should
   its terms be surfaced on the site?

---

## 11. Findings register

Severity: **P0** indexing blocker / severe search problem · **P1** material,
fix before broader SEO work · **P2** important improvement · **P3** optional.

| ID | Sev | Finding | Evidence | Status |
| --- | --- | --- | --- | --- |
| F-01 | P1 | Repository canonical signals named the apex, which 308-redirects to `www` — so `rel=canonical` pointed at a URL Production does not serve. Final canonical is `https://www.sirajinst.com/` | §4 | **CODE FIXED IN PR — requires Production deployment & live verification to close.** No Vercel routing change needed |
| F-02 | P1 | `WebSite.alternateName` did not express the owner's search-identity preference order (missing `Siraj-Institute`; domain not ranked last) | `index.html:59` before | **Fixed** — ordered 3-value array per §5 |
| F-03 | P1 | No CSP, no `X-Content-Type-Options`, no `Referrer-Policy`, no `Permissions-Policy` configured by the repo (no `vercel.json` existed) | repo had no config file | **Fixed** (safe subset; strict CSP deferred) |
| F-04 | P1 | No secret scanning or CI of any kind | no `.github/` directory | **Fixed** |
| F-05 | P1 | 42.7 KiB logo inlined 4× = 80.2% of the document; one occurrence a no-op preload | §7 | **Partly fixed** — preload removed; 3× duplication → Wave 1B |
| F-06 | P2 | LCP 3.2 s exceeds the 2.5 s target, measured *without* third parties loading | Lighthouse | **Deferred** → Wave 1B |
| F-07 | P2 | Contrast 3.32:1 for `#a9812f` on `#faf6ec` (`.eyebrow`, `.dur`, `.meta`); WCAG AA needs 4.5:1 | Lighthouse `color-contrast` | **Deferred** — brand colour, needs owner approval. `#8f6c26` → 4.48:1, `#8a6a1f` → 4.68:1 |
| F-08 | P2 | No `<main>` landmark; heading order skips levels (h2→h4, h2→h5) in About, Programs, Pricing, Next Steps, Footer | Lighthouse `landmark-one-main`, `heading-order` | **Deferred** — structural, → Accessibility wave |
| F-09 | P2 | Footer contact email was misspelled `sirjjinstitute@gmail.com` (missing the first `a`), so mail to the published address was silently lost | `index.html:882` | **FIXED — owner-confirmed official email** `sirajjinstitute@gmail.com` |
| F-10 | P2 | GitHub repo `homepage` is `https://sirajinstitute.vercel.app`, a third hostname inconsistent with the chosen canonical | GitHub API | **Deferred** — set to `https://sirajinst.com/` with F-01 |
| F-11 | P3 | Program/pricing tabs use `role="tablist"`/`role="tab"` but have no `aria-controls`, no `role="tabpanel"`, and no arrow-key navigation. Buttons are real `<button>`s so they remain focusable and Enter-activatable | LAB: `tabArrowKeyMoves` = false | **Deferred** → Accessibility wave |
| F-12 | P3 | Pricing tab advertises "20% off" but the rendered line shows "Save 19%" (28.90/35.90 = 19.5%, rounded down) | LAB: `billedLineSample` | **Deferred** — pricing is frozen (§17); reported only |
| F-13 | P3 | `favicon.png` is a byte-identical duplicate of `android-chrome-512x512.png` (297,819 B each) | SHA-256 match | **Deferred** → Wave 1B |
| F-14 | P3 | `og:image` is the 512×512 square logo; social platforms expect 1200×630 | `index.html:15-17` | **Deferred** → Wave 4 social preview |
| F-15 | P3 | YouTube embed uses `youtube.com` rather than `youtube-nocookie.com` | `index.html:589` | **Deferred** — see §10 Q3 |
| F-16 | P3 | `.wa-link` elements ship as `href="#"` and are rewritten by JS; without JS they jump to the top of the page instead of contacting anyone | `index.html:549` etc. | **Deferred** — low impact, progressive-enhancement fix |

**Not findings** (checked and healthy): 1 `<h1>`, `lang="en"`, indexable
(`robots.txt` allows all, no `noindex`), valid sitemap, both JSON-LD blocks
valid, 0 broken internal anchors, 0 images missing `alt`, CLS 0, no horizontal
overflow at any tested width, visible focus ring, all `target="_blank"` links
carry `rel="noopener noreferrer"`, and `favicon.ico` includes a 48×48 entry.

---

## 12. Deferred work

**Wave 1B — Performance Architecture:** §7 items 1–7 (F-05 remainder, F-06, F-13).

**Accessibility wave:** contrast tokens (F-07), `<main>` landmark and heading
order (F-08), full ARIA tab pattern (F-11).

**Conversion / design wave:** hero, CTA strategy, section order, trust layer.
Untouched here by design.

**Wave 4 — Growth:** program SEO pages, 1200×630 social image (F-14), analytics
funnel.

**Product proof:** LMS showcase, tutor profiles, progress-tracking proof,
testimonials — all gated on real LMS functionality.

**Wave 5:** Student View video to replace the current embed.

**Legal / privacy:** every question in §10. Requires owner or counsel input.

---

## 13. Explicitly out of scope for Wave 1A

No marketing redesign. No hero rewrite. No pricing redesign or logic change. No
LMS modification. No LMS showcase. No Student View video. No replacement of the
current video. No production deployment. No invented legal policy. No large
performance refactor. No program SEO pages. No visible brand rename.

---

## 14. Repository-wide domain occurrence audit

Run after the final canonical correction. Canonical public URL:
**`https://www.sirajinst.com/`**.

### Active canonical / public-identity signals — all www, all correct

| Location | Value | Class |
| --- | --- | --- |
| `index.html` `rel=canonical` | `https://www.sirajinst.com/` | canonical/public identity |
| `index.html` `og:url` | `https://www.sirajinst.com/` | canonical/public identity |
| `index.html` `og:image` | `https://www.sirajinst.com/logo.png` | canonical/public identity (asset) |
| `index.html` `twitter:image` | `https://www.sirajinst.com/logo.png` | canonical/public identity (asset) |
| `index.html` Organization `url` | `https://www.sirajinst.com/` | canonical/public identity |
| `index.html` Organization `logo` | `https://www.sirajinst.com/logo.png` | canonical/public identity (asset) |
| `index.html` Organization `image` | `https://www.sirajinst.com/logo.png` | canonical/public identity (asset) |
| `index.html` WebSite `url` | `https://www.sirajinst.com/` | canonical/public identity |
| `index.html` WebSite publisher `logo` | `https://www.sirajinst.com/logo.png` | canonical/public identity (asset) |
| `robots.txt` `Sitemap:` | `https://www.sirajinst.com/sitemap.xml` | canonical/public identity |
| `sitemap.xml` `<loc>` | `https://www.sirajinst.com/` | canonical/public identity |

**Zero active non-www canonical URLs remain.** Verified by
`grep "https://sirajinst\.com" index.html robots.txt sitemap.xml` returning nothing.

### Remaining non-www `sirajinst.com` occurrences — all explained

| Location | Occurrence | Class | Why it stays |
| --- | --- | --- | --- |
| `index.html` `WebSite.alternateName[2]` | bare string `"sirajinst.com"` | **intentionally non-canonical** | A site-**name** candidate, not a URL. It is the last-resort name Google may display and has no relationship to `WebSite.url`. Approved in §5. |
| `docs/…BASELINE.md` §1 | egress-denial log, DNS records | historical documentation | Records what this session could not reach |
| `docs/…BASELINE.md` §4 | the `apex → 308 → www` routing description and the before/after table | documentation of Production routing and of this fix | Describes the redirect source and the prior values |
| `docs/…BASELINE.md` §5 | discussion of the `alternateName` fallback | documentation | Explains the name/URL distinction |
| `docs/…BASELINE.md` §9 | verification `curl` for the apex redirect | verification command | Confirms routing is unchanged |
| `docs/…BASELINE.md` §11 | F-01 row | historical documentation | Describes the defect that was fixed |

Nothing unexpected. Every non-www occurrence is either the deliberate
site-name fallback or prose.

### Unrelated domains — deliberately untouched

`siraj-lms.vercel.app` (Login), `wa.me` (WhatsApp), `youtube.com`,
`facebook.com`, `instagram.com`, `fonts.googleapis.com`, `fonts.gstatic.com`,
`googletagmanager.com`, `schema.org`, and the Vercel preview hostname were all
classified as out-of-scope external services and **not modified**.
