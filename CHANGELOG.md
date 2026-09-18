# Changelog

## 1.2.0 (2026-09-19)

- Dataset v3: B2BKing and Wholesale Prices now map to Shopify B2B as a built-in feature. Shopify moved companies, catalogs, payment terms and volume pricing to every plan on 2 April 2026, with a 3-catalog limit below Plus. Notes updated accordingly.
- B2B entries link to the new in-depth migration page.

## 1.1.0 (2026-09-18)

- New command line tool: pipe `wp plugin list` in, get a migration plan out, with text, `--markdown` and `--json` output. Exits 2 on high migration risk.
- Dataset v2: every entry now carries a `guide` link to an in-depth migration guide where one covers that kind of plugin.
- WooCommerce itself and WordPress defaults are ignored rather than reported as unknown.

## 1.0.0 (2026-09-18)

- First tagged release: 88 plugins across 30+ categories, as JSON, CSV and a JSON Schema.
- npm package with lookup helpers: `lookup`, `has`, `assess`, `byRisk`, `byCategory`, `byEquivalentType`. ESM, CommonJS and TypeScript types.
- Related guides linked from the README.
