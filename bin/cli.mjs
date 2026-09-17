#!/usr/bin/env node
// Turns a list of WordPress plugins into a WooCommerce → Shopify migration plan.
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';

const { plugins, assess, dataVersion } = createRequire(import.meta.url)('../index.cjs');

const HELP = `woocommerce-shopify-plugin-map — what each WooCommerce plugin becomes on Shopify

Usage
  wp plugin list --field=name | npx woocommerce-shopify-plugin-map
  npx woocommerce-shopify-plugin-map woocommerce-subscriptions wordpress-seo
  npx woocommerce-shopify-plugin-map --file plugins.txt

Input
  One plugin per line, or arguments. Slugs, plugin folder paths and asset URLs
  all work, so "wp plugin list", an ls of wp-content/plugins or a crawl of
  asset URLs can be piped in directly. Blank lines and # comments are ignored.

Options
  --file <path>   Read the list from a file instead of stdin
  --markdown      Markdown table, for pasting into a proposal
  --json          JSON, for scripts
  --known         Hide plugins that are not in the map
  --no-color      Plain text
  --version       Print the CLI and dataset version
  --help          This message

Exit code is 0 unless a plugin carries high migration risk, which exits 2.
Data: CC BY 4.0, ${plugins.length} plugins. https://studio.mufatech.com/woocommerce-to-shopify/`;

const HUB = 'https://studio.mufatech.com/woocommerce-to-shopify/';
const SCANNER = 'https://studio.mufatech.com/migrate/';
// WooCommerce itself and WordPress defaults are not plugins to replace; they are dropped from the report.
const PLATFORM = new Set(['woocommerce', 'woocommerce-admin', 'woocommerce-blocks', 'woocommerce-gutenberg-products-block', 'akismet', 'hello-dolly', 'hello', 'classic-editor', 'classic-widgets']);
const RISKS = ['high', 'medium', 'low', 'none'];
const LABEL = { high: 'HIGH', medium: 'MEDIUM', low: 'LOW', none: 'NONE' };

function parseArgs(argv) {
  const opts = { format: 'text', color: process.stdout.isTTY && !process.env.NO_COLOR, known: false, file: null, args: [] };
  for (let i = 0; i < argv.length; i += 1) {
    const a = argv[i];
    if (a === '--help' || a === '-h') opts.help = true;
    else if (a === '--version' || a === '-v') opts.version = true;
    else if (a === '--markdown' || a === '--md') opts.format = 'markdown';
    else if (a === '--json') opts.format = 'json';
    else if (a === '--known') opts.known = true;
    else if (a === '--color') opts.color = true;
    else if (a === '--no-color') opts.color = false;
    else if (a === '--file' || a === '-f') opts.file = argv[++i];
    else if (a.startsWith('-')) throw new Error(`unknown option ${a}`);
    else opts.args.push(a);
  }
  return opts;
}

function readStdin() {
  try {
    return readFileSync(0, 'utf8');
  } catch {
    return '';
  }
}

