// Source scanning shared by the palette guards (check-literals.mjs, and the bans in check.mjs). Dev-only.
// Scripts are parsed with the repo's TypeScript (string and template literals with their syntactic context; comments
// and JSX text are never scanned). CSS is split into statements (declarations, rule preludes, at-rules) after its
// comments are blanked, so selectors such as `#id` or `a:hover` are never read as colours.
import { readdirSync, statSync } from 'node:fs';
import { createRequire } from 'node:module';
import { extname, isAbsolute, join, relative, resolve } from 'node:path';

import { ROOT } from './lib.mjs';

const require = createRequire(import.meta.url);
let typescript = null;
const ts = () => (typescript ??= require('typescript'));

export const SCRIPT_EXTS = new Set(['.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs', '.mts', '.cts']);
export const STYLE_EXTS = new Set(['.css', '.scss']);
const SKIP_DIRS = new Set(['node_modules', '.next', '.git', '.vercel', '.turbo', 'out', 'build', 'dist', 'coverage']);

/** Repo-relative POSIX path. */
export const rel = (abs) => relative(ROOT, abs).replaceAll('\\', '/');

/** Script and style files under the given paths (files or folders; relative to the cwd, or absolute). */
export function collectFiles(paths) {
  const out = new Set();
  const walk = (abs) => {
    let stat;
    try {
      stat = statSync(abs);
    } catch {
      throw new Error(`no such file or folder: ${abs}`);
    }
    if (stat.isDirectory()) {
      for (const name of readdirSync(abs)) {
        if (SKIP_DIRS.has(name)) continue;
        walk(join(abs, name));
      }
    } else if (stat.isFile()) {
      const ext = extname(abs);
      if ((SCRIPT_EXTS.has(ext) || STYLE_EXTS.has(ext)) && !abs.endsWith('.d.ts')) out.add(abs);
    }
  };
  for (const path of paths) walk(isAbsolute(path) ? path : resolve(process.cwd(), path));
  return [...out].sort();
}

/** offset -> 1-based line number. */
export function lineIndex(text) {
  const starts = [0];
  for (let i = 0; i < text.length; i++) if (text[i] === '\n') starts.push(i + 1);
  return (offset) => {
    let lo = 0;
    let hi = starts.length - 1;
    while (lo < hi) {
      const mid = (lo + hi + 1) >> 1;
      if (starts[mid] <= offset) lo = mid;
      else hi = mid - 1;
    }
    return lo + 1;
  };
}

/**
 * `palette-allow: <reason>` pragmas written in a comment. `pragmas` holds the line of each pragma with a reason;
 * `allowedBy(line)` returns the pragma line that covers `line` (the pragma's own line or the one after it), or 0;
 * `missingReason` lists pragmas without a reason, which allow nothing.
 */
export function pragmaLines(text) {
  const pragmas = new Set();
  const missingReason = [];
  text.split('\n').forEach((line, i) => {
    const m = /(?:\/\/|\/\*)[^\n]*?palette-allow:([^\n]*)/.exec(line);
    if (!m) return;
    const reason = m[1].replace(/\*\/.*$/, '').replace(/\}\s*$/, '').trim();
    if (reason.length < 3) missingReason.push(i + 1);
    else pragmas.add(i + 1);
  });
  const allowedBy = (line) => (pragmas.has(line) ? line : pragmas.has(line - 1) ? line - 1 : 0);
  return { pragmas, allowedBy, missingReason };
}

const COLOUR_CONTEXT = /colou?r|fill|stroke|background|^bg$|border|outline|shadow|tint|^ink$|paper|glow|halo|flood|lighting|caret|accent|mask|^filter$|^--/i;
const COLOUR_CALLS = new Set(['Color', 'setStyle', 'setColorName']);

/** The nearest syntactic owner of a literal that tells whether it is a colour: a JSX attribute, an object key, an
 * assignment target, a call. Walks out through parentheses, conditionals, `??` / `||`, `as`, arrays and templates. */
