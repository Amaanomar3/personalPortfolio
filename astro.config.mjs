// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

// Pages kept out of the sitemap: the form thank-you page, Speaking and writing until it has
// its first item, and What I believe until his own words replace the placeholders.
const NOT_IN_SITEMAP = ['/success/', '/speaking-writing/', '/what-i-believe/'];

export default defineConfig({
  site: 'https://amaanomar.com',
  output: 'static',
  trailingSlash: 'ignore',
  integrations: [
    sitemap({ filter: (page) => !NOT_IN_SITEMAP.some((p) => page.endsWith(p)) }),
  ],
});
