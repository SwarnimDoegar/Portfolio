import { defineConfig } from 'astro/config';
import icon from 'astro-icon';

export default defineConfig({
  // Served from a custom subdomain at the root. There is deliberately no `base`
  // here: setting one would prefix every asset with a subpath that does not
  // exist on this host.
  site: 'https://portfolio.minraws.click',
  output: 'static',
  trailingSlash: 'ignore',
  integrations: [icon({ include: { lucide: ['*'], 'simple-icons': ['github', 'linkedin'] } })],
});
