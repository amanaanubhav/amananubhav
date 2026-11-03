// npm run check:colors [-- <paths...>]          (default paths: src app tailwind.config.ts)
// Fails (exit 1) on any literal colour in source; every colour must come from the palette tokens (PALETTE-SPEC §6, R26).
// Reported as `file:line: match  [kind]`, then a count per file. Kinds:
//   hex        #rgb, #rgba, #rrggbb, #rrggbbaa in CSS values and in script strings
//   function   rgb() rgba() hsl() hsla() hwb() lab() lch() oklab() oklch() color() with literal channels
//              (rgb(var(--c-x) / 0.5), rgb(var(--c-x) / var(--alpha-y)) and template-interpolated channels are fine)
//   named      CSS colour keywords used as colours (white, black, red, ...) in CSS values, and in script strings
//              that sit in a colour position (fill=, stroke=, style colour keys, fillStyle =, new Color(...));
//              transparent, currentColor, inherit, none and the forced-colors system colours are fine
//   triplet    a custom property holding a bare literal triplet (--x: 18, 19, 22)
//   tailwind   a default-palette class (text-white, bg-black/60, border-zinc-800, hover:from-cyan-400, ...)
//   arbitrary  an arbitrary colour value (bg-[#123456], text-[rgb(1,2,3)], [color:white], shadow-[0_0_4px_#000])
// Allowed: the generated files (tokens.css, tailwind-colors.json, palette.ts), scripts/palette/**, and any line with
// a `palette-allow: <reason>` comment on the same or the previous line (for true exceptions: mask luminance, canvas
// compositing). In CSS a pragma on the line before a declaration covers the whole declaration.
// Flags: --summary (counts only), --quiet (exit code only).
import { readFileSync } from 'node:fs';

import { scanBans } from './bans.mjs';
import { PALETTE_TS_PATH, TAILWIND_COLORS_PATH, TOKENS_CSS_PATH } from './lib.mjs';
import {
  HOLE,
  SCRIPT_EXTS,
  collectFiles,
  cssFunctions,
  cssStatements,
  isColourContext,
  lineIndex,
  pragmaLines,
  rel,
  scriptStrings,
  splitTopLevel,
  tailwindUtility,
  topLevelIndex,
} from './scan.mjs';

const DEFAULT_PATHS = ['src', 'app', 'tailwind.config.ts'];
const GENERATED = new Set([TOKENS_CSS_PATH, PALETTE_TS_PATH, TAILWIND_COLORS_PATH].map(rel));
const isAllowlisted = (path) => GENERATED.has(path) || path.startsWith('scripts/palette/');

// prettier-ignore
const NAMED = new Set(('aliceblue antiquewhite aqua aquamarine azure beige bisque black blanchedalmond blue blueviolet brown burlywood ' +
  'cadetblue chartreuse chocolate coral cornflowerblue cornsilk crimson cyan darkblue darkcyan darkgoldenrod darkgray darkgreen ' +
  'darkgrey darkkhaki darkmagenta darkolivegreen darkorange darkorchid darkred darksalmon darkseagreen darkslateblue darkslategray ' +
  'darkslategrey darkturquoise darkviolet deeppink deepskyblue dimgray dimgrey dodgerblue firebrick floralwhite forestgreen fuchsia ' +
  'gainsboro ghostwhite gold goldenrod gray green greenyellow grey honeydew hotpink indianred indigo ivory khaki lavender ' +
  'lavenderblush lawngreen lemonchiffon lightblue lightcoral lightcyan lightgoldenrodyellow lightgray lightgreen lightgrey lightpink ' +
  'lightsalmon lightseagreen lightskyblue lightslategray lightslategrey lightsteelblue lightyellow lime limegreen linen magenta ' +
  'maroon mediumaquamarine mediumblue mediumorchid mediumpurple mediumseagreen mediumslateblue mediumspringgreen mediumturquoise ' +
  'mediumvioletred midnightblue mintcream mistyrose moccasin navajowhite navy oldlace olive olivedrab orange orangered orchid ' +
  'palegoldenrod palegreen paleturquoise palevioletred papayawhip peachpuff peru pink plum powderblue purple rebeccapurple red ' +
  'rosybrown royalblue saddlebrown salmon sandybrown seagreen seashell sienna silver skyblue slateblue slategray slategrey snow ' +
  'springgreen steelblue tan teal thistle tomato turquoise violet wheat white whitesmoke yellow yellowgreen').split(' '));

