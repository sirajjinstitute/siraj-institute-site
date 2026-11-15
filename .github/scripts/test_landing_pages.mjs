import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

// The six parent guides copy their teacher cards, pricing and footer from
// index.html. These checks stop the copies drifting from the home page and
// keep each page's search metadata unique and truthful.
const SLUGS = ['online-quran-classes-for-kids-uk', 'online-quran-classes-for-kids-usa', 'quran-for-non-arabic-speakers',
  'free-quran-trial-class', 'tajweed-for-kids', 'noorani-qaida-online', 'islamic-studies-for-kids'];
const config = JSON.parse(readFileSync('vercel.json', 'utf8'));
const home = readFileSync('index.html', 'utf8');
const build = readFileSync('.github/scripts/build_site.py', 'utf8');
const sitemap = readFileSync('sitemap.xml', 'utf8');
const pages = Object.fromEntries(SLUGS.map(s => [s, readFileSync(`${s}.html`, 'utf8')]));
const one = (html, re) => (html.match(re) ?? [])[1];
const text = s => s.replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&rsquo;/g, '’');
const cardsOf = html => Object.fromEntries([...html.matchAll(/<article class="t-card reveal" aria-labelledby="t-([a-z-]+)">[\s\S]*?<\/article>/g)].map(m => [m[1], m[0]]));
const homeCards = cardsOf(home);
const homePricing = one(home, /(<section class="pricing dark" id="pricing"[\s\S]*?<\/section>)/);
const csp = config.headers.find(h => h.source.startsWith('/:page(online-quran-classes')).headers;

test('every guide is published, routed, in the sitemap and linked from the home page', () => {
  for (const slug of SLUGS) {
    assert.ok(build.includes(`"${slug}.html"`), `${slug} in the publish allowlist`);
    assert.ok(config.rewrites.some(r => r.source === `/${slug}` && r.destination === `/${slug}.html`), `${slug} routed`);
    assert.ok(config.headers.find(h => h.source.startsWith('/:page(online-quran-classes')).source.includes(slug));
    assert.ok(sitemap.includes(`<loc>https://suqyainstitute.com/${slug}</loc>`), `${slug} in sitemap`);
    assert.match(home, new RegExp(`<a href="/${slug}">`), `home links ${slug}`);
  }
});

test('the guides keep the home page CSP and need no inline script or style', () => {
  const homeCsp = config.headers.filter(h => h.source === '/').flatMap(h => h.headers).find(h => h.key === 'Content-Security-Policy').value;
  assert.equal(csp.find(h => h.key === 'Content-Security-Policy').value, homeCsp);
  assert.equal(csp.find(h => h.key === 'Cross-Origin-Opener-Policy').value, 'same-origin');
  for (const [slug, html] of Object.entries(pages)) {
    assert.doesNotMatch(html, /\sstyle="|\son[a-z]+="|javascript:/i, slug);
    for (const m of html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/g)) {
      if (m[2].trim()) assert.match(m[1], /type="application\/ld\+json"/, slug);
    }
    for (const m of html.matchAll(/<a\b[^>]*target="_blank"[^>]*>/g)) assert.match(m[0], /rel="[^"]*noopener/, slug);
    assert.doesNotMatch(html, /1004751455|100[ -]475[ -]1455/);
    assert.equal((html.match(/wa\.me\/201032032598\?/g) ?? []).length, 3, slug);
  }
});

test('each guide has unique, complete search metadata and one H1', () => {
  const titles = new Set(); const descs = new Set();
  for (const [slug, html] of Object.entries(pages)) {
    const title = one(html, /<title>([^<]+)<\/title>/);
    const desc = one(html, /<meta name="description" content="([^"]+)">/);
    assert.ok(title && title.length <= 65, `${slug} title length ${title?.length}`);
    assert.ok(desc && desc.length >= 120 && desc.length <= 200, `${slug} description length ${desc?.length}`);
    titles.add(title); descs.add(desc);
    assert.match(html, new RegExp(`<link rel="canonical" href="https://suqyainstitute\\.com/${slug}">`));
    assert.match(html, new RegExp(`<meta property="og:url" content="https://suqyainstitute\\.com/${slug}">`));
    assert.equal((html.match(/<h1\b/g) ?? []).length, 1, `${slug} has one h1`);
    assert.match(html, /<html lang="en">/);
  }
  assert.equal(titles.size, SLUGS.length);
  assert.equal(descs.size, SLUGS.length);
});

test('structured data is truthful: the FAQ schema is exactly the visible FAQ, and no ratings', () => {
  for (const [slug, html] of Object.entries(pages)) {
    const ld = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map(m => JSON.parse(m[1]));
    const faq = ld.find(d => d['@type'] === 'FAQPage');
    const faqHtml = one(html, /<div class="faq-list reveal">([\s\S]*?)<\/div>/);
    const visible = [...faqHtml.matchAll(/<summary>([\s\S]*?)<\/summary><p>([\s\S]*?)<\/p>/g)].map(m => [text(m[1]), text(m[2])]);
    assert.deepEqual(faq.mainEntity.map(q => [q.name, q.acceptedAnswer.text]), visible, slug);
    const crumbs = ld.find(d => d['@type'] === 'BreadcrumbList');
    assert.equal(crumbs.itemListElement.at(-1).item, `https://suqyainstitute.com/${slug}`);
    assert.doesNotMatch(html, /aggregateRating|"Review"|ratingValue/);
  }
});

test('teacher cards and pricing are identical to the home page', () => {
  for (const [slug, html] of Object.entries(pages)) {
    for (const [id, card] of Object.entries(cardsOf(html))) assert.equal(card, homeCards[id], `${slug}: ${id} card matches home`);
    assert.equal(one(html, /(<section class="pricing dark" id="pricing"[\s\S]*?<\/section>)/), homePricing, `${slug} pricing`);
    // Every dollar figure in the page copy is one the home page already publishes.
    const body = html.replace(homePricing, '');
    for (const m of body.matchAll(/\$\d+(?:\.\d+)?/g)) assert.ok(home.includes(m[0]) || m[0] === '$7.50', `${slug}: ${m[0]}`);
  }
});

test('guides link to each other and to the home page', () => {
  for (const [slug, html] of Object.entries(pages)) {
    for (const other of SLUGS) if (other !== slug) assert.match(html, new RegExp(`href="/${other}"`), `${slug} -> ${other}`);
    assert.match(html, /<a href="\/"><strong>/);
    assert.match(html, new RegExp(`<a href="/${slug}" aria-current="page">`));
    assert.match(html, /<a href="\/apply" class="btn btn-gold btn-lg">Book a free trial<\/a>/);
  }
});

test('the guide hero eyebrow uses the light gold that passes AA on navy', () => {
  const css = readFileSync(`assets/${home.match(/styles\.[0-9a-f]{8}\.css/)[0]}`, 'utf8');
  assert.match(css, /\.lp-hero \.eyebrow\{color:var\(--gold\)\}/);
});

test('owner-confirmed facts only: age 4, no background-check or recording claims, no testimonials', () => {
  for (const [slug, html] of Object.entries(pages)) {
    const copy = text(html);
    assert.doesNotMatch(copy, /\bDBS\b|background[- ]check|lessons are recorded|recorded lessons|testimonial/i, slug);
    for (const m of copy.matchAll(/from (\d+) years old/g)) assert.equal(m[1], '4', slug);
  }
});

test('the Islamic Studies page never names Darussalam (owner decision)', () => {
  assert.doesNotMatch(pages['islamic-studies-for-kids'], /darussalam/i);
});
