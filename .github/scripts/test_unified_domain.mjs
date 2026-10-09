import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const config = JSON.parse(readFileSync('vercel.json', 'utf8'));
const html = readFileSync('index.html', 'utf8');
const upstream = 'https://siraj-lms.vercel.app';

test('all six account destinations and public intake stay on the visible host', () => {
  for (const prefix of ['login', 'apply', 'trial', 'admin', 'teacher', 'student', 'guardian', 'supervisor', 'coordinator']) {
    const bare = config.rewrites.find(r => r.source === `/${prefix}`);
    assert.equal(bare?.destination, `${upstream}/${prefix}`);
    const rule = config.rewrites.find(r => r.source === `/${prefix}/:path*`);
    assert.equal(rule?.destination, `${upstream}/${prefix}/:path*`);
    assert.ok(config.rewrites.indexOf(bare) < config.rewrites.indexOf(rule));
  }
  assert.equal(config.redirects, undefined);
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
  for (const role of ['admin', 'teacher', 'student', 'guardian', 'supervisor', 'coordinator', 'api']) {
    assert.ok(rule.source.includes(role));
  }
  assert.equal(rule.headers[0].value, 'noindex, nofollow');
});
