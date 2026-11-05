import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';

const config = JSON.parse(readFileSync('vercel.json', 'utf8'));
const html = readFileSync('index.html', 'utf8');
const notFound = readFileSync('404.html', 'utf8');
const build = readFileSync('.github/scripts/build_site.py', 'utf8');

// A source may appear in several header rules; search them all.
const headerFor = (source, key) => config.headers
  .filter(h => h.source === source)
  .flatMap(h => h.headers)
  .find(h => h.key === key)?.value;

test('only the allowlisted site is published, never the repository', () => {
  assert.equal(config.outputDirectory, 'dist');
  assert.match(config.buildCommand, /build_site\.py/);
  // Checks run before the copy, so a failing check stops the deploy.
  assert.ok(config.buildCommand.indexOf('verify_asset_hashes') < config.buildCommand.indexOf('build_site'));
  assert.ok(config.buildCommand.indexOf('scan_secrets') < config.buildCommand.indexOf('build_site'));
  for (const internal of ['CLAUDE.md', 'docs', 'vercel.json', '.github', '.claude']) {
    assert.ok(!build.includes(`"${internal}"`), `${internal} must not be published`);
  }
});

test('the landing page enforces a strict CSP', () => {
  for (const source of ['/', '/index.html']) {
    const csp = headerFor(source, 'Content-Security-Policy');
    assert.ok(csp, `${source} has an enforced CSP`);
    assert.equal(headerFor(source, 'Content-Security-Policy-Report-Only'), undefined);
    for (const directive of ["default-src 'self'", "script-src 'self'", "style-src 'self'", "object-src 'none'",
      "base-uri 'none'", "frame-ancestors 'self'", "form-action 'none'", "frame-src 'none'"]) {
      assert.ok(csp.includes(directive), `${source}: ${directive}`);
    }
    assert.doesNotMatch(csp, /unsafe-inline|unsafe-eval|youtube/);
    assert.equal(headerFor(source, 'Cross-Origin-Opener-Policy'), 'same-origin');
  }
});

test('the pages need no inline script or style, so the CSP cannot break them', () => {
  for (const page of [html, notFound]) {
    assert.doesNotMatch(page, /\sstyle="/);
    assert.doesNotMatch(page, /\son[a-z]+="/);
    assert.doesNotMatch(page, /javascript:/i);
    // Only JSON-LD data blocks may be inline; they are never executed.
    for (const m of page.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/g)) {
      if (m[2].trim()) assert.match(m[1], /type="application\/ld\+json"/);
    }
  }
});

test('every external link opened in a new tab cannot reach back to this page', () => {
  for (const m of html.matchAll(/<a\b[^>]*target="_blank"[^>]*>/g)) {
    assert.match(m[0], /rel="[^"]*noopener[^"]*"/);
  }
});

test('search metadata is complete and consistent', () => {
  assert.match(html, /<link rel="canonical" href="https:\/\/suqyainstitute\.com\/">/);
  assert.match(html, /<meta property="og:image" content="https:\/\/suqyainstitute\.com\/assets\/og-cover\.[0-9a-f]{8}\.jpg">/);
  assert.match(html, /<meta property="og:image:width" content="1200">/);
  assert.match(notFound, /<meta name="robots" content="noindex">/);
  const ld = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map(m => JSON.parse(m[1]));
  const org = ld.find(d => d['@type'] === 'EducationalOrganization');
  // The schema's profile links must be the ones the footer shows.
  for (const url of org.sameAs) {
    const handle = url.replace(/^https:\/\/(www\.)?/, '').replace(/\/$/, '');
    assert.ok(html.includes(handle), `${url} also appears on the page`);
  }
});

test('the Privacy Policy and Terms pages are published, routed, linked and locked down', () => {
  for (const page of ['privacy', 'terms']) {
    const file = readFileSync(`${page}.html`, 'utf8');
    assert.ok(build.includes(`"${page}.html"`), `${page}.html is in the publish allowlist`);
    assert.ok(config.rewrites.some(r => r.source === `/${page}` && r.destination === `/${page}.html`), `/${page} is routed`);
    assert.match(html, new RegExp(`<a href="/${page}">`), `the home page footer links /${page}`);
    assert.match(file, new RegExp(`<link rel="canonical" href="https://suqyainstitute\\.com/${page}">`));
    // No script at all on the legal pages, so the CSP can forbid every script.
    assert.doesNotMatch(file, /<script\b/);
    assert.doesNotMatch(file, /\sstyle="|\son[a-z]+="|javascript:/i);
    const csp = headerFor('/:page(privacy|terms)', 'Content-Security-Policy');
    assert.match(csp, /script-src 'none'/);
    assert.match(csp, /default-src 'self'/);
    assert.equal(headerFor('/:page(privacy|terms)', 'Cross-Origin-Opener-Policy'), 'same-origin');
  }
});

test('the legal pages ship with no unfilled owner placeholder', () => {
  for (const page of ['privacy', 'terms']) {
    assert.doesNotMatch(readFileSync(`${page}.html`, 'utf8'), /OWNER TO CONFIRM|class="todo"/, `${page}.html`);
  }
});

test('the site publishes only the official WhatsApp number', () => {
  const app = readdirSync('assets').filter(f => /^app\.[0-9a-f]{8}\.js$/.test(f)).map(f => readFileSync(`assets/${f}`, 'utf8')).join('\n');
  for (const text of [html, notFound, app]) assert.doesNotMatch(text, /1004751455|100[ -]475[ -]1455/);
  assert.equal((html.match(/wa\.me\/201032032598\?/g) ?? []).length, 3);
  assert.match(app, /const waNumber = '201032032598';/);
});
