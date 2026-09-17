import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
import * as esm from '../index.mjs';

const require = createRequire(import.meta.url);
const cjs = require('../index.cjs');
const raw = JSON.parse(readFileSync(new URL('../data/plugins.json', import.meta.url), 'utf8'));

const TYPES = ['built-in', 'shopify-app', 'third-party-app', 'plus-only', 'not-needed', 'no-equivalent'];
const RISKS = ['none', 'low', 'medium', 'high'];

test('data is consistent', () => {
  assert.equal(raw.count, raw.plugins.length);
  const slugs = new Set();
  for (const p of raw.plugins) {
    assert.ok(p.slug && p.slug === p.slug.toLowerCase(), `slug ${p.slug}`);
    assert.ok(!slugs.has(p.slug), `duplicate ${p.slug}`);
    slugs.add(p.slug);
    assert.ok(p.name && p.category && p.shopify_equivalent, p.slug);
    assert.ok(TYPES.includes(p.equivalent_type), p.slug);
    assert.ok(RISKS.includes(p.migration_risk), p.slug);
    if (p.wordpress_org !== null) assert.match(p.wordpress_org, /^https:\/\/wordpress\.org\/plugins\//);
  }
});

test('ESM and CommonJS expose the same data', () => {
  assert.equal(esm.plugins.length, raw.count);
  assert.equal(cjs.plugins.length, raw.count);
  assert.equal(esm.default.lookup, cjs.lookup);
});

test('lookup accepts slugs, folder paths and asset URLs', () => {
  const direct = esm.lookup('woocommerce-subscriptions');
  assert.equal(direct.migration_risk, 'high');
  assert.equal(esm.lookup('https://example.com/wp-content/plugins/woocommerce-subscriptions/assets/js/x.js?ver=1'), direct);
  assert.equal(esm.lookup(' WooCommerce-Subscriptions/ '), direct);
  assert.equal(esm.lookup('not-a-real-plugin'), undefined);
  assert.equal(esm.has('wordpress-seo'), true);
});

test('assess sorts by risk and separates unknown plugins', () => {
  const r = esm.assess(['wp-rocket', 'woocommerce-subscriptions', 'my-custom-plugin', 'wp-rocket']);
  assert.deepEqual(r.unknown, ['my-custom-plugin']);
  assert.equal(r.known.length, 2);
  assert.equal(r.known[0].slug, 'woocommerce-subscriptions');
  assert.equal(r.highestRisk, 'high');
  assert.equal(r.byRisk.high, 1);
  assert.deepEqual(esm.assess([]), { known: [], unknown: [], highestRisk: null, byRisk: { none: 0, low: 0, medium: 0, high: 0 } });
});

test('filters', () => {
  assert.ok(esm.byRisk('high').every((p) => p.migration_risk === 'high'));
  assert.ok(esm.byCategory('seo').length > 0);
  assert.ok(esm.byEquivalentType('plus-only').length > 0);
  assert.ok(esm.categories.includes('Payments'));
});

test('entries are read-only', () => {
  assert.throws(() => { esm.plugins[0].name = 'x'; }, TypeError);
});
