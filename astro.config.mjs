// @ts-check
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';

// Pages kept out of the sitemap: the form thank-you page, and Speaking and writing
// until it has its first item.
const NOT_IN_SITEMAP = ['/success/', '/speaking-writing/'];

export default defineConfig({
  site: 'https://amaanomar.com',
  output: 'static',
  trailingSlash: 'ignore',
  integrations: [
    react(),
    sitemap({ filter: (page) => !NOT_IN_SITEMAP.some((p) => page.endsWith(p)) }),
  ],
});