function contextOf(node) {
  const T = ts();
  let child = node;
  let parent = node.parent;
  while (parent) {
    if (
      T.isParenthesizedExpression(parent) ||
      T.isConditionalExpression(parent) ||
      T.isAsExpression(parent) ||
      T.isSatisfiesExpression?.(parent) ||
      T.isArrayLiteralExpression(parent) ||
      T.isTemplateSpan(parent) ||
      T.isTemplateExpression(parent) ||
      T.isJsxExpression(parent) ||
      (T.isBinaryExpression(parent) &&
        [T.SyntaxKind.QuestionQuestionToken, T.SyntaxKind.BarBarToken, T.SyntaxKind.PlusToken].includes(parent.operatorToken.kind))
    ) {
      child = parent;
      parent = parent.parent;
      continue;
    }
    break;
  }
  if (!parent) return {};
  const nameOf = (name) => (name && (T.isIdentifier(name) || T.isStringLiteral(name) || T.isPrivateIdentifier?.(name)) ? name.text : name?.getText?.() ?? '');
  if (T.isJsxAttribute(parent)) return { attr: nameOf(parent.name) };
  if (T.isPropertyAssignment(parent) && parent.initializer === child) return { key: nameOf(parent.name) };
  if (T.isVariableDeclaration(parent) && parent.initializer === child) return { variable: nameOf(parent.name) };
  if (T.isBinaryExpression(parent) && parent.operatorToken.kind === T.SyntaxKind.EqualsToken && parent.right === child) {
    const left = parent.left;
    return { assign: T.isPropertyAccessExpression(left) ? left.name.text : T.isIdentifier(left) ? left.text : '' };
  }
  if (T.isCallExpression(parent) || T.isNewExpression(parent)) {
    const callee = parent.expression;
    const name = T.isPropertyAccessExpression(callee) ? callee.name.text : T.isIdentifier(callee) ? callee.text : '';
    const args = parent.arguments ?? [];
    return { call: name, argIndex: args.indexOf(child), firstArg: args[0] && T.isStringLiteral(args[0]) ? args[0].text : '' };
  }
  return {};
}

/** True when a literal's context says it holds a colour (so named colours such as `white` count as literals). */
export function isColourContext(context) {
  if (context.attr) return COLOUR_CONTEXT.test(context.attr) && context.attr !== 'className';
  if (context.key) return COLOUR_CONTEXT.test(context.key);
  if (context.assign) return COLOUR_CONTEXT.test(context.assign) || /^(fillStyle|strokeStyle|shadowColor)$/.test(context.assign);
  if (context.call) {
    if (COLOUR_CALLS.has(context.call)) return true;
    if (context.call === 'setProperty' && context.argIndex === 1) return true;
    if (context.call === 'setAttribute' && context.argIndex === 1) return COLOUR_CONTEXT.test(context.firstArg);
  }
  return false;
}

/** U+0000 marks where a template literal's `${...}` expressions were, so an interpolated channel never reads as literal. */
export const HOLE = '\u0000';

/**
 * String and template literals of a script: { value, start, end, context } with `start` / `end` offsets of the
 * literal (quotes included). Template values join their chunks with HOLE. Comments and JSX text are not included.
 */
export function scriptStrings(path, text) {
  const T = ts();
  const ext = extname(path);
  const kind =
    ext === '.tsx' ? T.ScriptKind.TSX : ext === '.jsx' ? T.ScriptKind.JSX : ['.ts', '.mts', '.cts'].includes(ext) ? T.ScriptKind.TS : T.ScriptKind.JS;
  const source = T.createSourceFile(path, text, T.ScriptTarget.Latest, true, kind);
  const out = [];
  const visit = (node) => {
    if (T.isStringLiteral(node) || T.isNoSubstitutionTemplateLiteral(node)) {
      out.push({ value: node.text, start: node.getStart(source), end: node.end, context: contextOf(node) });
    } else if (T.isTemplateExpression(node)) {
      const value = node.head.text + node.templateSpans.map((span) => HOLE + span.literal.text).join('');
      out.push({ value, start: node.getStart(source), end: node.end, context: contextOf(node) });
    }
    T.forEachChild(node, visit);
  };
  visit(source);
  return out;
}

/** CSS text with every comment replaced by spaces (newlines kept), so offsets and line numbers still match. */
export function blankCssComments(text) {
  return text.replace(/\/\*[\s\S]*?(?:\*\/|$)/g, (comment) => comment.replace(/[^\n]/g, ' '));
}

