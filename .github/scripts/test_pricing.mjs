import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import vm from 'node:vm';

// Runs the page's own pricing block (between the pricing markers in app.js)
// so the published figures are tested exactly as the browser computes them.
const file = readdirSync('assets').find(name => /^app\.[a-f0-9]+\.js$/.test(name));
const source = readFileSync(`assets/${file}`, 'utf8');
const begin = source.indexOf('/* pricing:begin */');
const end = source.indexOf('/* pricing:end */');
assert.ok(begin !== -1 && end > begin, 'pricing markers present');
const context = {};
vm.runInNewContext(`${source.slice(begin, end)}\nthis.quote = quote; this.packageInfo = packageInfo; this.HOURLY_RATE = HOURLY_RATE;`, context);
const { quote, packageInfo, HOURLY_RATE } = context;
// Array.from builds the arrays in this realm, so deepStrictEqual compares values only.
const monthly = (students, duration) => Array.from(packageInfo, pkg => quote(students, duration, pkg).monthly);

test('the hourly rate is $14.99 and each package is its hours at that rate', () => {
  assert.equal(HOURLY_RATE, 14.99);
  assert.deepEqual(Array.from(packageInfo, p => p.monthlyHours), [4, 6, 8, 10]);
  assert.deepEqual(monthly(1, 'monthly'), [59.96, 89.94, 119.92, 149.9]);
});

test('family discounts are 10%, 15% and 20%', () => {
  assert.deepEqual(monthly(2, 'monthly'), [53.96, 80.95, 107.93, 134.91]);
  assert.deepEqual(monthly(3, 'monthly'), [50.97, 76.45, 101.93, 127.42]);
  assert.deepEqual(monthly(4, 'monthly'), [47.97, 71.95, 95.94, 119.92]);
});

test('billing discounts are 5%, 10% and 15%', () => {
  assert.deepEqual(monthly(1, 'quarterly'), [56.96, 85.44, 113.92, 142.41]);
  assert.deepEqual(monthly(1, 'semiannual'), [53.96, 80.95, 107.93, 134.91]);
  assert.deepEqual(monthly(1, 'annual'), [50.97, 76.45, 101.93, 127.42]);
});

test('the biggest discount wins and discounts never stack', () => {
  const q = quote(2, 'quarterly', packageInfo[0]);
  assert.equal(q.pct, 0.10);
  assert.equal(q.source, 'family');
  const a = quote(2, 'annual', packageInfo[0]);
  assert.equal(a.pct, 0.15);
  assert.equal(a.source, 'billing');
  const tie = quote(2, 'semiannual', packageInfo[0]);
  assert.equal(tie.pct, 0.10);
  assert.equal(tie.source, 'family');
  assert.equal(quote(4, 'annual', packageInfo[3]).monthly, 119.92);
});

test('the billed total is the shown monthly price times the months', () => {
  for (const students of [1, 2, 3, 4]) {
    for (const duration of ['monthly', 'quarterly', 'semiannual', 'annual']) {
      for (const pkg of packageInfo) {
        const q = quote(students, duration, pkg);
        assert.equal(q.total, Math.round(q.monthly * q.months * 100) / 100);
        assert.equal(q.hours, pkg.monthlyHours * q.months);
      }
    }
  }
  assert.equal(quote(2, 'quarterly', packageInfo[0]).total, 161.88);
  assert.equal(quote(1, 'annual', packageInfo[1]).total, 917.4);
});
