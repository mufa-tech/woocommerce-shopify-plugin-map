'use strict';

const data = require('./data/plugins.json');

const plugins = Object.freeze(data.plugins.map((p) => Object.freeze(p)));
const bySlug = new Map(plugins.map((p) => [p.slug, p]));
const RISK_ORDER = ['none', 'low', 'medium', 'high'];

/** Normalise a slug, a plugin folder path or an asset URL to a plugin slug. */
function toSlug(input) {
  const s = String(input || '').trim().toLowerCase();
  const m = s.match(/\/plugins\/([^/?#]+)/);
  return (m ? m[1] : s).replace(/^\/+|\/+$/g, '');
}

/** The entry for one plugin, or undefined if it is not in the map. */
function lookup(slugOrPath) {
  return bySlug.get(toSlug(slugOrPath));
}

/** Whether the map has an entry for this plugin. */
function has(slugOrPath) {
  return bySlug.has(toSlug(slugOrPath));
}

/**
 * Split a list of installed plugins into known entries and unknown slugs,
 * and report the highest migration risk among the known ones.
 */
function assess(slugs) {
  const known = [];
  const unknown = [];
  const seen = new Set();
  for (const raw of slugs || []) {
    const slug = toSlug(raw);
    if (!slug || seen.has(slug)) continue;
    seen.add(slug);
    const entry = bySlug.get(slug);
    if (entry) known.push(entry); else unknown.push(slug);
  }
  known.sort((a, b) => RISK_ORDER.indexOf(b.migration_risk) - RISK_ORDER.indexOf(a.migration_risk) || a.name.localeCompare(b.name));
  const highestRisk = known.length ? known[0].migration_risk : null;
  const byRisk = { none: 0, low: 0, medium: 0, high: 0 };
  for (const p of known) byRisk[p.migration_risk] += 1;
  return { known, unknown, highestRisk, byRisk };
}

/** All entries with the given migration risk: none, low, medium or high. */
function byRisk(risk) {
  return plugins.filter((p) => p.migration_risk === risk);
}

/** All entries in a category, case-insensitive. */
function byCategory(category) {
  const c = String(category || '').toLowerCase();
  return plugins.filter((p) => p.category.toLowerCase() === c);
}

/** All entries with the given equivalent type, such as built-in or plus-only. */
function byEquivalentType(type) {
  return plugins.filter((p) => p.equivalent_type === type);
}

const categories = Object.freeze([...new Set(plugins.map((p) => p.category))].sort());

module.exports = {
  plugins,
  categories,
  dataVersion: data.version,
  lookup,
  has,
  assess,
  byRisk,
  byCategory,
  byEquivalentType,
  toSlug,
};
