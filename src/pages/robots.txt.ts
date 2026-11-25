import type { APIRoute } from 'astro';
import { absoluteUrl } from '../lib/sitemap';

export const GET: APIRoute = ({ site }) =>
  new Response(`User-agent: *\nAllow: /\n\nSitemap: ${absoluteUrl('sitemap.xml', site!.href)}\n`, {
    headers: { 'Content-Type': 'text/plain' },
  });
