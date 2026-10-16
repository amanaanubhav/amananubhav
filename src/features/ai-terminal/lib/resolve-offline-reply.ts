import type { OfflineCommand, OfflineEntry, OfflineKnowledge } from '../config/offline-responses';

// The offline CLI's resolver. It only imports types: the command table and texts arrive as `kb`
// from the lazily loaded config chunk, so this file is all the offline logic the initial JS carries.
//
// Order: length cap -> guardrails (refusals) -> command (`projects divert`, aliases, case-insensitive)
// -> keyword table for free text -> "command not found" with edit-distance suggestions.

export interface OfflineContext {
  /** Commands typed this session, oldest first (for `history`). */
  readonly history: readonly string[];
}

export type LocalCommand = 'clear' | 'history' | 'exit';

const MAX_QUERY_CHARS = 500;
const MAX_REDIRECTS = 2;
const HISTORY_SHOWN = 20;
/** Two-word questions ("what's this") get the not-in-my-notes reply, not "command not found". */
const QUESTION = /^(what|what's|whats|who|who's|where|why|how|when|which|is|are|do|does|did|can|could|tell|why's)$/;
const FILLER = new Set(['to', 'the', 'my', 'your', 'me', 'about', 'page', 'section', 'a', 'an', 'please', 'on', 'for', 'of', 'at', 'in']);
const INVISIBLE = /[​-‏‪-‮⁠-⁤﻿]/g;
const CONTROL = /[\u0000-\u001F\u007F-\u009F]/g;
const LOCAL: Readonly<Record<string, LocalCommand>> = {
  clear: 'clear',
  cls: 'clear',
  history: 'history',
  hist: 'history',
  exit: 'exit',
  quit: 'exit',
  logout: 'exit',
  close: 'exit',
};

/** Lower-cased, accent-free, single-spaced; a leading prompt (`>`, `$`, `/`) and trailing punctuation go. */
export function normalizeQuery(query: string): string {
  return query
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(INVISIBLE, '')
    .replace(CONTROL, ' ')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/^[>$#%/\s]+/, '')
    .replace(/[\s?!.,;:]+$/, '');
}

/** Commands the session runs itself, online or offline (they need the log, not knowledge). */
export function matchLocalCommand(query: string): LocalCommand | null {
  return LOCAL[normalizeQuery(query)] ?? null;
}

export function formatHistory(history: readonly string[]): string {
  if (history.length === 0) return 'No commands yet.';
  const start = Math.max(0, history.length - HISTORY_SHOWN);
  return history
    .slice(start)
    .map((cmd, i) => `${String(start + i + 1).padStart(4)}  ${cmd}`)
    .join('\n');
}

const keyOf = (s: string): string => s.replace(/[^a-z0-9]/g, '');

export function editDistance(a: string, b: string): number {
  const row = Array.from({ length: b.length + 1 }, (_, j) => j);
  for (let i = 1; i <= a.length; i++) {
    let diagonal = row[0] ?? 0;
    row[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const above = row[j] ?? 0;
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      row[j] = Math.min(above + 1, (row[j - 1] ?? 0) + 1, diagonal + cost);
      diagonal = above;
    }
  }
  return row[b.length] ?? 0;
}

/** Up to three canonical names within a length-scaled edit distance (prefixes count as close). */
function suggest(word: string, candidates: readonly (readonly string[])[]): string[] {
  const limit = word.length <= 4 ? 1 : word.length <= 8 ? 2 : 3;
  const scored: { name: string; score: number }[] = [];
  for (const names of candidates) {
    const [name] = names;
    if (!name) continue;
    let score = Infinity;
    for (const candidate of names) {
      const prefix = word.length >= 2 && candidate.startsWith(word) ? 1 : Infinity;
      score = Math.min(score, prefix, editDistance(word, candidate));
    }
    if (score <= limit) scored.push({ name, score });
  }
  return scored
    .sort((x, y) => x.score - y.score || x.name.localeCompare(y.name))
    .slice(0, 3)
    .map((s) => s.name);
}

const namesOf = (cmd: OfflineCommand): readonly string[] => [cmd.name, ...(cmd.aliases ?? [])];

function findCommand(kb: OfflineKnowledge, word: string): OfflineCommand | undefined {
  const exact = kb.commands.find((cmd) => namesOf(cmd).includes(word));
  if (exact) return exact;
  const key = keyOf(word);
  return key ? kb.commands.find((cmd) => namesOf(cmd).some((name) => keyOf(name) === key)) : undefined;
}

function findEntry(entries: readonly OfflineEntry[], arg: string): OfflineEntry | undefined {
  const key = keyOf(arg);
  return key ? entries.find((entry) => entry.names.some((name) => keyOf(name) === key)) : undefined;
}

/** Drops leading filler ("the", "to", "about") but always keeps the last word. */
function stripFiller(words: readonly string[]): string[] {
  let i = 0;
  while (i < words.length - 1 && FILLER.has(words[i] ?? '')) i++;
  return words.slice(i);
}

function keywordFor(kb: OfflineKnowledge, text: string): string | undefined {
  return kb.keywords.find((keyword) => keyword.pattern.test(text))?.run;
}

function columns(names: readonly string[]): string {
  const rows: string[] = [];
  for (let i = 0; i < names.length; i += 4) {
    rows.push(
      names
        .slice(i, i + 4)
        .map((name) => name.padEnd(12))
        .join('')
        .trimEnd(),
    );
  }
  return rows.join('\n');
}

class Resolver {
  private readonly kb: OfflineKnowledge;
  private readonly ctx: OfflineContext;

  constructor(kb: OfflineKnowledge, ctx: OfflineContext) {
    this.kb = kb;
    this.ctx = ctx;
  }

  /** Runs a command line; `null` when its first word is not a command. */
  line(text: string, depth: number): string | null {
    const [head = '', ...args] = text.split(' ');
    const cmd = findCommand(this.kb, head.replace(/[:,]+$/, ''));
    return cmd ? this.command(cmd, args, depth) : null;
  }

  /** Free text through the keyword table, then the command a keyword points to. */
  redirect(text: string, depth: number): string | null {
    if (depth > MAX_REDIRECTS) return null;
    const run = keywordFor(this.kb, text);
    return run ? this.line(run, depth + 1) : null;
  }

  command(cmd: OfflineCommand, args: readonly string[], depth: number): string {
    const rest = stripFiller(args);
    const arg = rest.join(' ');
    switch (cmd.builtin) {
      case 'help':
        return this.help(arg);
      case 'ls':
        return this.ls(arg);
      case 'cat':
        return this.cat(rest, depth);
      case 'open':
        return this.open(arg);
      case 'history':
        return formatHistory(this.ctx.history);
      case 'clear':
        return "Type 'clear' on its own to wipe the screen.";
      case 'exit':
        return "Type 'exit' on its own to close the terminal, or press Esc.";
      default:
        break;
    }

    if (cmd.entries) {
      if (!arg) return cmd.text;
      const entry = findEntry(cmd.entries, arg);
      if (entry) return entry.text;
      const redirected = this.redirect(arg, depth);
      if (redirected) return redirected;
      const near = suggest(keyOf(arg), cmd.entries.map((e) => e.names));
      const hint = near.length > 0 ? ` Did you mean: ${near.join(', ')}?` : '';
      const all = cmd.entries.map((e) => e.names[0]).join(', ');
      return `${cmd.name}: no entry '${arg.slice(0, 40)}'.${hint}\nTry: ${all}`;
    }

    if (arg && cmd.followArgs) return this.redirect(arg, depth) ?? cmd.text;
    if (arg && cmd.section) {
      // `about divert` reads as a question about DIVERT; `remote work` stays on remote.
      const run = keywordFor(this.kb, arg);
      if (run?.includes(' ')) return this.line(run, depth + 1) ?? cmd.text;
    }
    return cmd.text;
  }

  help(arg: string): string {
    const help = this.kb.commands.find((cmd) => cmd.builtin === 'help')?.text ?? '';
    const target = arg ? findCommand(this.kb, arg) : undefined;
    if (!target || target.builtin === 'help') return help;
    const rows = [`${target.name}${target.entries ? ' [name]' : ''}`];
    if (target.aliases?.length) rows.push(`aliases: ${target.aliases.join(', ')}`);
    if (target.entries) rows.push(`names: ${target.entries.map((e) => e.names[0]).join(', ')}`);
    return rows.join('\n');
  }

  ls(arg: string): string {
    if (!arg) {
      const sections = this.kb.commands.filter((cmd) => cmd.section).map((cmd) => cmd.name);
      return `${columns(sections)}\n\nType 'cat <section>', or just the name.`;
    }
    const target = findCommand(this.kb, arg.split(' ')[0] ?? '');
    if (target?.entries) return columns(target.entries.flatMap((e) => (e.names[0] ? [e.names[0]] : [])));
    if (target?.section) return target.name;
    return `ls: cannot access '${arg.slice(0, 40)}': no such section. Type 'ls'.`;
  }

  cat(rest: readonly string[], depth: number): string {
    const [head, ...more] = rest;
    if (!head) return "usage: cat <section>. Type 'ls' for sections.";
    const target = findCommand(this.kb, head);
    if (target && !target.builtin && !target.hidden) return this.command(target, more, depth);
    return this.redirect(rest.join(' '), depth) ?? `cat: ${rest.join(' ').slice(0, 40)}: no such section. Type 'ls'.`;
  }

  open(arg: string): string {
    const pages = this.kb.pages;
    const list = `Pages: ${pages.map((p) => p.names[0]).join(', ')}`;
    if (!arg) return `usage: open <page>\n${list}`;
    const key = keyOf(arg);
    const page = pages.find((p) => p.names.some((name) => name === arg || (key !== '' && keyOf(name) === key)));
    if (page) return `${page.path}\n${this.kb.replies.openNote}`;
    const near = suggest(key, pages.map((p) => p.names));
    const hint = near.length > 0 ? ` Did you mean: ${near.join(', ')}?` : '';
    return `open: no page '${arg.slice(0, 40)}'.${hint}\n${list}`;
  }

  notFound(text: string): string {
    const head = (text.split(' ')[0] ?? '').slice(0, 40);
    const candidates = this.kb.commands.filter((cmd) => !cmd.hidden).map(namesOf);
    const near = suggest(head, candidates);
    const hint = near.length > 0 ? `\nDid you mean: ${near.join(', ')}?` : '';
    return `command not found: ${head}${hint}\n${this.kb.replies.notFoundHint}`;
  }
}

/** The offline reply for one line typed into the terminal. */
export function resolveOfflineReply(query: string, kb: OfflineKnowledge, ctx: OfflineContext = { history: [] }): string {
  if (query.length > MAX_QUERY_CHARS) return kb.replies.tooLong;
  const text = normalizeQuery(query);
  const resolver = new Resolver(kb, ctx);
  if (!text) return resolver.help('');

  for (const guard of kb.guards) {
    if (guard.pattern.test(text)) return guard.reply;
  }

  return (
    resolver.line(text, 0) ??
    resolver.redirect(text, 0) ??
    (text.split(' ').length <= 2 && !QUESTION.test(text.split(' ')[0] ?? '') ? resolver.notFound(text) : kb.replies.unknown)
  );
}
