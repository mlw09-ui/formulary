// @ts-check
import { defineConfig } from 'astro/config';
import preact from '@astrojs/preact';
import tailwindcss from '@tailwindcss/vite';

// SITE_URL / BASE_PATH let the same build deploy to a domain root (Netlify, Vercel)
// or to a GitHub Pages project subpath (BASE_PATH=/formulary).
export default defineConfig({
  site: process.env.SITE_URL || 'https://example.com',
  base: process.env.BASE_PATH || '/',
  trailingSlash: 'always',
  output: 'static',
  integrations: [preact()],
  vite: { plugins: [tailwindcss()] },
});
