// @ts-check
import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';

// Deployed as a GitHub Pages <project> site at https://andresguc1.github.io/hal-test/.
// If a custom domain (e.g. blog.haltest.com + CNAME) is added later:
//   - set `site` to the custom domain and `base` to '/'
//   - add a public/CNAME file with the domain
export default defineConfig({
  site: 'https://andresguc1.github.io',
  base: '/hal-test',
  integrations: [mdx(), sitemap()],
});