import fsd from '@feature-sliced/steiger-plugin';
import { defineConfig } from 'steiger';

export default defineConfig([
  ...fsd.configs.recommended,
  {
    rules: {
      // @feature-sliced/filesystem 3.1 maps the `_app` / `_pages` folders to the app / pages layers
      // (Next.js reserves `app` and `pages`), but this rule compares raw folder names and would flag them.
      'fsd/typo-in-layer-name': 'off',
    },
  },
]);
