# WooCommerce → Shopify plugin map

What happens to each WooCommerce plugin when a store moves to Shopify: whether the feature is built into Shopify, covered by an app made by Shopify, needs a third-party app, requires Shopify Plus, or is simply not needed anymore.

The map covers 88 widely used WooCommerce and WordPress plugins across payments, shipping, subscriptions, SEO, multilingual, page builders, B2B, reviews and more. Each entry has a migration risk level and a short note on what to plan for.

It is the same data that powers the free [WooCommerce to Shopify readiness scanner](https://studio.mufatech.com/migrate/).

## Files

| File | Format |
|---|---|
| [`data/plugins.json`](data/plugins.json) | JSON, one object per plugin |
| [`data/plugins.csv`](data/plugins.csv) | CSV, for spreadsheets |
| [`schema/plugins.schema.json`](schema/plugins.schema.json) | JSON Schema for `plugins.json` |

Raw JSON URL:

```
https://raw.githubusercontent.com/mufa-tech/woocommerce-shopify-plugin-map/main/data/plugins.json
```

## Install

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

const report = assess(['woocommerce-subscriptions', 'sitepress-multilingual-cms', 'wp-rocket', 'my-custom-plugin']);
report.highestRisk; // 'high'
report.byRisk;      // { none: 1, low: 0, medium: 0, high: 2 }
report.unknown;     // ['my-custom-plugin']
report.known;       // entries, highest migration risk first
```

Also exported: `plugins`, `categories`, `has`, `byRisk`, `byCategory`, `byEquivalentType` and `toSlug`. Works with `import` and `require`, ships TypeScript types, has no dependencies.

## Fields

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

### Migration risk levels

- **none**: nothing to migrate, the feature exists on Shopify or is no longer needed.
- **low**: routine setup or a straightforward app replacement.
- **medium**: needs planning, such as rebuilding shipping rules or mapping custom fields to metafields.
- **high**: changes the data model or the Shopify plan, such as active subscriptions, multilingual URLs, marketplaces or B2B price lists.

## Example without npm

```js
const res = await fetch('https://raw.githubusercontent.com/mufa-tech/woocommerce-shopify-plugin-map/main/data/plugins.json');
const { plugins } = await res.json();

const bySlug = new Map(plugins.map((p) => [p.slug, p]));
const installed = ['woocommerce-subscriptions', 'wordpress-seo', 'wp-rocket'];

for (const slug of installed) {
  const p = bySlug.get(slug);
  console.log(`${p.name}: ${p.shopify_equivalent} (${p.migration_risk} risk)`);
}
```

## Related guides

Some plugin categories need more than an app swap. These guides cover them in depth, with sources:

| If the store uses | Read |
|---|---|
| WooCommerce Subscriptions | [Migrating subscriptions without asking customers to re-subscribe](https://studio.mufatech.com/woocommerce-to-shopify/subscriptions/) |
| WPML, Polylang | [Migrating a multilingual store](https://studio.mufatech.com/woocommerce-to-shopify/multilingual/) |
| Yoast SEO, Rank Math | [Moving SEO titles, descriptions and alt text](https://studio.mufatech.com/woocommerce-to-shopify/seo-fields/) |
| Redirection, any permalink setup | [301 redirects and the URL map](https://studio.mufatech.com/woocommerce-to-shopify/redirects/), with a redirect CSV generator |
| Review plugins | [Moving reviews to Judge.me, Loox or Yotpo](https://studio.mufatech.com/woocommerce-to-shopify/reviews/) |
| Variation and product add-on plugins | [Variations and Shopify's 3-option limit](https://studio.mufatech.com/woocommerce-to-shopify/variations/) |
| Customer accounts, membership plugins | [Customer accounts and passwords](https://studio.mufatech.com/woocommerce-to-shopify/customers/) |

All guides, including cost and a 48-step checklist: [studio.mufatech.com/woocommerce-to-shopify](https://studio.mufatech.com/woocommerce-to-shopify/).

## Corrections and additions

Shopify and the plugin ecosystem change often. If an entry is out of date or a common plugin is missing, open an issue or a pull request. See [CONTRIBUTING.md](CONTRIBUTING.md).

## License

The helper code is [MIT](LICENSE-CODE). The data is licensed under [Creative Commons Attribution 4.0](LICENSE). You can use it in commercial and non-commercial work, as long as you credit **Mufatech** with a link to https://studio.mufatech.com.

Shopify and WooCommerce are trademarks of their respective owners. This project is not affiliated with or endorsed by either company.
