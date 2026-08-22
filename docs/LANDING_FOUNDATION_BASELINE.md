# Siraj Institute Landing Page — Technical Baseline

**Waves recorded:** 1A — Foundation, Security, Technical SEO & Search Identity
· 1B — Performance Architecture & Technical Cleanup
**Audit dates:** 1A 2026-08-16 · 1B 2026-08-21
**Wave 1A base commit:** `8161890e7d88fecb8f87adc1838f20376a735d7d`
**Wave 1A merge commit (now in Production):** `5f40bf315d48ca7bfc286b570aa9fce4b9164a27`
**Wave 1B base commit (`origin/main`):** `5f40bf315d48ca7bfc286b570aa9fce4b9164a27`
**Wave 1B branch:** `claude/siraj-landing-wave-1b-performance-u7noq3`

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
| F-01 | P1 | Repository canonical signals named the apex, which 308-redirects to `www` — so `rel=canonical` pointed at a URL Production does not serve. Final canonical is `https://www.sirajinst.com/` | §4, §15.1 | **CLOSED.** Wave 1A is live in Production at `5f40bf3`; apex → 308 → www, and canonical/OG/robots/sitemap all serve www. Owner-verified — see §15.1 |
| F-02 | P1 | `WebSite.alternateName` did not express the owner's search-identity preference order (missing `Siraj-Institute`; domain not ranked last) | `index.html:59` before | **Fixed** — ordered 3-value array per §5 |
| F-03 | P1 | No CSP, no `X-Content-Type-Options`, no `Referrer-Policy`, no `Permissions-Policy` configured by the repo (no `vercel.json` existed) | repo had no config file | **Fixed** (safe subset; strict CSP deferred) |
| F-04 | P1 | No secret scanning or CI of any kind | no `.github/` directory | **Fixed** |
| F-05 | P1 | 42.7 KiB logo inlined 4× = 80.2% of the document; one occurrence a no-op preload | §7, §15.3 | **CLOSED in Wave 1B.** All three remaining data URIs replaced by right-sized local WebP variants; `index.html` now contains **zero** `data:image` payloads |
| F-06 | P2 | LCP 3.2 s exceeds the 2.5 s target, measured *without* third parties loading | Lighthouse, §15.7 | **CLOSED under the controlled baseline** — LCP 2.93 s → **2.10 s** (target ≤ 2.5 s). Not yet confirmed with third parties reachable; see §15.9 |
| F-07 | P2 | Contrast 3.32:1 for `#a9812f` on `#faf6ec` (`.eyebrow`, `.dur`, `.meta`); WCAG AA needs 4.5:1 | Lighthouse `color-contrast` | **Deferred** — brand colour, needs owner approval. `#8f6c26` → 4.48:1, `#8a6a1f` → 4.68:1 |
| F-08 | P2 | No `<main>` landmark; heading order skips levels (h2→h4, h2→h5) in About, Programs, Pricing, Next Steps, Footer | Lighthouse `landmark-one-main`, `heading-order` | **Deferred** — structural, → Accessibility wave |
| F-09 | P2 | Footer contact email was misspelled `sirjjinstitute@gmail.com` (missing the first `a`), so mail to the published address was silently lost | `index.html:882` | **FIXED — owner-confirmed official email** `sirajjinstitute@gmail.com` |
| F-10 | P2 | GitHub repo `homepage` is `https://sirajinstitute.vercel.app`, a third hostname inconsistent with the chosen canonical | GitHub API | **Deferred** — set to `https://sirajinst.com/` with F-01 |
| F-11 | P3 | Program/pricing tabs use `role="tablist"`/`role="tab"` but have no `aria-controls`, no `role="tabpanel"`, and no arrow-key navigation. Buttons are real `<button>`s so they remain focusable and Enter-activatable | LAB: `tabArrowKeyMoves` = false | **Deferred** → Accessibility wave |
| F-12 | P3 | Pricing tab advertises "20% off" but the rendered line shows "Save 19%" (28.90/35.90 = 19.5%, rounded down) | LAB: `billedLineSample` | **Deferred** — pricing is frozen (§17); reported only |
| F-13 | P3 | `favicon.png` is a byte-identical duplicate of `android-chrome-512x512.png` (297,819 B each) | SHA-256 match | **CLOSED in Wave 1B** — duplicate re-confirmed byte-identical, the single reference repointed at `android-chrome-512x512.png`, and `favicon.png` deleted (−290.8 KiB) |
| F-14 | P3 | `og:image` is the 512×512 square logo; social platforms expect 1200×630 | `index.html:15-17` | **Deferred** → Wave 4 social preview |
| F-15 | P3 | YouTube embed used `youtube.com` rather than `youtube-nocookie.com` | `index.html`, §15.5 | **CLOSED in Wave 1B.** Owner supplied the verified poster for `Ng5P2SusEsQ`; the page now loads only a local poster before interaction and creates a `youtube-nocookie.com` iframe after an explicit click |
| F-16 | P3 | `.wa-link` elements ship as `href="#"` and are rewritten by JS; without JS they jump to the top of the page instead of contacting anyone | `index.html`, §15.4 | **CLOSED in Wave 1B** — all four ship the real `wa.me` deep link in the HTML; the script now only re-asserts the identical value |

**Not findings** (checked and healthy): 1 `<h1>`, `lang="en"`, indexable
(`robots.txt` allows all, no `noindex`), valid sitemap, both JSON-LD blocks
valid, 0 broken internal anchors, 0 images missing `alt`, CLS 0, no horizontal
overflow at any tested width, visible focus ring, all `target="_blank"` links
carry `rel="noopener noreferrer"`, and `favicon.ico` includes a 48×48 entry.

---

## 12. Deferred work

**Wave 1B — Performance Architecture:** **delivered** (§15). F-05, F-06,
F-13, F-15 and F-16 are closed. The owner supplied the verified YouTube poster,
and the "no YouTube request before interaction" requirement is now met.

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

