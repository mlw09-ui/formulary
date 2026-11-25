import { describe, expect, it } from 'vitest';
import { getLibrary } from '../src/lib/content';
import { sitemapPaths, sitemapXml } from '../src/lib/sitemap';

describe('sitemap', () => {
  const lib = getLibrary();
  const paths = sitemapPaths(lib);

  it('lists every page exactly once', () => {
    const fields = lib.domains.flatMap((d) => d.fields);
    const topics = fields.flatMap((f) => f.topics);
    expect(paths.length).toBe(1 + lib.domains.length + fields.length + topics.length + lib.formulas.length);
    expect(new Set(paths).size).toBe(paths.length);
  });

  it('writes absolute URLs with a trailing slash', () => {
    const xml = sitemapXml(lib, 'https://example.github.io');
    const locs = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]!);
    expect(locs).toHaveLength(paths.length);
    for (const u of locs) expect(u).toMatch(/^https:\/\/example\.github\.io\/.*\/$|^https:\/\/example\.github\.io\/$/);
  });
});