/** CSS properties whose identifiers are never colours (names of fonts, animations, grid areas, counters, ...). */
const NON_COLOUR_PROPS = /^(?:content|quotes|font|font-family|animation|animation-name|transition|transition-property|will-change|grid-area|grid-template-areas|grid-template|grid-row|grid-column|container|container-name|view-transition-name|view-transition-class|counter-reset|counter-increment|counter-set|list-style|list-style-type|composes|anchor-name|position-anchor|timeline-scope|scroll-timeline|scroll-timeline-name|view-timeline|view-timeline-name|animation-timeline|font-feature-settings|font-variation-settings)$/;

const HEX_RE = /#(?:[0-9a-fA-F]{8}|[0-9a-fA-F]{6}|[0-9a-fA-F]{3,4})(?![\w-])/g;
const NAMED_RE = /(?<![\w$.#-])([A-Za-z]+)(?![\w(-])/g;
const COLOUR_FN_RE = /(?<![\w$.-])(rgba?|hsla?|hwb|oklch|oklab|lab|lch|color)\(/gi;
const COLOR_SPACES = /^\s*(?:srgb|srgb-linear|display-p3|a98-rgb|prophoto-rgb|rec2020|xyz|xyz-d50|xyz-d65)\b/i;
const TW_COLOR_UTIL = '(?:bg|text|border(?:-[xytrblse])?|divide|outline|ring(?:-offset)?|shadow|accent|caret|fill|stroke|decoration|placeholder|from|via|to)';
const TW_DEFAULT_RE = new RegExp(
  `^${TW_COLOR_UTIL}-(?:(?:slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)-(?:50|[1-9]00|950)|white|black)(?:\\/(?:\\d+(?:\\.\\d+)?|\\[[^\\]]*\\]))?$`,
);
const TW_COLOR_ARBITRARY_RE = new RegExp(`^${TW_COLOR_UTIL}-\\[`);
const ARBITRARY_COLOR_PROP_RE = /^\[(?:color|background(?:-color|-image)?|border(?:-[a-z]+)*-color|border|fill|stroke|outline(?:-color)?|box-shadow|text-shadow|caret-color|accent-color|text-decoration-color|--[\w-]+|mask(?:-image)?|-webkit-mask(?:-image)?)\s*:/;
const CSS_LIKE_RE = /(?:rgba?\(|hsla?\(|okl(?:ch|ab)\(|var\(--|\d(?:\.\d+)?(?:px|rem|em|%|deg)\b|\b(?:solid|dashed|dotted|double|inset)\b|gradient\()/i;
const TRIPLET_RE = /^\s*\d{1,3}(?:\s*,\s*|\s+)\d{1,3}(?:\s*,\s*|\s+)\d{1,3}\s*$/;
const EMBEDDED_RE = /(?:^|[\s;{"'])(fill|stroke|stop-color|flood-color|lighting-color|color|background(?:-color)?|border(?:-[a-z]+)?-color|outline-color)\s*[:=]\s*['"]?([A-Za-z]+)\b/g;
const SHORTHAND_RE = /\b(?:solid|dashed|dotted|double|groove|ridge|inset|outset|\d+(?:\.\d+)?(?:px|rem|em))\s+(?=([A-Za-z]+)\b)/g;
const CSS_COLOUR_HOLDERS = /(?<![\w$.-])((?:repeating-)?(?:linear|radial|conic)-gradient|color-mix|drop-shadow)\(/gi;

/** Colour functions (rgb(), hsl(), oklch(), color(), ...) with balanced arguments. */
const colourFunctions = (text) => cssFunctions(text, COLOUR_FN_RE);

/** True when a colour function's channels are literal numbers (not var(), not an interpolation, not relative syntax). */
function hasLiteralChannels({ name, args }) {
  if (name === 'color' && !COLOR_SPACES.test(args)) return false;
  const slash = topLevelIndex(args, '/');
  // The alpha is not a channel: after a slash, or the 4th argument of the legacy comma syntax, so
  // `rgba(0, 0, 0, ${alpha})` keeps its literal channels and is reported.
  const commas = slash >= 0 ? [] : splitTopLevel(args);
  const channels = slash >= 0 ? args.slice(0, slash) : commas.length > 3 ? commas.slice(0, 3).join(',') : args;
  if (/var\(|env\(|calc\(|\bfrom\b/i.test(channels) || channels.includes(HOLE)) return false;
  return /\d|\bnone\b/.test(channels);
}

/** Every literal colour in a piece of CSS-like text (a declaration value, an arbitrary value). */
function cssValueFindings(value, { named = true } = {}) {
  const found = [];
  HEX_RE.lastIndex = 0;
  let m;
  while ((m = HEX_RE.exec(value))) {
    const before = value.slice(0, m.index);
    if (/[\w&%-]$/.test(before) || /url\(\s*['"]?$/i.test(before)) continue;
    found.push({ index: m.index, match: m[0], kind: 'hex' });
  }
  for (const fn of colourFunctions(value)) if (hasLiteralChannels(fn)) found.push({ index: fn.index, match: fn.text, kind: 'function' });
  if (named) {
    // quoted strings (font names, content) and url(...) never hold colour keywords
    const bare = value.replace(/(["'])(?:\\.|(?!\1).)*\1|url\([^)]*\)/g, (s) => ' '.repeat(s.length));
    NAMED_RE.lastIndex = 0;
    while ((m = NAMED_RE.exec(bare))) {
      if (NAMED.has(m[1].toLowerCase())) found.push({ index: m.index, match: m[1], kind: 'named' });
    }
  }
  return found;
}

/** Literal colours in one Tailwind class token (default palette classes and arbitrary colour values). */
function tailwindFindings(token) {
  if (token.includes(HOLE)) return [];
  const utility = tailwindUtility(token);
  if (TW_DEFAULT_RE.test(utility)) return [{ match: token, kind: 'tailwind' }];
  const open = utility.indexOf('[');
  if (open < 0) return [];
  const close = utility.lastIndexOf(']');
  if (close < open) return [];
  const inner = utility.slice(open + 1, close).replaceAll('_', ' ');
  const named = TW_COLOR_ARBITRARY_RE.test(utility) || ARBITRARY_COLOR_PROP_RE.test(utility);
  const isProperty = utility.startsWith('[');
  const value = isProperty ? inner.slice(topLevelIndex(inner, ':') + 1) : inner;
  return cssValueFindings(value, { named }).length ? [{ match: token, kind: 'arbitrary' }] : [];
}

function scanCss(text, lineOf) {
  const findings = [];
  for (const statement of cssStatements(text)) {
    if (statement.type === 'decl') {
      const declLine = lineOf(statement.start);
      if (statement.prop.startsWith('--') && TRIPLET_RE.test(statement.value)) {
        findings.push({ line: lineOf(statement.valueStart), match: `${statement.prop}: ${statement.value.trim()}`, kind: 'triplet', declLine });
      }
      const named = !NON_COLOUR_PROPS.test(statement.prop);
      for (const f of cssValueFindings(statement.value, { named })) {
        findings.push({ line: lineOf(statement.valueStart + f.index), match: f.match, kind: f.kind, declLine });
      }
    } else if (statement.type === 'at' && /^@apply\s/.test(statement.text)) {
      for (const token of statement.text.slice(6).trim().split(/\s+/)) {
        for (const f of tailwindFindings(token)) findings.push({ line: lineOf(statement.start), match: f.match, kind: f.kind });
      }
    }
  }
  return findings;
}

function scanScript(path, text, lineOf) {
  const findings = [];
  for (const literal of scriptStrings(path, text)) {
    const { value, context } = literal;
    const startLine = lineOf(literal.start);
    const at = (index) => startLine + (value.slice(0, Math.max(0, index)).match(/\n/g)?.length ?? 0);
    const colourContext = isColourContext(context);
    const anchor =
      /^(?:href|to|id|htmlFor|xlinkHref|src|aria-[\w-]+|data-[\w-]+)$/.test(context.attr ?? '') ||
      /^(?:href|to|id|url|path|hash|anchor|slug|src)$/i.test(context.key ?? '');
    const urlLike = /^(?:[a-z][a-z+.-]*:\/\/|mailto:|tel:)/i.test(value.trim());
    // Tailwind class tokens first (any string: className, cn(), cva(), constants); raw matches inside a token that is
    // already reported as a class are not reported twice
    const tokenSpans = [];
    let offset = 0;
    for (const token of value.split(/(\s+)/)) {
      if (token && !/^\s+$/.test(token)) {
        for (const f of tailwindFindings(token)) {
          findings.push({ line: at(offset), match: f.match, kind: f.kind, literalLine: startLine });
          tokenSpans.push([offset, offset + token.length]);
        }
      }
      offset += token.length;
    }
    const inToken = (index) => tokenSpans.some(([from, to]) => index >= from && index < to);
    const push = (index, match, kind) => {
      if (!inToken(index)) findings.push({ line: at(index), match, kind, literalLine: startLine });
    };
    // hex: 6 and 8 digits anywhere; 3 and 4 digits only where the string reads as a colour (not "Issue #123")
    HEX_RE.lastIndex = 0;
    let m;
    while ((m = HEX_RE.exec(value))) {
      const before = value.slice(0, m.index);
      if (anchor || urlLike || /[\w&%/-]$/.test(before) || /url\(\s*['"]?$/i.test(before)) continue;
      const short = m[0].length <= 5;
      if (short && !(value.trim() === m[0] || colourContext || CSS_LIKE_RE.test(value))) continue;
      push(m.index, m[0], 'hex');
    }
    for (const fn of colourFunctions(value)) if (hasLiteralChannels(fn)) push(fn.index, fn.text, 'function');
    if (colourContext) {
      const bare = value.replace(/url\([^)]*\)/g, (s) => ' '.repeat(s.length));
      NAMED_RE.lastIndex = 0;
      while ((m = NAMED_RE.exec(bare))) if (NAMED.has(m[1].toLowerCase())) push(m.index, m[1], 'named');
    } else {
      // markup or CSS written inside a string: <path stroke='black'>, style="color: white", '1px solid red',
      // '0 0 4px black', 'linear-gradient(black, transparent)'
      for (const re of [EMBEDDED_RE, SHORTHAND_RE]) {
        re.lastIndex = 0;
        while ((m = re.exec(value))) {
          const word = m[m.length - 1];
          if (NAMED.has(word.toLowerCase())) push(m.index, re === EMBEDDED_RE ? `${m[1]}: ${word}` : `${m[0].trim()} ${word}`, 'named');
        }
      }
      for (const fn of cssFunctions(value, CSS_COLOUR_HOLDERS)) {
        NAMED_RE.lastIndex = 0;
        while ((m = NAMED_RE.exec(fn.args))) if (NAMED.has(m[1].toLowerCase())) push(fn.index, m[1], 'named');
      }
    }
  }
  return findings;
}

// ---------------------------------------------------------------------------------------------------------------------
const args = process.argv.slice(2);
const flags = new Set(args.filter((a) => a.startsWith('--')));
const unknown = [...flags].filter((f) => !['--summary', '--quiet'].includes(f));
if (unknown.length) {
  console.error(`check:colors: unknown flag ${unknown.join(', ')} (use --summary or --quiet)`);
  process.exit(2);
}
const paths = args.filter((a) => !a.startsWith('--'));
let files;
try {
  files = collectFiles(paths.length ? paths : DEFAULT_PATHS);
} catch (err) {
  console.error(`check:colors: ${err.message}`);
  process.exit(2);
}

// Pragmas can also allow a check:palette ban (a graphics-only role as an SVG's currentColor, bans.mjs); those are used.
const banAllowedLines = new Map();
for (const hit of scanBans(files).allowed) {
  const m = /^(.*):(\d+): /.exec(hit);
  if (!m) continue;
  if (!banAllowedLines.has(m[1])) banAllowedLines.set(m[1], new Set());
  banAllowedLines.get(m[1]).add(Number(m[2]));
}

const perFile = new Map();
const lines = [];
const notes = [];
let scanned = 0;
for (const abs of files) {
  const path = rel(abs);
  if (isAllowlisted(path)) continue;
  scanned++;
  const text = readFileSync(abs, 'utf8');
  const lineOf = lineIndex(text);
  const { pragmas, allowedBy, missingReason } = pragmaLines(text);
  for (const line of missingReason) notes.push(`${path}:${line}: palette-allow pragma without a reason (it allows nothing)`);
  const usedPragmas = new Set();
  const isScript = SCRIPT_EXTS.has(abs.slice(abs.lastIndexOf('.')));
  let raw;
  try {
    raw = isScript ? scanScript(abs, text, lineOf) : scanCss(text, lineOf);
  } catch (err) {
    console.error(`check:colors: could not parse ${path}: ${err.message}`);
    process.exit(2);
  }
  const kept = [];
  for (const f of raw) {
    // a pragma covers its own line and the next; before a CSS declaration or a script literal it covers all of it
    const pragma = allowedBy(f.line) || allowedBy(f.declLine ?? f.literalLine ?? 0);
    if (pragma) usedPragmas.add(pragma);
    else kept.push(f);
  }
  for (const line of banAllowedLines.get(path) ?? []) usedPragmas.add(allowedBy(line));
  for (const line of pragmas) {
    if (!usedPragmas.has(line)) notes.push(`${path}:${line}: palette-allow pragma allows nothing here (remove it)`);
  }
  if (kept.length) {
    perFile.set(path, kept.length);
    for (const f of kept.sort((a, b) => a.line - b.line)) {
      const match = f.match.length > 90 ? `${f.match.slice(0, 87)}...` : f.match;
      lines.push(`${path}:${f.line}: ${match.replace(/\s+/g, ' ')}  [${f.kind}]`);
    }
  }
}

const total = [...perFile.values()].reduce((sum, n) => sum + n, 0);
if (!flags.has('--quiet')) {
  if (!flags.has('--summary')) for (const line of lines) console.log(line);
  if (perFile.size) {
    console.log(`\nLiteral colours per file (${perFile.size} file(s)):`);
    for (const [path, n] of [...perFile.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))) {
      console.log(`${String(n).padStart(5)}  ${path}`);
    }
  }
  for (const note of notes) console.log(`note: ${note}`);
}
if (total) {
  if (!flags.has('--quiet')) {
    console.error(`\ncheck:colors FAILED: ${total} literal colour(s) in ${perFile.size} file(s) (${scanned} scanned). Use palette tokens; see CORE-CONTRACT.md.`);
  }
  process.exit(1);
}
if (!flags.has('--quiet')) console.log(`check:colors passed: no literal colours in ${scanned} file(s).`);
