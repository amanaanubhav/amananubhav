// npm run palette:emit
// Writes src/_app/styles/tokens.css and src/shared/config/palette.ts from scripts/palette/palette.json (§B.2),
// so the CSS tokens and the WebGL/JS mirror can never drift apart.
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, relative } from 'node:path';

import {
  PALETTE_TS_PATH,
  ROOT,
  TOKENS_CSS_PATH,
  loadPalette,
  renderPaletteTs,
  renderTokensCss,
} from './lib.mjs';

const palette = loadPalette();

for (const [path, text] of [
  [TOKENS_CSS_PATH, renderTokensCss(palette)],
  [PALETTE_TS_PATH, renderPaletteTs(palette)],
]) {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, text, 'utf8');
  console.log(`palette:emit wrote ${relative(ROOT, path).replaceAll('\\', '/')}`);
}
