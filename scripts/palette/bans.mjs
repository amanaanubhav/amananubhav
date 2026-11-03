// The source bans of check:palette (PALETTE-SPEC §8.3.4, R12). Dev-only.
// 1. Graphics-only roles never colour text: text-signal-line, text-accent-2-line, text-aqua-line, text-bronze(-N), their
//    aliases (map-route, chart-highlight, map-branch, live, scene-ripple, read from palette.json) and the placeholder-
//    forms, in classes, @apply, CSS `color` / `-webkit-text-fill-color` and inline style colour keys.
//    A `palette-allow: <reason>` comment on the same or previous line allows a true exception (for example an SVG that
//    strokes with currentColor); allowed hits are listed.
// 2. No gradient text: background-clip: text, -webkit-background-clip: text, bg-clip-text, backgroundClip: 'text' are
//    allowed only on the terminal Alpenglow label (the neutral sheen-label shimmer). No pragma can allow them.
// 3. R12 (no glow): zero-offset blurred shadows in CSS (box-shadow, text-shadow, drop-shadow()); check:palette fails on
//    them since the integration gate (inset rings are not glows).
import { readFileSync } from 'node:fs';
import { extname, resolve } from 'node:path';

import { ROOT } from './lib.mjs';
import {
  SCRIPT_EXTS,
  cssFunctions,
  cssStatements,
  lineIndex,
  pragmaLines,
  rel,
  scriptStrings,
  splitTopLevel,
  tailwindUtility,
} from './scan.mjs';

/** The graphics-only roles (PALETTE-SPEC §5.1). Their aliases are found in palette.json below. */
const GRAPHICS_ONLY_BASE = ['signal-line', 'accent-2-line', 'aqua-line', 'bronze-200', 'bronze-400', 'bronze-600', 'bronze-800', 'bronze', 'action-line', 'oxblood-deep', 'steel'];

/**
 * Every extended token that is an alias (in either theme, through any chain) of a graphics-only role: map-route and
 * chart-highlight (signal-line), map-branch (accent-2-line), live and scene-ripple (aqua-line), bronze (bronze-N).
 * They inherit the ban, so a new alias of a line colour is never a back door to graphics as text.
 */