---

## 15. Wave 1B — Performance Architecture & Technical Cleanup

**Base commit:** `5f40bf315d48ca7bfc286b570aa9fce4b9164a27` (verified at session start:
`git ls-remote origin refs/heads/main` returned exactly this SHA).
**Branch:** `claude/siraj-landing-wave-1b-performance-u7noq3`
**Date:** 2026-08-21

Evidence classes are unchanged from §1: **REPO**, **LAB**, **UNVERIFIED**, plus
**OWNER** for facts established by the owner/CTO outside this session.

### 15.1 Wave 1A outcome (OWNER)

Recorded on the owner's authority; this session could not reach Production
(§15.9) and did not observe any of it directly.

| Item | State |
| --- | --- |
| Wave 1A Production merge SHA | `5f40bf315d48ca7bfc286b570aa9fce4b9164a27` |
| Wave 1A Production deployment | Verified live and successful |
| F-01 (canonical/domain) | **Closed** — apex 308-redirects to www; canonical, OG, robots and sitemap all serve www |
| Security headers | **Verified delivered on the wire** |
| YouTube playback under `Permissions-Policy` | **Owner-verified working** — the one functional risk flagged in §9 is retired |

The §9 post-deployment checklist is therefore satisfied for Wave 1A. It still
applies to Wave 1B, which has not been deployed anywhere but a Vercel Preview.

### 15.2 AS-IS baseline re-confirmed before any write (REPO)

Every figure the Wave 1B brief specified was re-measured and matched:

| Property | Expected | Measured | |
| --- | --- | --- | --- |
| `index.html` size | ~232,461 B | **232,461 B** | ✅ exact |
| `index.html` lines | ~1064 | 1064 (`wc -l` 1063 + no trailing newline) | ✅ |
| Inline logo occurrences | 3, byte-identical | **3**, all SHA-256 `b40b6799…`, 43,735 B each | ✅ exact |
| Combined logo Base64 | ~175,014 chars | **175,014 chars** (174,948 payload + 3×22 prefix) | ✅ exact |
| Inline CSS block | ~20,968 chars | **20,968 chars** | ✅ exact |
| Executable inline JS | ~6,383 chars | **6,383 chars** (172 + 6,211), excluding JSON-LD | ✅ exact |
| YouTube iframe | `youtube.com/embed/Ng5P2SusEsQ`, lazy | present, `loading="lazy"` | ✅ |
| `favicon.png` vs `android-chrome-512x512.png` | byte-identical | SHA-256 `29e2565b…` both, `cmp` clean | ✅ |

The source artwork is a **640×640 palette PNG with 170 palette entries but only
128 distinct colours in use**. That matters for §15.3.

### 15.3 Logo externalisation (F-05)

The three data URIs were confirmed identical, decoded once, and resampled with
Lanczos. No recolour, no crop, no sharpening, no regeneration — only a scale
change, then re-quantisation to a 256-colour palette (the source's own colour
depth, so quantisation costs essentially nothing).

**Format choice — measured, not assumed.** At the hero's 2× size (236 px):

| Encoding | Bytes | PSNR vs ideal Lanczos RGBA |
| --- | --- | --- |
| RGBA PNG, optimised | 52,197 | (reference) |
| RGBA lossless WebP | 36,730 | (reference) |
| Lossy WebP q90 | 24,888 | 42.54 dB |
| 256-colour PNG | 10,438 | 41.79 dB |
| **256-colour lossless WebP** | **9,266** | **41.79 dB** |

The last row wins on both axes: it is lossless *with respect to the quantised
image*, so it carries the same fidelity as the palette PNG for ~12% fewer bytes,
and it beats lossy WebP on size **and** on error. Chosen for all nine variants.

PSNR was measured on the alpha-composited result over the actual `#0d1b30`
backdrop. Measuring raw RGBA is misleading here, because lossy encoders discard
colour in fully transparent pixels and score ~11 dB for differences no one can
see.

**Ladder shipped** (density descriptors; CSS fixes the display size, so `1x/2x/3x`
is the correct selector, not `sizes`):

| Element | CSS px | 1× | 2× | 3× |
| --- | --- | --- | --- | --- |
| nav `.brand img` | 42 | `logo-42.webp` 1,704 B | `logo-84.webp` 3,386 B | `logo-126.webp` 4,944 B |
| hero `.hero-logo` | 118 | `logo-118.webp` 4,596 B | `logo-236.webp` 9,266 B | `logo-354.webp` 16,394 B |
| footer `.footer-brand img` | 56 | `logo-56.webp` 2,290 B | `logo-112.webp` 4,374 B | `logo-168.webp` 6,590 B |

A device downloads exactly **one file per element**: 8,590 B at 1×, **17,026 B at
2×**, 27,928 B at 3× — against 131,205 B of decoded image (175,014 Base64 chars)
before, on *every* visit, uncacheable.

Verified in LAB at deviceScaleFactor 1, 2 and 3: the correct variant is selected
at each density, all three render at exactly 42/118/56 CSS px, hero keeps
`fetchpriority="high"`, and the footer logo is still deferred — it is fetched
only after scrolling, confirming `loading="lazy"` survives.

`width`/`height` attributes are retained and updated 640×640 → the true intrinsic
size of each variant. Both are square, so the 1:1 aspect ratio the browser
reserves is unchanged and **CLS stays 0**.

**WebP without a PNG fallback** is deliberate: the stylesheet already depends on
CSS custom properties (96 uses) and `backdrop-filter`, so every browser that can
render this page at all has supported WebP since 2020.

### 15.4 CSS / JS extraction

| File | Bytes | Contents |
| --- | --- | --- |
| `assets/styles.css` | 21,715 | the former inline `<style>`, verbatim, + 5 utility classes |
| `assets/app.js` | 6,443 | the former end-of-body script, **byte-identical** (`diff` clean) + a header comment |
| `assets/analytics.js` | 428 | the GA4 bootstrap, verbatim |

