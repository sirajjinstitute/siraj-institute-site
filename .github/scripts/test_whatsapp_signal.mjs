import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import vm from 'node:vm';
const file = readdirSync('assets').find(name => /^app\.[a-f0-9]+\.js$/.test(name));
const source = readFileSync(`assets/${file}`, 'utf8');
const clickSource = source.slice(source.indexOf('/* WhatsApp trial-booking links */'), source.indexOf('const pricingSection'));
function fixture(fetch) {
  let click;
  const document = { querySelectorAll: () => [], addEventListener: (event, handler) => { if(event === 'click') click = handler; } };
  vm.runInNewContext(clickSource, { document, window: {}, fetch });
  const link = { id: '', textContent: 'WhatsApp', getAttribute: () => '', closest: () => null, matches: () => false, classList: { contains: value => value === 'wa-link' } };
  return trusted => click({ isTrusted: trusted, target: { closest: () => link } });
}
test('trusted WhatsApp activation emits fixed nonblocking signal without credentials', () => {
  const calls = [];
  fixture((url, options) => { calls.push({url,options}); return Promise.resolve(); })(true);
  assert.equal(calls.length,1);
  assert.equal(calls[0].url,'https://siraj-lms.vercel.app/api/website-contact');
  assert.equal(calls[0].options.method,'POST');
  assert.equal(calls[0].options.body,'website-whatsapp');
  assert.equal(calls[0].options.keepalive,true);
  assert.equal(calls[0].options.mode,'no-cors');
  assert.equal(calls[0].options.credentials,'omit');
});
test('synthetic events and failed recording cannot break WhatsApp contact', async () => {
  let calls = 0;
  fixture(() => { calls++; return Promise.resolve(); })(false);
  assert.equal(calls,0);
  assert.doesNotThrow(() => fixture(() => { throw Error('offline'); })(true));
  assert.doesNotThrow(() => fixture(() => Promise.reject(Error('offline')))(true));
  await new Promise(resolve => setImmediate(resolve));
});
