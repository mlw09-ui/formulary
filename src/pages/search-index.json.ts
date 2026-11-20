import type { APIRoute } from 'astro';
import { getLibrary } from '../lib/content';
import { buildSearchIndex } from '../lib/search';

export const GET: APIRoute = () =>
  new Response(JSON.stringify(buildSearchIndex(getLibrary())), {
    headers: { 'Content-Type': 'application/json' },
  });