/**
 * Splits CSS into statements, outside strings and parentheses: rule preludes (ending in `{`), declarations
 * (`prop: value`, ending in `;` or `}`) and at-rule statements (`@apply ...;`). Each carries offsets and, for
 * declarations, the innermost enclosing selector.
 */
export function cssStatements(text) {
  const code = blankCssComments(text);
  const out = [];
  const selectors = [];
  let paren = 0;
  let quote = null;
  let start = 0;
  for (let i = 0; i < code.length; i++) {
    const c = code[i];
    if (quote) {
      if (c === '\\') i++;
      else if (c === quote) quote = null;
      continue;
    }
    if (c === '"' || c === "'") quote = c;
    else if (c === '(') paren++;
    else if (c === ')') paren = Math.max(0, paren - 1);
    else if (paren === 0 && (c === '{' || c === '}' || c === ';')) {
      const raw = code.slice(start, i);
      const lead = raw.length - raw.trimStart().length;
      const body = raw.trim();
      const at = start + lead;
      if (c === '{') {
        out.push({ type: 'prelude', text: body, start: at, end: i });
        selectors.push(body);
      } else if (body) {
        if (body.startsWith('@')) out.push({ type: 'at', text: body, start: at, end: i });
        else {
          const colon = topLevelIndex(body, ':');
          if (colon > 0) {
            out.push({
              type: 'decl',
              prop: body.slice(0, colon).trim().toLowerCase(),
              value: body.slice(colon + 1),
              valueStart: at + colon + 1,
              start: at,
              end: i,
              selector: selectors[selectors.length - 1] ?? '',
            });
          }
        }
      }
      if (c === '}') selectors.pop();
      start = i + 1;
    }
  }
  return out;
}

/** Index of `ch` in `text` outside parentheses, brackets and quotes, or -1. */
export function topLevelIndex(text, ch) {
  let depth = 0;
  let quote = null;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (quote) {
      if (c === '\\') i++;
      else if (c === quote) quote = null;
      continue;
    }
    if (c === '"' || c === "'") quote = c;
    else if (c === '(' || c === '[') depth++;
    else if (c === ')' || c === ']') depth--;
    else if (c === ch && depth === 0) return i;
  }
  return -1;
}

/**
 * Calls of CSS functions matched by `re` (a global regex whose group 1 is the function name and which ends at the
 * opening parenthesis), with balanced arguments: [{ name, args, index, text }].
 */
export function cssFunctions(text, re) {
  const out = [];
  re.lastIndex = 0;
  let m;
  while ((m = re.exec(text))) {
    const open = m.index + m[0].length - 1;
    let depth = 0;
    let close = -1;
    for (let i = open; i < text.length; i++) {
      if (text[i] === '(') depth++;
      else if (text[i] === ')' && --depth === 0) {
        close = i;
        break;
      }
    }
    if (close < 0) continue;
    out.push({ name: m[1].toLowerCase(), args: text.slice(open + 1, close), index: m.index, text: text.slice(m.index, close + 1) });
  }
  return out;
}

/** Splits `text` at commas outside parentheses: 'a, rgb(1, 2, 3), b' -> ['a', ' rgb(1, 2, 3)', ' b']. */
export function splitTopLevel(text, ch = ',') {
  const parts = [];
  let rest = text;
  for (let i = topLevelIndex(rest, ch); i >= 0; i = topLevelIndex(rest, ch)) {
    parts.push(rest.slice(0, i));
    rest = rest.slice(i + 1);
  }
  parts.push(rest);
  return parts;
}

/** Splits a Tailwind class token into its variants and utility: 'md:hover:!bg-white/50' -> 'bg-white/50'. */
export function tailwindUtility(token) {
  let depth = 0;
  let last = 0;
  for (let i = 0; i < token.length; i++) {
    const c = token[i];
    if (c === '[') depth++;
    else if (c === ']') depth--;
    else if (c === ':' && depth === 0) last = i + 1;
  }
  return token.slice(last).replace(/^!/, '').replace(/^-/, '');
}
