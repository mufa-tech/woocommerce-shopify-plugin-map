import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const CLI = fileURLToPath(new URL('../bin/cli.mjs', import.meta.url));

function run(args = [], input = '') {
  try {
    const stdout = execFileSync(process.execPath, [CLI, ...args], { input, encoding: 'utf8', env: { ...process.env, NO_COLOR: '1' } });
    return { code: 0, stdout };
  } catch (err) {
    return { code: err.status, stdout: err.stdout || '', stderr: err.stderr || '' };
  }
}

test('--help and --version', () => {
  assert.match(run(['--help']).stdout, /Usage/);
  assert.match(run(['--version']).stdout, /^\d+\.\d+\.\d+ \(dataset v\d+, \d+ plugins\)/);
});

test('reads slugs from arguments and exits 2 on high risk', () => {
  const r = run(['woocommerce-subscriptions', 'wp-rocket']);
  assert.equal(r.code, 2);
  assert.match(r.stdout, /HIGH\s+WooCommerce Subscriptions/);
  assert.match(r.stdout, /NONE\s+WP Rocket/);
  assert.match(r.stdout, /woocommerce-to-shopify\/subscriptions\//);
});

test('exits 0 when nothing is high risk', () => {
  assert.equal(run(['wp-rocket']).code, 0);
});

test('parses wp plugin list table output and ignores the platform itself', () => {
  const input = 'name\tstatus\tversion\nwoocommerce\tactive\t10.9.3\nwordpress-seo\tactive\t22.0\n';
  const r = run([], input);
  assert.equal(r.code, 0);
  assert.match(r.stdout, /Yoast SEO/);
  assert.match(r.stdout, /Ignored: woocommerce/);
  assert.doesNotMatch(r.stdout, /UNKNOWN\s+woocommerce/);
  assert.match(r.stdout, /1 of 1 plugins mapped/);
});

test('accepts plugin folder paths and asset URLs', () => {
  const r = run([], 'https://example.com/wp-content/plugins/woocommerce-subscriptions/assets/x.js?ver=1\n/var/www/wp-content/plugins/wordpress-seo\n');
  assert.match(r.stdout, /WooCommerce Subscriptions/);
  assert.match(r.stdout, /Yoast SEO/);
});

test('--json is machine readable', () => {
  const data = JSON.parse(run(['--json', 'wordpress-seo', 'nope-not-real']).stdout);
  assert.equal(data.highest_risk, 'low');
  assert.deepEqual(data.unknown, ['nope-not-real']);
  assert.equal(data.known[0].slug, 'wordpress-seo');
  assert.ok(data.dataset_version >= 2);
});

test('--markdown renders a table, --known hides unknown plugins', () => {
  const md = run(['--markdown', 'wordpress-seo', 'nope-not-real']).stdout;
  assert.match(md, /^\| Risk \| Plugin \| On Shopify \| Notes \|/m);
  assert.match(md, /nope-not-real/);
  assert.doesNotMatch(run(['--known', 'wordpress-seo', 'nope-not-real']).stdout, /nope-not-real/);
});

test('empty input and unknown options fail with exit 1', () => {
  assert.equal(run([], '\n# just a comment\n').code, 1);
  assert.equal(run(['--nope']).code, 1);
});
