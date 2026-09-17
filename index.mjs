import { createRequire } from 'node:module';

const api = createRequire(import.meta.url)('./index.cjs');

export const { plugins, categories, dataVersion, lookup, has, assess, byRisk, byCategory, byEquivalentType, toSlug } = api;
export default api;
