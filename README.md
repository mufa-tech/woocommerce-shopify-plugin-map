# WooCommerce → Shopify plugin map

**What each WooCommerce plugin becomes on Shopify, and where the migration gets expensive.**

[![npm](https://img.shields.io/npm/v/woocommerce-shopify-plugin-map)](https://www.npmjs.com/package/woocommerce-shopify-plugin-map)
[![tests](https://github.com/mufa-tech/woocommerce-shopify-plugin-map/actions/workflows/test.yml/badge.svg)](https://github.com/mufa-tech/woocommerce-shopify-plugin-map/actions/workflows/test.yml)
[![data licence: CC BY 4.0](https://img.shields.io/badge/data-CC%20BY%204.0-blue)](LICENSE)
[![code licence: MIT](https://img.shields.io/badge/code-MIT-blue)](LICENSE-CODE)

Quoting a WooCommerce to Shopify migration means going through the store's plugin
list one by one: which features Shopify has built in, which need an app, and which
have no equivalent at all. On a typical store that is 40 to 60 plugins, and the
answer decides both the price and the timeline.

This package does that lookup for you. Pipe in a plugin list, get back a migration
plan sorted by risk.

```
wp plugin list --field=name | npx woocommerce-shopify-plugin-map
```

```
HIGH    WooCommerce Subscriptions → Shopify Subscriptions (free, by Shopify) or Recharge
        Active subscriptions depend on stored payment tokens. They move only if your
        payment gateway supports token migration; plan this before anything else.
        Guide: https://studio.mufatech.com/woocommerce-to-shopify/subscriptions/
HIGH    WPML → Shopify Markets with Translate & Adapt
        Translations are imported per language; translated URLs and hreflang change
        structure. Guide: https://studio.mufatech.com/woocommerce-to-shopify/multilingual/
MEDIUM  Product Bundles → Shopify Bundles (free, by Shopify)
        Fixed bundles map cleanly, mix-and-match needs an app.
LOW     Yoast SEO → Native SEO title and description fields
NONE    WP Rocket → Not needed: Shopify CDN and caching
UNKNOWN my-custom-plugin

Ignored: woocommerce
5 of 6 plugins mapped · highest risk: HIGH
2 high and 1 medium risk plugins decide most of the migration effort.
```

Covers **88 plugins** across payments, shipping, subscriptions, SEO, multilingual,
page builders, B2B, reviews, marketplaces and more. Each entry has a Shopify
equivalent, a migration risk level and a note on what to plan for.

The same data powers the free
[WooCommerce to Shopify readiness scanner](https://studio.mufatech.com/migrate/).

## Command line

No installation needed:

```
npx woocommerce-shopify-plugin-map woocommerce-subscriptions wordpress-seo wp-rocket
```

Input can be piped, passed as arguments or read from a file. Slugs, plugin folder
paths and asset URLs all work, so all of these go in as they are:

```
wp plugin list --field=name | npx woocommerce-shopify-plugin-map
ls wp-content/plugins | npx woocommerce-shopify-plugin-map
npx woocommerce-shopify-plugin-map --file plugins.txt
```

| Option | What it does |
|---|---|
| `--markdown` | Markdown table, for pasting into a proposal |
| `--json` | JSON, for scripts |
| `--known` | Hide plugins that are not in the map |
| `--file <path>` | Read the list from a file |
| `--no-color` | Plain text |
| `--version` | CLI and dataset version |

The command exits with code `2` when any plugin carries high migration risk, so it
can gate a build step or a migration checklist. WooCommerce itself and WordPress
defaults are ignored rather than reported as unknown.

## Library

```
npm install woocommerce-shopify-plugin-map
```

```js
import { lookup, assess } from 'woocommerce-shopify-plugin-map';

lookup('woocommerce-subscriptions').shopify_equivalent;
// 'Shopify Subscriptions (free, by Shopify) or Recharge'

// Slugs, plugin folder paths and asset URLs all work
lookup('https://example.com/wp-content/plugins/wordpress-seo/js/dist/x.js').name;
// 'Yoast SEO'

const report = assess(['woocommerce-subscriptions', 'sitepress-multilingual-cms', 'wp-rocket', 'my-plugin']);
report.highestRisk; // 'high'
report.byRisk;      // { none: 1, low: 0, medium: 0, high: 2 }
report.unknown;     // ['my-plugin']
report.known;       // entries, highest migration risk first
```

Also exported: `plugins`, `categories`, `has`, `byRisk`, `byCategory`,
`byEquivalentType` and `toSlug`. Works with `import` and `require`, ships
TypeScript types, has no dependencies.

## Using the data directly

| File | Format |
|---|---|
| [`data/plugins.json`](data/plugins.json) | JSON, one object per plugin |
| [`data/plugins.csv`](data/plugins.csv) | CSV, for spreadsheets |
| [`schema/plugins.schema.json`](schema/plugins.schema.json) | JSON Schema for `plugins.json` |

```
https://raw.githubusercontent.com/mufa-tech/woocommerce-shopify-plugin-map/main/data/plugins.json
```

### Fields

| Field | Meaning |
|---|---|
| `slug` | Plugin folder name as it appears in `/wp-content/plugins/` |
| `name` | Plugin name |
| `category` | Functional area, such as Payments, SEO or Subscriptions |
| `shopify_equivalent` | What replaces it on Shopify |
| `equivalent_type` | `built-in`, `shopify-app`, `third-party-app`, `plus-only`, `not-needed` or `no-equivalent` |
| `equivalent_type_label` | Readable label for `equivalent_type` |
| `migration_risk` | `none`, `low`, `medium` or `high` |
| `notes` | What to plan for during the move |
| `distribution` | `wordpress.org` or `premium or third-party` |
| `wordpress_org` | Plugin page on WordPress.org, or `null` for premium plugins |
| `guide` | In-depth migration guide for this kind of plugin, or `null` |

### Migration risk levels

- **none** — nothing to migrate: the feature exists on Shopify or is no longer needed.
- **low** — routine setup or a straightforward app replacement.
- **medium** — needs planning, such as rebuilding shipping rules or mapping custom fields to metafields.
- **high** — changes the data model or the Shopify plan: active subscriptions, multilingual URLs, marketplaces, B2B price lists.

## Related guides

Some plugin categories need more than an app swap. These guides cover them in
depth, with every claim sourced from Shopify's, WooCommerce's or Google's own
documentation:

| If the store uses | Read |
|---|---|
| WooCommerce Subscriptions | [Migrating subscriptions without asking customers to re-subscribe](https://studio.mufatech.com/woocommerce-to-shopify/subscriptions/) |
| WPML, Polylang | [Migrating a multilingual store](https://studio.mufatech.com/woocommerce-to-shopify/multilingual/) |
| Yoast SEO, Rank Math | [Moving SEO titles, descriptions and alt text](https://studio.mufatech.com/woocommerce-to-shopify/seo-fields/) |
| Redirection, any permalink setup | [301 redirects and the URL map](https://studio.mufatech.com/woocommerce-to-shopify/redirects/) |
| Review plugins | [Moving reviews to Judge.me, Loox or Yotpo](https://studio.mufatech.com/woocommerce-to-shopify/reviews/) |
| Variation and product add-on plugins | [Variations and Shopify's 3-option limit](https://studio.mufatech.com/woocommerce-to-shopify/variations/) |
| Customer accounts, memberships | [Customer accounts and passwords](https://studio.mufatech.com/woocommerce-to-shopify/customers/) |

All guides, including migration cost and a 48-step checklist:
[studio.mufatech.com/woocommerce-to-shopify](https://studio.mufatech.com/woocommerce-to-shopify/)

## Corrections, additions and support

Shopify and the plugin ecosystem change often. If an entry is out of date or a
common plugin is missing, please say so — corrections are welcome and land in the
next release.

- **Something wrong or missing?** [Open an issue](https://github.com/mufa-tech/woocommerce-shopify-plugin-map/issues) or a pull request. See [CONTRIBUTING.md](CONTRIBUTING.md).
- **Question about using the package?** [Open an issue](https://github.com/mufa-tech/woocommerce-shopify-plugin-map/issues) — it helps the next person too.
- **Stuck on a migration, or want one done for you?** Write to **hello@mufatech.com**. We answer migration questions whether or not you are a client.

## About

Built and maintained by [Mufatech Studio](https://studio.mufatech.com), which
engineers Shopify themes and migrates stores from WooCommerce to Shopify. The map
is the working reference we use on real migrations, kept public so that anyone
planning one can use it.

- [Free WooCommerce readiness scan](https://studio.mufatech.com/migrate/) — catalog size, plugins, redirects and a complexity score in about 20 seconds, no login
- [Migration guides](https://studio.mufatech.com/woocommerce-to-shopify/) — twelve sourced guides with free tools
- [Mufatech](https://mufatech.com) · [GitHub](https://github.com/mufa-tech) · [X](https://x.com/mufatech_hq)

## License

The helper code is [MIT](LICENSE-CODE). The data is licensed under
[Creative Commons Attribution 4.0](LICENSE): use it in commercial and
non-commercial work, as long as you credit **Mufatech** with a link to
https://studio.mufatech.com.

Shopify and WooCommerce are trademarks of their respective owners. This project is
not affiliated with or endorsed by either company.
