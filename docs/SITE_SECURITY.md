# Landing site security

Decisions from the security pass of 2026-10-14 (owner request: "act as an
attacker, then harden the site and its SEO").

## What is published

Vercel builds with `.github/scripts/build_site.py`, which copies an explicit
allowlist into `dist/` (`outputDirectory`). Before this, the whole repository
was served, so `/CLAUDE.md`, `/vercel.json`, `/docs/…`, `/.github/…` and
`/.claude/…` were downloadable from the live domain (verified on Production,
2026-10-14; they held no credentials). A new public file must be added to
`PUBLIC` in that script, or it is not deployed.

## Content Security Policy

The home page (`/`, `/index.html`) enforces:

- scripts and styles from this origin only (no `unsafe-inline`, no
  `unsafe-eval`), plus Google Analytics 4 from `*.googletagmanager.com`;
- images from this origin, `data:` (two CSS icons) and the GA4 hosts;
- connections to this origin and the GA4 hosts only;
- no frames, objects, workers, forms or `<base>`; the page may be framed only
  by itself.

The GA4 hosts follow Google's published CSP guidance for GA4. If Google
Signals or Ads are ever enabled, they need further hosts. Add them on
purpose, never with a wildcard.

Because inline styles are blocked, the pages carry no `style=""` attributes.
Values that used to be inline live in generated classes at the end of the
stylesheet. Scripts may still set styles through the CSSOM
(`el.style.setProperty`), which CSP allows. JSON-LD blocks are data and are
never executed.

The LMS paths proxied through this domain (`/login`, `/apply`, `/api`, …)
keep only the base policy (`base-uri`, `object-src`, `frame-ancestors`); the
LMS sets its own.

Other headers on the home page: `Cross-Origin-Opener-Policy: same-origin`,
`Permissions-Policy` (no camera, microphone, location, payment …),
`X-Content-Type-Options: nosniff`, `Referrer-Policy`, and HSTS from Vercel.

## Checks

`node --test .github/scripts/test_site_security.mjs` covers:

- the allowlist build;
- the enforced CSP;
- no inline style, script or handler in the pages;
- `noopener` on new-tab links;
- the SEO metadata, including schema profile links matching the footer.

It runs with the other tests:

`node --test .github/scripts/test_*.mjs`
