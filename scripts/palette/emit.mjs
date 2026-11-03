// npm run palette:emit
// Writes src/_app/styles/tokens.css, src/shared/config/palette.ts and src/_app/styles/tailwind-colors.json from
// scripts/palette/palette.json (PALETTE-SPEC §8), so the CSS tokens, the WebGL/JS mirror and the Tailwind colours can
// never drift apart. loadPalette() validates the file first and stops with a readable list of problems.
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, relative } from 'node:path';

import { ROOT, generatedFiles, loadPalette } from './lib.mjs';

const palette = loadPalette();

for (const [path, text] of generatedFiles(palette)) {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, text, 'utf8');
  console.log(`palette:emit wrote ${relative(ROOT, path).replaceAll('\\', '/')}`);
}
