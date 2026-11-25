import type { Library } from './content';
import { href } from './url';

/** Site-relative paths of every page (home, domains, fields, topics, formulas). Excludes the 404 page. */
export function sitemapPaths(lib: Library): string[] {
  const paths = [''];
  for (const d of lib.domains) {
    paths.push(d.path);
    for (const f of d.fields) {
      paths.push(f.path);
      for (const t of f.topics) paths.push(t.path);
    }
  }
  for (const f of lib.formulas) paths.push(lib.formulaPath(f));
  return paths;
}

/** Absolute URL including the GitHub Pages base path, e.g. https://user.github.io/formulary/physics/. */
export function absoluteUrl(path: string, site: string): string {
  return new URL(href(path), site).href;
}

export function sitemapXml(lib: Library, site: string): string {
  const urls = sitemapPaths(lib)
    .map((p) => `  <url><loc>${absoluteUrl(p, site)}</loc></url>`)
    .join('\n');
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`;
}
