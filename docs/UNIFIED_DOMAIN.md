# One public hostname for Suqya

Owner Decision (2026-10-09): the landing page and learning platform use the
same hostname, with `/login`, `/apply` and account paths, without an `app`
or `learn` subdomain. Keep the existing canonical `www.sirajinst.com` and
the apex-to-www redirect.

The landing project remains static. Its explicit Vercel external rewrites
forward LMS paths, APIs, `/_next`, `/brand` and `/curriculum` to the existing
production alias `siraj-lms.vercel.app`, preserving their original paths,
query strings, request bodies and cookies. This is not an iframe or a
client-visible redirect. Do not point that upstream back to the landing
hostname: that would create a loop. No database migration or permission
change is part of this work.

## Required release verification

- `/` and static assets still serve the landing page and its canonical SEO.
- `/login` and `/apply` render through the landing hostname; scripts, CSS,
  fonts, optimized images, branding and book figures load correctly.
- `/jobapp` (teacher application form) renders through the landing hostname and
  is `noindex`. Merge its rewrite only after the LMS release that serves
  `/jobapp` is deployed and its migration is applied; before that the page and
  its API answer 503/404.
- Every account path still requires the LMS's existing server/database
  authorization; unauthenticated redirects remain on the visible hostname.
- A same-origin login Server Action runs, and a foreign Origin is rejected.
- Invalid family intake reaches validation without writing an application;
  foreign Origin is rejected. Do not create real applicants to test routing.
- Cookies remain host-scoped and authenticated HTML/API responses remain
  private/no-store; do not add public CDN caching for account routes.
- Marketing's microphone/camera denial and report-only CSP apply to the
  landing document only. Audio homework must still be tested in a signed-in
  student session before declaring full acceptance.
- The marketing document's third-party analytics now share a browser origin
  with the LMS. Treat those scripts as trusted application code; do not add
  new tracking scripts without a session/privacy review.
- The existing upstream alias remains available during transition; users
  previously signed in there may need to sign in once on the canonical host.
- Email links and Supabase Auth redirects must be inspected separately;
  do not claim they changed merely because routing was released.

## Recovery

Restore the landing project's previous tested Vercel deployment, or revert
this focused PR and verify the new serving deployment. That removes these
rewrites and restores the old explicit LMS links. No database recovery is
required; the upstream LMS is unchanged. Do not change DNS or transfer
domain ownership for this routing approach.

## Checks

`python3 .github/scripts/verify_asset_hashes.py .`

`python3 .github/scripts/scan_secrets.py .`

`node --test .github/scripts/test_whatsapp_signal.mjs .github/scripts/test_unified_domain.mjs`

Vercel Preview READY is only configuration/build evidence. Record actual
HTTP/browser checks and exact deployment identities in the PR before release.

## Update (Owner Decision, 2026-10-21): app on its own hostname

The installed portal app (manifest `scope: "/"`) captured every link on the
shared hostname, so opening the marketing site launched the app. The app now
lives on `https://app.suqyainstitute.com` (the LMS Vercel project); the
marketing host stays in the browser. This supersedes "no subdomain" above for
account paths only.

- Marketing host keeps rewrites for `/apply`, `/jobapp`, `/trial`, `/api`,
  `/_next`, `/brand`, `/curriculum`, `/app-icons`.
- `/login`, `/admin`, `/coordinator`, `/supervisor`, `/teacher`, `/student`,
  `/guardian` (and subpaths) are 308 redirects to the app host, so old links
  and bookmarks keep working. The landing "Log in" and "Get the app" links go
  straight to the app host; "Get the app" lands on its sign-in page, which has
  the install button.
- `/manifest.webmanifest` and `/sw.js` are no longer proxied on the marketing
  host; the landing uses its own `site.webmanifest`.
- Existing installs of the app from `suqyainstitute.com` must be removed and
  reinstalled from the app host; users sign in once on the new host.
- Recovery: revert this PR (restores the rewrites); the app host can stay.