function graphicsOnlyNames() {
  const palette = JSON.parse(readFileSync(resolve(ROOT, 'scripts/palette/palette.json'), 'utf8'));
  const aliasOf = new Map();
  for (const theme of ['night', 'day']) {
    for (const group of Object.values(palette.extended?.[theme] ?? {})) {
      for (const [name, value] of Object.entries(group)) {
        const m = typeof value === 'string' && /^var\(--([\w-]+)\)$/.exec(value);
        if (m) aliasOf.set(`${theme}:${name}`, `${theme}:${m[1]}`);
      }
    }
  }
  const names = new Set(GRAPHICS_ONLY_BASE);
  for (const [key] of aliasOf) {
    const seen = new Set();
    for (let k = key; aliasOf.has(k) && !seen.has(k); k = aliasOf.get(k)) {
      seen.add(k);
      if (names.has(aliasOf.get(k).split(':')[1])) names.add(key.split(':')[1]);
    }
  }
  return [...names].sort((a, b) => b.length - a.length);
}
const NAMES = graphicsOnlyNames().map((n) => n.replace(/[-]/g, '\\-')).join('|');
const GRAPHICS_ONLY = new RegExp(`^(?:${NAMES})$`);
const GRAPHICS_ONLY_VAR = new RegExp(`var\\(--(?:c-)?(?:${NAMES})\\)`);
const TEXT_CLASS = /^(?:text|placeholder)-(.+?)(?:\/[\w.[\]()-]+)?$/;
const DROP_SHADOW = /(?<![\w-])(drop-shadow)\(/gi;
/** A script can only hit a ban if its raw text holds one of these, so only those scripts are parsed. */
const SCRIPT_PREFILTER = new RegExp(`(?:text|placeholder)-(?:${NAMES})|bg-clip-text|[bB]ackgroundClip|--(?:c-)?(?:${NAMES})`);

/** The one place gradient text is allowed: the terminal Alpenglow label (PALETTE-SPEC §5.5). */
export const GRADIENT_TEXT_HOME = { file: 'src/features/ai-terminal/ui/TerminalOverlay.module.css', selector: /label/i };

/**
 * Gradient text that a migration retires, tolerated and reported until then. Empty since the integration gate: the
 * footer wordmark is solid ink now, so any gradient text outside GRADIENT_TEXT_HOME fails check:palette.
 */
export const PENDING_GRADIENT_TEXT = {};

/** Zero-offset blurred layers of a shadow value (`0 0 4px <colour>`), skipping inset rings. */
function glowLayers(prop, value) {
  const layers = prop.includes('filter') ? cssFunctions(value, DROP_SHADOW).map((fn) => fn.args) : splitTopLevel(value);
  return layers.filter((layer) => {
    if (/\binset\b/.test(layer)) return false;
    const m = /^\s*(-?[\d.]+)(?:px|rem|em)?\s+(-?[\d.]+)(?:px|rem|em)?\s+([\d.]+)(?:px|rem|em)?/.exec(layer);
    return Boolean(m) && Number(m[1]) === 0 && Number(m[2]) === 0 && Number(m[3]) > 0;
  });
}

/** Scans files for the bans. Returns { bans, allowed, pending, glows }, each a list of `path:line: what` strings. */
export function scanBans(files) {
  const out = { bans: [], allowed: [], pending: [], glows: [] };
  for (const abs of files) {
    const path = rel(abs);
    const text = readFileSync(abs, 'utf8');
    const lineOf = lineIndex(text);
    const { allowedBy } = pragmaLines(text);
    const graphicsAsText = (line, what) => (allowedBy(line) ? out.allowed : out.bans).push(`${path}:${line}: ${what}`);
    const gradientText = (line, what, selector = '') => {
      if (path === GRADIENT_TEXT_HOME.file && GRADIENT_TEXT_HOME.selector.test(selector)) return;
      if (PENDING_GRADIENT_TEXT[path]) out.pending.push(`${path}:${line}: ${what} (${PENDING_GRADIENT_TEXT[path]})`);
      else out.bans.push(`${path}:${line}: ${what}: gradient text is allowed only on the terminal Alpenglow label`);
    };
    const classTokens = (value, line) => {
      for (const token of value.split(/\s+/).filter(Boolean)) {
        const utility = tailwindUtility(token);
        const m = TEXT_CLASS.exec(utility);
        if (m && GRAPHICS_ONLY.test(m[1])) graphicsAsText(line, `${token}: ${m[1]} is graphics-only and never colours text`);
        if (utility === 'bg-clip-text') gradientText(line, token);
      }
    };
    if (SCRIPT_EXTS.has(extname(abs))) {
      if (!SCRIPT_PREFILTER.test(text)) continue;
      for (const literal of scriptStrings(abs, text)) {
        const line = lineOf(literal.start);
        classTokens(literal.value, line);
        const key = literal.context.key ?? '';
        if (/^(?:WebkitBackgroundClip|backgroundClip)$/.test(key) && literal.value.trim() === 'text') gradientText(line, `${key}: 'text'`);
        if (/^(?:color|WebkitTextFillColor)$/.test(key) && GRAPHICS_ONLY_VAR.test(literal.value)) {
          graphicsAsText(line, `${key}: '${literal.value}': graphics-only token as text colour`);
        }
      }
      continue;
    }
    for (const s of cssStatements(text)) {
      if (s.type === 'at' && /^@apply\s/.test(s.text)) classTokens(s.text.slice(6), lineOf(s.start));
      if (s.type !== 'decl') continue;
      const line = lineOf(s.start);
      if (/^(?:-webkit-)?background-clip$/.test(s.prop) && /\btext\b/.test(s.value)) gradientText(line, `${s.prop}: ${s.value.trim()}`, s.selector);
      if (/^(?:color|-webkit-text-fill-color)$/.test(s.prop) && GRAPHICS_ONLY_VAR.test(s.value)) {
        graphicsAsText(line, `${s.prop}: ${s.value.trim()}: graphics-only token as text colour`);
      }
      if (/^(?:box-shadow|text-shadow|filter|-webkit-filter)$/.test(s.prop)) {
        for (const layer of glowLayers(s.prop, s.value)) {
          const shown = layer.trim().replace(/\s+/g, ' ');
          out.glows.push(`${path}:${line}: ${s.prop}: ${s.prop.includes('filter') ? `drop-shadow(${shown})` : shown}`);
        }
      }
    }
  }
  return out;
}
