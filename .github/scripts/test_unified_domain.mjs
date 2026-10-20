import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const config = JSON.parse(readFileSync('vercel.json', 'utf8'));
const html = readFileSync('index.html', 'utf8');
const upstream = 'https://siraj-lms.vercel.app';

test('all six account destinations and public intake stay on the visible host', () => {
  for (const prefix of ['login', 'apply', 'jobapp', 'trial', 'admin', 'teacher', 'student', 'guardian', 'supervisor', 'coordinator']) {
    const bare = config.rewrites.find(r => r.source === `/${prefix}`);
    assert.equal(bare?.destination, `${upstream}/${prefix}`);
    const rule = config.rewrites.find(r => r.source === `/${prefix}/:path*`);
    assert.equal(rule?.destination, `${upstream}/${prefix}/:path*`);
    assert.ok(config.rewrites.indexOf(bare) < config.rewrites.indexOf(rule));
  }
  // Redirects only canonicalise other hosts onto https://suqyainstitute.com;
  // none may turn the visible host into a redirect away from the site.
  for (const r of config.redirects ?? []) {
    assert.ok(r.has?.some(h => h.type === 'host'), `${r.source} must be host-conditioned`);
    assert.ok(r.destination.startsWith('https://suqyainstitute.com/'));
  }
  assert.equal((html.match(/href="\/login"/g) ?? []).length, 2);
  assert.doesNotMatch(html, /https:\/\/siraj-lms\.vercel\.app/);
});

test('framework assets, lesson figures and API calls have their own upstream routes', () => {
  for (const prefix of ['_next', 'brand', 'curriculum', 'api']) {
    assert.equal(config.rewrites.find(r => r.source === `/${prefix}/:path*`)?.destination,
      `${upstream}/${prefix}/:path*`);
  }
  // No catch-all that would accidentally take over the marketing document/assets.
  assert.ok(config.rewrites.every(r => !['/', '/:path*', '/assets/:path*'].includes(r.source)));
  assert.ok(config.rewrites.every(r => r.destination.startsWith(upstream + '/')));
});

test('marketing microphone/camera restrictions and report-only CSP do not blanket the LMS', () => {
  for (const entry of config.headers) {
    if (entry.headers.some(h => ['Permissions-Policy', 'Content-Security-Policy-Report-Only'].includes(h.key))) {
      assert.ok(['/', '/index.html'].includes(entry.source));
    }
  }
  const common = config.headers.find(h => h.source === '/(.*)').headers;
  assert.ok(common.some(h => h.key === 'Content-Security-Policy' && h.value.includes("frame-ancestors 'self'")));
  assert.ok(common.some(h => h.key === 'X-Content-Type-Options' && h.value === 'nosniff'));
  assert.ok(!config.headers.some(h => h.source.includes('api') && h.headers.some(v => v.key === 'Cache-Control' && /public|immutable/.test(v.value))));
});

test('private portals and API responses opt out of search indexing', () => {
  const rule = config.headers.find(r => r.headers.some(h => h.key === 'X-Robots-Tag'));
  assert.ok(rule);
  for (const role of ['jobapp', 'admin', 'teacher', 'student', 'guardian', 'supervisor', 'coordinator', 'api']) {
    assert.ok(rule.source.includes(role));
  }
  assert.equal(rule.headers[0].value, 'noindex, nofollow');
});

test('the installable-app files reach the portal on the visible host', () => {
  // The portal pages served here link /manifest.webmanifest, register /sw.js
  // for push notifications and use /app-icons/*; without these the app could
  // not be installed or receive notifications on suqyainstitute.com.
  for (const [source, destination] of [
    ['/manifest.webmanifest', `${upstream}/manifest.webmanifest`],
    ['/sw.js', `${upstream}/sw.js`],
    ['/app-icons/:path*', `${upstream}/app-icons/:path*`],
  ]) {
    assert.equal(config.rewrites.find(r => r.source === source)?.destination, destination);
  }
  // The landing page uses the portal's own manifest (one app identity on
  // this host), so "Get the app" installs the portal directly from here.
  assert.match(html, /<link rel="manifest" href="\/manifest\.webmanifest">/);
  assert.doesNotMatch(html, /site\.webmanifest/);
  assert.equal((html.match(/href="\/login#install-app"[^>]*data-install-app/g) ?? []).length, 3);
  assert.match(html, /<script src="\/assets\/install\.[0-9a-f]{8}\.js" defer><\/script>/);
  assert.match(html, /<dialog id="installAppDialog"/);
  // Without a browser install prompt (in-app browsers, already installed)
  // the button shows device steps instead of leaving for the login page.
  assert.match(html, /data-install-steps="ios"/);
  assert.match(html, /data-install-now/);
  assert.match(html, /data-install-steps="other"[^]*Install app/);
});