- `app.js` loads with `defer` from `<head>`. It previously ran at the end of
  `<body>`; both run against a fully-parsed DOM, so ordering is unchanged, and
  `defer` lets the download start earlier.
- `analytics.js` stays **synchronous and in the same position**, immediately
  after the `async` gtag loader, so `gtag()` is defined exactly as before. GA4
  behaviour is deliberately not "improved" here.
- Both JSON-LD blocks remain inline as `application/ld+json` and still parse
  (`@type` `EducationalOrganization` and `WebSite`).
- **The 12 inline `style=""` attributes were also removed**, into 5 utility
  classes. They are not executable, but they would each violate a `style-src`
  policy without `'unsafe-inline'`, which §15.6 is meant to make unnecessary.

**One defect was introduced and caught here.** `.h-on-dark` (specificity 0,1,0)
lost to the existing `.section-head h2` (0,1,1), so two headings on dark
backgrounds turned dark-on-dark — a contrast failure the inline `style`
attribute had been winning at specificity 1000. Caught by full-page pixel
diffing, not by the functional suite. Fixed by promoting the selector to
`h2.h-on-dark` (0,1,1, and later in source order). Computed-style parity across
all 12 converted elements is now exact.

**WhatsApp links (F-16).** All four `.wa-link` elements now carry the real deep
link in the HTML, so they work with JavaScript disabled. The script still
assigns the same URL; that assignment is now a no-op, kept so the link text has
one source of truth.

### 15.5 YouTube façade — DELIVERED

The owner supplied a poster verified to belong to video `Ng5P2SusEsQ`
(SHA-256 `40df876a…`, 1536×1152 JPEG). It is stored locally as
`assets/video-poster-Ng5P2SusEsQ.jpg`.

The initial HTML now contains an accessible button, local poster and play icon;
there is no YouTube iframe, thumbnail URL, preconnect or other YouTube request.
Only after explicit activation does `assets/app.js` create an iframe at
`https://www.youtube-nocookie.com/embed/Ng5P2SusEsQ?autoplay=1&rel=0`.
Autoplay therefore begins only after user interaction. The existing title,
fullscreen and media permissions are preserved. The fixed 16:9 container and
intrinsic poster dimensions preserve layout stability.

**Acceptance:** static resource inspection confirms zero YouTube origins in the
initial loading path and exactly one post-click `youtube-nocookie.com` embed.
Live Preview playback and request capture remain the final wire verification.

### 15.6 CSP — Report-Only candidate

The enforced policy is **unchanged** from Wave 1A and still enforced:

```
base-uri 'none'; object-src 'none'; frame-ancestors 'self'
```

Added alongside it, as `Content-Security-Policy-Report-Only`:

```
default-src 'self';
base-uri 'none';
object-src 'none';
frame-ancestors 'self';
form-action 'none';
script-src 'self' https://www.googletagmanager.com;
style-src  'self' https://fonts.googleapis.com;
font-src   'self' https://fonts.gstatic.com;
img-src    'self' https://www.googletagmanager.com https://*.google-analytics.com;
connect-src 'self' https://www.googletagmanager.com https://*.google-analytics.com https://*.analytics.google.com;
frame-src  https://www.youtube.com https://www.youtube-nocookie.com
```

No `'unsafe-inline'`. No `'unsafe-eval'`. Every directive traces to a resource
the document actually loads, and each restriction was checked against the tree:
0 `<form>`, 0 `<object>`/`<embed>`/`<applet>`, 0 `<base>`, 0 `<video>`/`<audio>`,
0 workers, 0 `eval`, 0 inline event handlers, 0 `javascript:` URLs.

`frame-src` lists **both** YouTube hosts: `www.youtube.com` is what the page
loads today (§15.5), and `youtube-nocookie.com` is pre-authorised so the façade
can land without a second CSP change.

**Violations observed (LAB): 0.** Served with the real header and exercised —
load, scroll, pricing controls, duration controls, program tabs:

| Check | Result |
| --- | --- |
| Total `securitypolicyviolation` events | **0** |
| Both JSON-LD blocks under `script-src` without `'unsafe-inline'` | no violation — data blocks are not executed |
| 22 motes written via `element.style.*` under `style-src` | no violation — CSSOM writes are not subject to `style-src`; all 22 rendered |
| Pricing grid via `innerHTML` | 4 cards rendered, no violation |
| Stylesheet applied | `body` background `rgb(250,246,236)` ✅ |

**Third-party directives — what is and isn't proven.** `script-src`
(googletagmanager), `style-src` (fonts.googleapis.com) and `frame-src`
(www.youtube.com) are **confirmed permitted**: under the Report-Only header the
browser *attempted* all three requests and they failed only at the network
layer (`ERR_TUNNEL_CONNECTION_FAILED` / `ERR_CONNECTION_RESET`), which cannot
happen for a CSP-blocked request — CSP blocks before the socket. Still
**UNVERIFIED**, because the upstream resources never loaded here:

- `font-src https://fonts.gstatic.com` — the Google Fonts CSS never loaded, so
  no font file was ever requested.
- `img-src` / `connect-src` for GA4 — `gtag.js` never loaded, so no beacon fired.
  The `*.google-analytics.com` / `*.analytics.google.com` wildcards come from
  Google's documented GA4 endpoints, not from observation.

**Do not enforce this policy on these results.** Report-Only exists precisely to
collect the two unproven groups above from a Preview with third parties
reachable. Enforce only after a Preview run shows zero reports.

### 15.7 Performance (LAB)

