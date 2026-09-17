export type EquivalentType = 'built-in' | 'shopify-app' | 'third-party-app' | 'plus-only' | 'not-needed' | 'no-equivalent';
export type MigrationRisk = 'none' | 'low' | 'medium' | 'high';

export interface PluginEntry {
  /** Plugin folder name as it appears in /wp-content/plugins/ */
  slug: string;
  name: string;
  category: string;
  /** What replaces the plugin on Shopify */
  shopify_equivalent: string;
  equivalent_type: EquivalentType;
  equivalent_type_label: string;
  migration_risk: MigrationRisk;
  /** What to plan for during the move */
  notes: string;
  distribution: 'wordpress.org' | 'premium or third-party';
  wordpress_org: string | null;
}

export interface Assessment {
  /** Entries found in the map, highest migration risk first */
  known: PluginEntry[];
  /** Slugs that are not in the map */
  unknown: string[];
  highestRisk: MigrationRisk | null;
  byRisk: Record<MigrationRisk, number>;
}

export const plugins: readonly PluginEntry[];
export const categories: readonly string[];
export const dataVersion: number;

/** Normalise a slug, a plugin folder path or an asset URL to a plugin slug. */
export function toSlug(input: string): string;
/** The entry for one plugin, or undefined if it is not in the map. */
export function lookup(slugOrPath: string): PluginEntry | undefined;
export function has(slugOrPath: string): boolean;
/** Split installed plugins into known entries and unknown slugs, with the highest risk. */
export function assess(slugs: Iterable<string>): Assessment;
export function byRisk(risk: MigrationRisk): PluginEntry[];
export function byCategory(category: string): PluginEntry[];
export function byEquivalentType(type: EquivalentType): PluginEntry[];

declare const api: {
  plugins: typeof plugins;
  categories: typeof categories;
  dataVersion: typeof dataVersion;
  toSlug: typeof toSlug;
  lookup: typeof lookup;
  has: typeof has;
  assess: typeof assess;
  byRisk: typeof byRisk;
  byCategory: typeof byCategory;
  byEquivalentType: typeof byEquivalentType;
};
export default api;
