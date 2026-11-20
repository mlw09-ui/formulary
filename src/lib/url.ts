/** Prefix a site-relative path with the configured base (for GitHub Pages subpaths). */
export function href(path = ''): string {
  const base = import.meta.env.BASE_URL.replace(/\/$/, '');
  const clean = path.replace(/^\/+/, '').replace(/\/+$/, '');
  if (!clean) return `${base}/`;
  // Files (e.g. search-index.json) have no trailing slash; pages do.
  return /\.[a-z0-9]+$/i.test(clean) ? `${base}/${clean}` : `${base}/${clean}/`;
}