Lighthouse **13.4.1**, Chromium **1194**, mobile form factor, simulated
throttling, local static server — the **same methodology and versions as Wave
1A**, re-run against both trees in this session. Third parties are blocked in
both runs, so these exclude Google Fonts, gtag and YouTube. That the BEFORE run
reproduced Wave 1A's published numbers exactly (81 / 2.6 s / 2.9 s / 279 KiB)
is the control that makes the comparison trustworthy.

Median of 3 runs each; spread was ≤2 ms on every metric.

| Metric | Wave 1A (before) | Wave 1B (after) | Target | |
| --- | --- | --- | --- | --- |
| Performance | 81 | **89** | — | ▲ +8 |
| Accessibility | 93 | 93 | no regression | ✅ |
| Best practices | 96 | 96 | no regression | ✅ |
| SEO | 100 | 100 | no regression | ✅ |
| First Contentful Paint | 2,582 ms | **1,531 ms** | — | ▲ −41% |
| **Largest Contentful Paint** | 2,930 ms | **2,102 ms** | ≤ 2,500 ms | ✅ **met** |
| Total Blocking Time | 0 ms | **0 ms** | 0 / no regression | ✅ |
| Cumulative Layout Shift | 0 | **0** | ≤ 0.1 | ✅ |
| Total transfer | 279.9 KiB | **124.9 KiB** | lower than 1A | ✅ −55% |
| `index.html` raw | 232,461 B (227.0 KiB) | **30,954 B (30.2 KiB)** | ≤ 70 KiB | ✅ |
| `index.html` gzip -9 | 147.3 KiB | **9,455 B (9.2 KiB)** | ≤ 20 KiB | ✅ |
| Base64 logo payloads | 3 (175,014 chars) | **0** | 0 | ✅ |
| YouTube request before interaction | 1 | **0** | 0 | ✅ **met** — §15.5 |

Asset totals: HTML −201,507 B; CSS 0 → 21,715 B external; JS 6,383 chars inline
→ 6,871 B external (`app.js` 6,443 + `analytics.js` 428); images 0 → 250,808 B on
disk including the verified local video poster; each logo still fetches only its selected responsive variant (17,026 B total at 2×);
`favicon.png` −297,819 B.

Deployable payload (every file Vercel serves, excluding `.github/` and `docs/`):
**1,239,416 B → 822,158 B (−417,258 B, −33.7%)** across 14 → 24 files. The file
count rises because one uncacheable inline copy became nine cacheable variants;
the bytes fall because the 640×640 source is no longer shipped three times per
page view.

### 15.8 Regression verification (LAB)

Chromium 1194 via Playwright, base tree vs Wave 1B tree served identically.
**52 assertions: 44 byte-identical, 8 differing — all 8 intended.**

The 8: `rawDataImage` 3→0, `rawInlineStyleBlocks` 1→0, `rawInlineStyleAttrs`
12→0, `rawExecInlineScripts` 2→0, `waHrefRawHTML` `["#"×4]`→4 real `wa.me`
links, `waHrefRawAllValid` false→true, and `imgRendered`/`imgBroken` reflecting
right-sized files (the footer entry reports "incomplete" only because
`loading="lazy"` has correctly not fetched it yet — proven loaded after scroll
at all three densities).

Identical across both trees: pricing ($35.90 / $28.90 / annual $28.90 /
reset $35.90, and the billed line), program tabs, FAQ, mobile menu open/close/
`aria-expanded`, Login targets, floating WhatsApp reveal at 260 px, dynamic
year, motes (22, and **0** under `prefers-reduced-motion`), 43 focusable
elements, the gold focus ring, canonical/OG/title, both JSON-LD `@type`s,
`lang`, `<h1>` count, 0 images missing `alt`, and **0 page errors** in both.
The only console errors are the egress-policy failures for gtag / Fonts /
YouTube, identical in both runs.

**Responsive / visual — full-page pixel diff at 320 / 375 / 430 / 768 / 1024 / 1440:**

| Width | Horizontal overflow | Full-page height Δ | Differing pixels |
| --- | --- | --- | --- |
| 320 | none | **0 px** | 693 (0.015%) |
| 375 | none | **0 px** | 687 (0.014%) |
| 430 | none | **0 px** | 684 (0.014%) |
| 768 | none | **0 px** | 680 (0.010%) |
| 1024 | none | **0 px** | 679 (0.008%) |
| 1440 | none | **0 px** | 682 (0.006%) |

Identical page height at every width, and the differing pixels fall in exactly
three bands per width — the three logos. Nothing else on the page differs by a
single pixel. At 4× magnification the before/after logos are indistinguishable.

### 15.9 Limitations — what this session could not test (UNVERIFIED)

The egress policy denies the same hosts as in Wave 1A, plus the YouTube hosts:

```
www.sirajinst.com:443   -> 403 to CONNECT (policy denial)
i.ytimg.com:443         -> 403 to CONNECT (policy denial)
img.youtube.com:443     -> 403 to CONNECT (policy denial)
www.youtube.com:443     -> 403 to CONNECT (policy denial)
```

`fonts.googleapis.com`, `fonts.gstatic.com` and `pypi.org` **are** reachable,
which is what made §15.10's font measurements possible.

Not established here, and to be checked on the Vercel Preview:

1. Lighthouse **with third parties reachable**. §15.7 is a controlled floor, not
   a field number.
2. `font-src` and the GA4 `img-src`/`connect-src` groups in the Report-Only CSP
   (§15.6).
3. That the Report-Only header is delivered by Vercel and reports nothing.
4. Preview asset delivery: all nine WebP variants, `styles.css`, `app.js`,
   `analytics.js` returning 200 with the `/assets/` cache header.
5. YouTube playback (unchanged code, but it is the one third party in the page).
6. That `favicon.png`'s removal broke no cached client reference.

### 15.10 Fonts — evidence, and the decision not to self-host

