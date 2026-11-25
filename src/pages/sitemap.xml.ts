import type { APIRoute } from 'astro';
import { getLibrary } from '../lib/content';
import { sitemapXml } from '../lib/sitemap';

/** Generated at build time from the content, so new formulas appear automatically. */
export const GET: APIRoute = ({ site }) =>
  new Response(sitemapXml(getLibrary(), site!.href), { headers: { 'Content-Type': 'application/xml' } });