// "  woocommerce-subscriptions  5.9.0  active " → "woocommerce-subscriptions"
// Takes the first field so `wp plugin list` output with columns works as well.
function parseList(text) {
  return text
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l && !l.startsWith('#'))
    .map((l) => (/^https?:\/\//.test(l) || l.includes('/plugins/') ? l : l.split(/[\s,\t|]+/)[0]))
    .filter((l) => l && !/^(name|plugin|slug|status|-{2,}|\+-)/i.test(l));
}

const paint = (on) => (code, s) => (on ? `[${code}m${s}[0m` : s);

function renderText(result, color) {
  const c = paint(color);
  const colour = { high: '31', medium: '33', low: '36', none: '32' };
  const out = [];
  for (const risk of RISKS) {
    for (const p of result.known.filter((k) => k.migration_risk === risk)) {
      out.push(`${c(colour[risk], LABEL[risk].padEnd(6))}  ${p.name} → ${p.shopify_equivalent}`);
      const detail = [p.notes, p.guide && risk !== 'none' ? `Guide: ${p.guide}` : ''].filter(Boolean).join(' ');
      if (detail) out.push(`        ${c('2', detail)}`);
    }
  }
  if (!result.opts.known) for (const slug of result.unknown) out.push(`${c('2', 'UNKNOWN')}  ${slug}`);
  out.push('');
  const n = result.known.length + result.unknown.length;
  if (result.ignored.length) out.push(c('2', `Ignored: ${result.ignored.join(', ')}`));
  out.push(`${result.known.length} of ${n} plugins mapped · highest risk: ${result.highestRisk ? LABEL[result.highestRisk] : 'none'}`);
  if (result.byRisk.high || result.byRisk.medium) {
    const { high, medium } = result.byRisk;
    const parts = [high && `${high} high`, medium && `${medium} medium`].filter(Boolean).join(' and ');
    out.push(c('2', `${parts} risk plugin${high + medium === 1 ? '' : 's'} decide${high + medium === 1 ? 's' : ''} most of the migration effort.`));
  }
  if (result.unknown.length && !result.opts.known) {
    const n = result.unknown.length;
    out.push(c('2', `${n} plugin${n === 1 ? ' is' : 's are'} not in the map. Check ${n === 1 ? 'it' : 'each one'} by hand, or open an issue to have ${n === 1 ? 'it' : 'them'} added.`));
  }
  out.push(c('2', `Guides: ${HUB} · Free store scan: ${SCANNER}`));
  return out.join('\n');
}

function renderMarkdown(result) {
  const rows = result.known.map((p) => `| ${LABEL[p.migration_risk]} | ${p.name} | ${p.shopify_equivalent} | ${p.notes || ''}${p.guide ? ` [Guide](${p.guide})` : ''} |`);
  const out = ['| Risk | Plugin | On Shopify | Notes |', '| --- | --- | --- | --- |', ...rows];
  if (result.unknown.length && !result.opts.known) {
    out.push(...result.unknown.map((s) => `| ? | \`${s}\` | Not in the map | Check by hand |`));
  }
  out.push('', `${result.known.length} of ${result.known.length + result.unknown.length} plugins mapped, highest risk **${result.highestRisk ? LABEL[result.highestRisk] : 'none'}**.`,
    `Source: [WooCommerce → Shopify plugin map](https://github.com/mufa-tech/woocommerce-shopify-plugin-map) (CC BY 4.0) · [Migration guides](${HUB})`);
  return out.join('\n');
}

function main() {
  let opts;
  try {
    opts = parseArgs(process.argv.slice(2));
  } catch (err) {
    console.error(`${err.message}\nRun with --help for usage.`);
    process.exit(1);
  }
  if (opts.help) return console.log(HELP);
  if (opts.version) {
    const pkg = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'));
    return console.log(`${pkg.version} (dataset v${dataVersion}, ${plugins.length} plugins)`);
  }

  const input = opts.file ? readFileSync(opts.file, 'utf8') : opts.args.length ? opts.args.join('\n') : readStdin();
  const list = parseList(input);
  if (!list.length) {
    console.error('No plugins given. Pipe a list in, pass slugs as arguments, or use --file.\nRun with --help for usage.');
    process.exit(1);
  }

  const ignored = list.filter((s) => PLATFORM.has(s));
  const result = { ...assess(list.filter((s) => !PLATFORM.has(s))), opts, ignored };
  if (opts.format === 'json') {
    console.log(JSON.stringify({
      dataset_version: dataVersion,
      input_count: list.length,
      ignored: result.ignored,
      highest_risk: result.highestRisk,
      by_risk: result.byRisk,
      known: result.known,
      unknown: result.unknown,
    }, null, 2));
  } else {
    console.log(opts.format === 'markdown' ? renderMarkdown(result) : renderText(result, opts.color));
  }
  process.exit(result.byRisk.high ? 2 : 0);
}

main();
