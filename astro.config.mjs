import { defineConfig } from 'astro/config';
import icon from 'astro-icon';

export default defineConfig({
  site: 'https://swarnimdoegar.github.io',
  base: '/Portfolio',
  output: 'static',
  trailingSlash: 'ignore',
  integrations: [icon({ include: { lucide: ['*'], 'simple-icons': ['github', 'linkedin'] } })],
});