**Removed: Work Sans 800.** The stylesheet's complete weight usage is
300 ×1, 400 ×3, 500 ×1, 600 ×8, 700 ×13 — **no rule uses 800**, so the face was
requested and never applied. Measured effect on the render-blocking Google
Fonts stylesheet: **12,568 B → 11,320 B (−1,248 B), 27 → 24 `@font-face`
declarations.** Stated precisely: because no rule used weight 800, the browser
would not have downloaded its 50,316 B `latin` file either — the *guaranteed*
saving is the 1,248 B of blocking CSS plus three fewer declarations to parse,
not 50 KiB. Amiri's `ital 400` is **kept**: `em` inside Amiri headings is real
italic usage.

**Self-hosting was evaluated and rejected.** Measured from the live Google
Fonts CSS (modern-Chrome UA), per-face WOFF2 sizes:

| Set | Faces | Bytes |
| --- | --- | --- |
| Everything the CSS declares | 24 | 900,468 B (879.4 KiB) |
| What an en+ar visit actually needs (`latin` for both families, `arabic` for Amiri) | 11 | 631,052 B (616.3 KiB) |
| Work Sans `latin`, per weight ×5 | 5 | 251,580 B |
| Amiri `arabic`, per face | 3 | 99,968–111,720 B each |

Rejected on three grounds, in the brief's own terms:

1. **The benefit cannot be evidenced from here.** The win is one saved
   third-party connection — but in this lab Google Fonts is *blocked entirely*,
   so a self-hosted build would load fonts the Google build cannot, and the
   comparison would flatter self-hosting for a reason that has nothing to do
   with the critical path. The brief forbids claiming a font improvement
   without before/after evidence, and honest evidence is not obtainable here.
2. **Cost is concrete and large.** ~616 KiB of binaries committed to a
   repository whose entire Wave 1B purpose is removing weight, plus 24
   hand-reproduced `@font-face` blocks with exact `unicode-range` values.
3. **The failure mode is the worst one available.** A single wrong
   `unicode-range` silently drops Arabic or Qur'anic diacritic coverage — the
   one thing this site cannot get wrong — and it would not be caught by any
   check that runs here.

Licensing is *not* the blocker (Amiri and Work Sans are both SIL OFL 1.1, which
permits self-hosting); the blocker is that the gain is unmeasurable here and the
downside is unrecoverable. **Google Fonts is retained, with only the faces the
CSS actually uses.** Re-evaluate when a Preview run can measure the real
critical path.

> **Superseded in Wave 1B.1 — see §16.5.** The real PageSpeed report supplied
> the missing measurement (750 ms of render-blocking), and the coverage risk
> was removed by generating the `@font-face` rules from Google's own stylesheet
> rather than authoring `unicode-range` values by hand. The fonts are now
> self-hosted.

### 15.11 Files changed in Wave 1B

**Added (12):** `assets/styles.css`, `assets/app.js`, `assets/analytics.js`,
and `assets/logo-{42,56,84,112,118,126,168,236,354}.webp`.

**Changed (3):** `index.html` (232,461 → 30,954 B), `vercel.json`
(Report-Only CSP + `/assets/` cache header; enforced headers untouched),
`docs/LANDING_FOUNDATION_BASELINE.md`.

**Removed (1):** `favicon.png` (297,819 B, byte-identical duplicate — F-13).

**Not touched, by design:** marketing copy, branding, pricing values and
discount logic, programs, LMS links, the WhatsApp destination number, the GA4
measurement ID, the video ID, conversion flows, `robots.txt`, `sitemap.xml`,
`site.webmanifest`, `logo.png`, the remaining icons, and the secret-scan
workflow. No framework, bundler, package manager or runtime dependency was
added — the site remains dependency-free static files.

Secret scan after the change: **27 files scanned, 0 findings, exit 0.**

---

## 16. Wave 1B.1 — Real-World PageSpeed Performance Hotfix

Base verified before any write: `main` at
`f55c3b861925651fbf6de786d75441f3352672a3`, PR #3 merged, no open pull
requests, worktree clean.

### 16.1 The real Production baseline (OWNER-SUPPLIED, EXTERNAL)

Wave 1B closed against a *lab* score of 89. The first real-world measurement
after that deployment came back materially lower, and it is the number this
wave is accountable to:

> PageSpeed Insights, `https://www.sirajinst.com/`, mobile, captured after the
> Wave 1B Production deployment —
> `https://pagespeed.web.dev/analysis/https-www-sirajinst-com/t7srfc1gbz?form_factor=mobile`

| Metric | Production (real) |
|---|---|
| Performance | **85** |
| Accessibility | 93 |
| Best Practices | 100 |
| SEO | 100 |
| FCP | 3.3 s |
| LCP | 3.3 s |
| TBT | 40 ms |
| CLS | 0.006 |
| Speed Index | 3.3 s |

Bottlenecks named in that report:

| Evidence | Figure |
|---|---|
| Render-blocking, estimated saving | **2,780 ms** |
| `assets/styles.css` | 7.2 KiB / 170 ms, render-blocking |
| `assets/analytics.js` | 1.8 KiB / **490 ms**, render-blocking |
| Google Fonts CSS | 1.7 KiB / **750 ms**, render-blocking |
| Google Fonts, total transfer | ~219 KiB |
| Google Tag Manager | ~143 KiB, 160 ms main thread |
| Unused GTM JavaScript | ~67 KiB |
| Video poster | 197,264 B, est. saving 154,747 B |
| Asset cache lifetime | 1 day; est. repeat-visit saving 89 KiB |
| LCP element | Hero logo |
| LCP: resource load delay | 470 ms |
| LCP: resource load duration | 400 ms |
| LCP: element render delay | 140 ms |

This is the authoritative external baseline. Nothing below replaces it with a
lab number.

### 16.2 Why the Wave 1B lab number was optimistic

Wave 1B measured with third parties blocked (§15.7). That removed from the
measurement precisely the three requests that turned out to dominate the real
critical path: the Google Fonts stylesheet, its font files, and gtag.js. The
lab was not wrong about what it measured; it measured the wrong thing.

