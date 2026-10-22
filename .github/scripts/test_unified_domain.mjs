import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const config = JSON.parse(readFileSync('vercel.json', 'utf8'));
const html = readFileSync('index.html', 'utf8');
const upstream = 'https://siraj-lms.vercel.app';

const appOrigin = 'https://app.suqyainstitute.com';
const accountPrefixes = ['login', 'admin', 'teacher', 'student', 'guardian', 'supervisor', 'coordinator'];

test('public intake stays on the visible host and account paths move to the app host', () => {
  for (const prefix of ['apply', 'jobapp', 'trial']) {
    assert.equal(config.rewrites.find(r => r.source === `/${prefix}`)?.destination, `${upstream}/${prefix}`);
    assert.equal(config.rewrites.find(r => r.source === `/${prefix}/:path*`)?.destination, `${upstream}/${prefix}/:path*`);
  }
  // The installed app is scoped to the app host only, so the marketing host
  // must never proxy account paths (that is what made the app capture links).
  for (const prefix of accountPrefixes) {
    assert.ok(!config.rewrites.some(r => r.source.split('/')[1]?.split(':')[0] === prefix), `${prefix} must not be rewritten`);
    const bare = config.redirects.find(r => r.source === `/${prefix}`);
    assert.equal(bare?.destination, `${appOrigin}/${prefix}`);
    assert.equal(bare?.statusCode, 308);
    assert.equal(config.redirects.find(r => r.source === `/${prefix}/:path*`)?.destination, `${appOrigin}/${prefix}/:path*`);
  }
  for (const r of config.redirects) {
    if (r.destination.startsWith(appOrigin)) continue;
    assert.ok(r.has?.some(h => h.type === 'host'), `${r.source} must be host-conditioned`);
    assert.ok(r.destination.startsWith('https://suqyainstitute.com/'));
  }
  assert.equal((html.match(/href="https:\/\/app\.suqyainstitute\.com\/login"/g) ?? []).length, 2);
  assert.doesNotMatch(html, /href="\/login/);
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

test('the marketing host is not installable as the portal app', () => {
  // The portal manifest (scope "/") lives on the app host only; serving it
  // here made the installed app capture every link to the marketing site.
  for (const source of ['/manifest.webmanifest', '/sw.js']) {
    assert.ok(!config.rewrites.some(r => r.source === source), `${source} must not be proxied`);
  }
  assert.equal(config.rewrites.find(r => r.source === '/app-icons/:path*')?.destination, `${upstream}/app-icons/:path*`);
  assert.match(html, /<link rel="manifest" href="\/site\.webmanifest">/);
  assert.doesNotMatch(html, /\/manifest\.webmanifest/);
  assert.doesNotMatch(html, /install\.[0-9a-f]{8}\.js|installAppDialog|data-install-app/);
  assert.equal((html.match(/href="https:\/\/app\.suqyainstitute\.com\/login#install-app"/g) ?? []).length, 3);
});