The fix for this wave was to build a controlled harness that **keeps the third
parties in the request graph** instead of dropping them.

### 16.3 Controlled measurement methodology (LAB — read the caveats)

Lighthouse 13.4.1, Chromium 1194, mobile emulation (412×823, DPR 1.75),
simulated throttling, **median of 7 runs** after one discarded warm-up
navigation. Both the before and after trees are served by the same local
replay server, which stands in for the third-party origins:

| Origin | How it is served | Fidelity |
|---|---|---|
| `fonts.googleapis.com` | the real captured CSS | byte-for-byte |
| `fonts.gstatic.com` | the real captured WOFF2 files | byte-for-byte |
| `www.googletagmanager.com` | **size-matched inert stand-in** | transfer only |
| `*.google-analytics.com` | 204, as the real collect endpoint answers | behavioural |
| `www.youtube-nocookie.com` | minimal embed stub | behavioural |

**Disclosed limitation.** `www.googletagmanager.com` is blocked by this
sandbox's egress policy (the proxy answers 403 to CONNECT), so the real
gtag.js could not be captured. The stand-in reproduces its URL, its async
position in the document and its transfer size (146,475 B gzipped against the
report's ~143 KiB), but **not its main-thread execution**. Controlled TBT is
therefore 0 in both runs and understates Production TBT identically on each
side; TBT is the one metric below that carries no signal. Everything else is
measured on a like-for-like graph.

The harness is validated by how closely the *before* tree reproduces the real
report:

| Evidence | Production report | Controlled replay (before) |
|---|---|---|
| Render-blocking saving | 2,780 ms | **2,690 ms** |
| Google Fonts CSS | 1.7 KiB / 750 ms | 1,204 B / **751 ms** |
| `analytics.js` | 1.8 KiB / 490 ms | 1,463 B / **452 ms** |
| `styles.css` | 7.2 KiB / 170 ms | 6,563 B / **152 ms** |
| Fonts, total transfer | ~219 KiB | **218,264 B** (213.1 KiB) |
| Video poster | 197,264 B | **197,264 B** |
| Poster est. saving | 154,747 B | ~151 KiB |
| LCP element | Hero logo | Hero logo (`logo-236.webp`) |
| LCP element render delay | 140 ms | 138 ms |

The controlled environment is harsher in absolute terms than Production
(before-LCP 4,798 ms lab vs 3,300 ms real), so the **deltas**, not the
absolute values, are the result.

### 16.4 Controlled before/after

Median of 7 runs, identical methodology on both sides.

| Metric | Before (`f55c3b8`) | After | Delta |
|---|---|---|---|
| Performance | 74 | **91** | **+17** |
| FCP | 3,620 ms | **2,706 ms** | **−914 ms (−25%)** |
| LCP | 4,798 ms | **2,856 ms** | **−1,942 ms (−40%)** |
| TBT | 0 ms | 0 ms | no signal (see §16.3) |
| CLS | 0.0021 | **0.0021** | unchanged |
| Speed Index | 3,620 ms | **2,706 ms** | −914 ms |
| Accessibility | 93 | **93** | no regression |
| Best Practices | 100 | **100** | held |
| SEO | 100 | **100** | held |
| Total transfer | 693,550 B | **519,437 B** | −174,113 B (−25%) |
| Requests | 20.3 | **18.1** | −2.2 |
| Render-blocking requests | 3 | **1** | −2 |
| Render-blocking est. saving | 2,690 ms | **1,400 ms** | −1,290 ms |
| Fonts transferred | 218,264 B (cross-origin) | 218,264 B (same-origin) | same bytes, no extra connection |
| Poster transferred (mobile) | 197,264 B | **21,444 B** | **−175,820 B (−89.1%)** |
| Hero logo selected | `logo-236.webp` | `logo-236.<hash>.webp` | 1.00× fetch, no duplicate |
| YouTube requests before click | 0 | **0** | held |
| YouTube requests after click | 1 (`youtube-nocookie.com`) | 1 (`youtube-nocookie.com`) | held |
| GA4 page_view events | 1 | **1** | held |

Lighthouse insight audits that flipped to passing: `image-delivery-insight`
(was 0.5, "est. savings 151 KiB") and `cache-insight` (was failing on the
1-day lifetime). `render-blocking-insight` still reports the one remaining
same-origin stylesheet at 153 ms.

**Extrapolation, clearly labelled as such.** The controlled harness ran the
before tree 1.45× slower than Production measured it (4,798 vs 3,300 ms LCP).
Applying that same ratio to the after tree suggests a Production LCP near
2.0 s, i.e. inside the 2.5 s target. That is an inference from a ratio, not a
measurement, and it is not a claim. **Real Production PageSpeed verification
remains a post-merge step** — this environment cannot run PageSpeed Insights
against a Preview URL.

### 16.5 A — Fonts: self-hosted, reversing §15.10

§15.10 declined to self-host on two grounds. Both have now been removed:

1. *"The gain is unmeasurable here."* It is now measured, twice: the real
   report puts the Google Fonts stylesheet at **750 ms of render-blocking**,
   and the controlled replay independently reproduces it at **751 ms**.
2. *"A single wrong `unicode-range` silently drops Arabic or Qur'anic
   coverage."* This was the right fear about the wrong method. The risk came
   from *authoring* subset ranges by hand. Nothing here is authored: the
   `@font-face` rules are generated from the stylesheet Google itself serves
   for this exact page, carrying over the same families, styles, weights,
   `font-display` and — critically — the same `unicode-range` values
   verbatim. The WOFF2 files are the same files, byte-for-byte.

Consequences:

* The 12 WOFF2 files are served from `/assets/fonts/`, content-hashed.
* The 24 `@font-face` rules live at the top of the site's own stylesheet, so
  there is **no extra request** and no cross-origin round trip to discover
  them. This is what removes the 750 ms, not the font bytes themselves.
* Because the `unicode-range` values are unchanged, a browser downloads
  exactly the same subsets it downloads today. Verified: the same 5 files
  (Amiri Arabic 400, Amiri Latin 400, Amiri Latin 700, Amiri Latin italic,
  Work Sans Latin variable), the same **218,264 B**. Coverage — Latin, Latin
  Extended, Vietnamese, Arabic including Qur'anic marks, Arabic Presentation
  Forms, Arabic Mathematical Alphabetic Symbols — is unchanged by
  construction.
* `font-display: swap` is retained, so fonts never block paint. Fonts are
  deliberately **not** preloaded: preloading them would put 50–108 KB in
  front of the LCP image for text that already paints in the fallback face.
* Work Sans turned out to be a variable font — one file backs all five
  weights per subset — hence the `-var-` filenames.
* This is pure CSS. There is no JavaScript font loader, no inline handler, no
  `unsafe-inline` requirement, and the no-JavaScript path is identical to the
  JavaScript path.
* Licensing: Amiri and Work Sans are both SIL OFL 1.1, which permits
  self-hosting. Both upstream licence files ship in `assets/fonts/`.

### 16.6 B — Analytics off the critical path

Before: `analytics.js` loaded **synchronously** in `<head>` (490 ms of
render-blocking in the field) and gtag.js loaded `async` alongside it.

After: `analytics.js` is `defer`red, and it injects gtag.js itself from a
`requestIdleCallback`.

* Ordering stays reliable because `gtag()` only appends to `dataLayer`. The
  queue is built first; gtag.js drains it on arrival — the same contract
  Google's own snippet relies on.
* `requestIdleCallback(..., { timeout: 2500 })` guarantees the tag still
  loads on a page that never goes idle, so a short visit does not lose its
  page_view. The `load` event is the fallback where
  `requestIdleCallback` is unavailable.
* Exactly one `gtag('config', ...)` call exists in the codebase, and the
  injector is guarded by element id, so no duplicate initialisation and no
  duplicate page_view. Verified in the harness: one `config` entry, one
  page_view hit, one gtag.js script element.
* Measurement ID unchanged: `G-667Q0LLEH2`.
* No inline executable JavaScript is introduced. Consent and privacy scope
  are untouched, per the task's explicit instruction.

### 16.7 C — Poster

The canvas was scanned rather than guessed: rows 0–143 and 1008–1151 are black
bars, leaving **exactly 1536×864 — exactly 16:9**. Only that canvas was
removed. No recolour, resharpen, regeneration or substitution; the owner's
image is the only source.

Worth noting: `.why-video-frame` already reserves 16:9 (`padding-top: 56.25%`)
and the image is `object-fit: cover`, so the browser was *already* clipping
approximately 142 of those 144 rows. Cropping in the file makes the two
remaining slivers of black disappear and otherwise changes nothing visible.

Variants — 384 / 800 / 1200 / 1536 w, WebP and AVIF, chosen to cover 1×/2×/3×
at both the mobile width and the 798 px desktop cap:

| Width | WebP | AVIF | vs 197,264 B |
|---|---|---|---|
| 384 | 12,976 B | 9,217 B | 4.7 % |
| **800** | 28,012 B | **21,444 B** | **10.9 %** |
| 1200 | 44,120 B | 33,602 B | 17.0 % |
| 1536 | 59,382 B | 44,797 B | 22.7 % |

AVIF earns its place on evidence, not preference: at the delivered mobile
width it is both **23 % smaller** and marginally *higher* fidelity than WebP
(PSNR 38.54 dB vs 38.16 dB against the Lanczos reference). It carries no
compatibility risk inside `<picture>`, where a browser without AVIF support
falls through to the WebP `<source>` and then to the `<img>`.

`sizes="(min-width: 858px) 798px, calc(100vw - 58px)"` matches the rendered
box: the frame is capped at 800 px inside a 28 px-padded wrapper and has a
1 px border. Explicit `width="1536" height="864"` now matches the frame's
reserved 16:9 ratio exactly, so CLS protection is stronger than before, not
weaker — measured CLS is unchanged at 0.0021.

One CSS rule was required: `<picture>` is inline by default, which would have
left the image's `height: 100%` resolving against an auto-height parent.
`.video-facade picture { display: block; width: 100%; height: 100% }` keeps
the layout byte-identical to the bare `<img>`.

The façade is untouched: zero YouTube requests before interaction, and after a
click exactly one request, to
`https://www.youtube-nocookie.com/embed/Ng5P2SusEsQ?autoplay=1&rel=0`, with
`allowfullscreen` and the `accelerometer; autoplay; clipboard-write;
encrypted-media; gyroscope; picture-in-picture; web-share` permission list
intact.

### 16.8 D — Hero logo LCP discovery

The report puts 470 ms of the LCP into *resource load delay* — the image was
discoverable but started late, behind the stylesheet. A preload now sits at
the top of `<head>`, before the stylesheet:

```html
<link rel="preload" as="image" fetchpriority="high" type="image/webp"
      href="/assets/logo-118.<hash>.webp"
      imagesrcset="/assets/logo-118.<hash>.webp 1x,
                   /assets/logo-236.<hash>.webp 2x,
                   /assets/logo-354.<hash>.webp 3x">
```

The candidate list mirrors the `<img>` exactly, and `imagesizes` is
deliberately absent because the `<img>` uses `x` descriptors rather than a
`sizes` attribute — so the preload and the element resolve to the same
candidate at any DPR. **Verified: at DPR 1.75 the browser selects
`logo-236` and fetches it exactly 1.00× per load** — the preload adds no
duplicate download. `fetchpriority="high"` and the responsive variants are
retained; no unused variant is preloaded; the artwork and layout are
unchanged (hero box measures 118×118 at all six tested widths, before and
after).

### 16.9 E — Cache policy

Every file under `/assets/` now carries a content hash in its filename
(`<stem>.<sha256[:8]>.<ext>`) and is served
`public, max-age=31536000, immutable`. HTML is explicitly
`public, max-age=0, must-revalidate`. Unhashed root files (icons, manifest,
`robots.txt`, `sitemap.xml`, `logo.png`) keep a revalidatable one-day
lifetime with a 30-day `stale-while-revalidate` window, because their URLs
cannot change.

Immutable caching is only safe while a file's URL changes whenever its bytes
change, and this site deliberately has no bundler to guarantee that. The
guarantee is therefore enforced in CI:
`.github/scripts/verify_asset_hashes.py` (stdlib only, matching the existing
`scan_secrets.py` pattern) fails the build when an asset's name does not match
the hash of its own contents, when a `/assets/` reference resolves to nothing,
or when an asset is in the tree but nothing references it. That closes the
stale-CSS/JS deployment risk that immutable caching would otherwise create.

### 16.10 F — Security

* Enforced CSP **unchanged**: `base-uri 'none'; object-src 'none';
  frame-ancestors 'self'`.
* Report-Only CSP tightened *only* where the resource change requires it:
  `style-src 'self' https://fonts.googleapis.com` → `style-src 'self'`, and
  `font-src 'self' https://fonts.gstatic.com` → `font-src 'self'`. Nothing
  else moved; `frame-src` was deliberately left alone since no frame
  behaviour changed.
* No `unsafe-inline`, no `unsafe-eval`, no inline event handler, no inline
  executable script anywhere in the document.
* `X-Content-Type-Options`, `Referrer-Policy` and `Permissions-Policy` are
  untouched. HSTS is not set in `vercel.json` and was not touched here — it
  remains the open item recorded in §9.
* Secret scan after the change: **51 files scanned, 0 findings, exit 0.**
* Asset hash check: **32 hashed assets, 32 references resolved, exit 0.**

### 16.11 Regression verification (LAB)

58-check suite, run against both the before and the after tree. The before
tree passes 54/58 — failing **only** the four checks that assert the new
behaviour (responsive poster, tightened Report-Only CSP, HTML cache header,
immutable asset header). Every functional check passes identically on both
trees, which is what makes "no regression" a measurement rather than a claim.

Verified: dynamic year; all 4 WhatsApp CTAs and the message text; the floating
WhatsApp button's scroll reveal; both login links; mobile menu open/aria/close;
program tabs; pricing at 1 and 4 students and at monthly and annual duration,
with values recomputed independently from the published rate card and the
billed line asserted in full; FAQ open/closed; poster loaded and visible;
zero YouTube requests before click and the correct embed after; GA4 configured
exactly once; keyboard focus visible; reduced-motion suppressing all 22 hero
motes; zero console errors in every context.

Responsive at 320 / 375 / 430 / 768 / 1024 / 1440: no horizontal overflow at
any width, video frame holds 16:9 at every width, section order identical, and
**page height identical to the byte at all six widths** (14922 / 13332 / 12310
/ 9580 / 8968 / 8394 px, before and after).

SEO: canonical `https://www.sirajinst.com/`, `og:url` matching, both JSON-LD
blocks parsing with www URLs, `robots.txt` and `sitemap.xml` www-aligned, no
non-www canonical signal anywhere in the document, SEO 100 in controlled
testing.

### 16.12 Post-deployment verification (UNVERIFIED HERE)

1. **Run PageSpeed Insights against Production after merge.** This is the only
   number that settles whether the ≥ 90 / ≤ 2.5 s targets are met. Nothing in
   this document claims it.
2. **TBT.** The controlled runs cannot execute the real gtag.js, so confirm
   TBT is no worse than the 40 ms baseline. Deferring gtag.js to idle should
   help it, but that is untested here.
3. **Video playback.** Picture and sound were verified only against an embed
   stub; confirm real playback and audio on the deployed Preview.
4. **Vercel header precedence.** Confirm the deployed responses actually carry
   `immutable` on `/assets/` and `max-age=0` on the document — this relies on
   later `vercel.json` rules overriding earlier ones for the same key.
5. **Font rendering.** Confirm Work Sans and Amiri render identically, and
   spot-check the Qur'anic ayah glyphs in the About section.
6. **HSTS** remains the open item from §9.

### 16.13 Files changed in Wave 1B.1

**Added (26):** `assets/fonts/` — 12 WOFF2 files plus
`LICENSE-Amiri-OFL.txt` and `LICENSE-WorkSans-OFL.txt`; 8 poster variants
(`video-poster-Ng5P2SusEsQ-{384,800,1200,1536}.{webp,avif}`);
`.github/scripts/verify_asset_hashes.py`;
`.github/workflows/asset-integrity.yml`.

**Changed (5):** `index.html`, `assets/styles.css` (font faces + one
`<picture>` rule), `assets/analytics.js` (rewritten), `vercel.json`,
`docs/LANDING_FOUNDATION_BASELINE.md`. All 12 existing `/assets/` files were
additionally renamed to content-hashed filenames.

**Removed (1):** `assets/video-poster-Ng5P2SusEsQ.jpg` (197,264 B) — the
original, now unreferenced; it is preserved in git history at `f55c3b8` and
is the sole source of the cropped variants.

**Not touched, by design:** marketing copy, branding, pricing values and
discount logic, programs, LMS links, the WhatsApp destination number, the GA4
measurement ID `G-667Q0LLEH2`, the YouTube video ID `Ng5P2SusEsQ`, conversion
flows, `robots.txt`, `sitemap.xml`, `site.webmanifest`, `logo.png`, the root
icons, the enforced CSP, and the secret-scan workflow. No framework, bundler,
package manager or runtime dependency was added — the site remains
dependency-free static files.
