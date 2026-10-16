'use client';

import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';

import { MARK_VIEWBOX, TREKKER, TREKKER_SMALL, Trekker, ridgeMaskUrl } from '@/shared/ui/ridge-mark';

import s from './TerminalOverlay.module.css';

/*
 * Alpenglow, the response motion: light crosses a small ridge while Aman thinks, words develop out of a
 * soft blur while he writes, and the trekker on the summit catches the light once when the reply is complete
 * (the ridge and trekker are the site's signature mark, @/shared/ui/ridge-mark). CSS does the moving
 * (keyed on `data-ag` of the reply row); these components only decide what is in the DOM.
 */

/** The reply's moment, set as `data-ag` on its row. */
export type ReplyPhase = 'thinking' | 'streaming' | 'done' | 'offline-wait';

const WORDS = /\S+/g;
/** A blank line (possibly with spaces) between two words starts a new paragraph. */
const PARAGRAPH_BREAK = /\n[^\S\n]*\n/;
/** Words inside one chunk enter 22 ms apart, capped at 8 steps. */
const STAGGER_CAP = 8;
/** Spans collapse back to plain text once the last chunk has developed. */
const SETTLE_MS = 620;
const STILL_THINKING_MS = 3_000;
/** Offline replies type at ~110 characters per second, never for longer than this. */
const TYPE_CPS = 110;
const TYPE_MAX_MS = 3_000;
const TYPE_PAUSE_AFTER = /[.,]/;
const TYPE_PAUSE_COST = 7;

/** The ridge as a mask for the light band, from the shared geometry (one source with the site's mark). */
const RIDGE_STYLE = { '--ag-mask': ridgeMaskUrl() } as CSSProperties;

/**
 * The ridge mark (decorative): the light band crosses a ridge-shaped mask; the trekker on the summit is an
 * SVG over it. `lit` shows him in the alpenglow at rest; `detailed` draws the full figure (marks 28 px tall
 * and up, here the 72 px greeting), otherwise the simplified one.
 */
export function Ridge({ lit, detailed, className }: { lit?: boolean; detailed?: boolean; className?: string }) {
  return (
    <span className={[s.ridge, lit ? s.lit : '', className ?? ''].join(' ')} style={RIDGE_STYLE} aria-hidden="true">
      <svg viewBox={MARK_VIEWBOX} className={s.trekker} focusable="false">
        <Trekker figure={detailed ? TREKKER : TREKKER_SMALL} />
      </svg>
    </span>
  );
}

/**
 * Splits text into paragraphs on blank lines. With `delays`, each word that has one becomes a span keyed
 * by its offset in the text (stable while the text grows, so React never remounts a shown word).
 */
export function Paragraphs({
  text,
  delays,
  tail,
}: {
  text: string;
  delays?: ReadonlyMap<number, number>;
  tail?: ReactNode;
}) {
  const paras: ReactNode[][] = [[]];
  const starts = [0];
  let last = 0;
  for (const match of text.matchAll(WORDS)) {
    const at = match.index;
    const gap = text.slice(last, at);
    let current = paras[paras.length - 1]!;
    if (current.length > 0 && PARAGRAPH_BREAK.test(gap)) {
      current = [];
      paras.push(current);
      starts.push(at);
    } else if (current.length > 0) {
      current.push(gap);
    }
    const i = delays?.get(at);
    current.push(
      i === undefined ? (
        match[0]
      ) : (
        <span key={at} className={s.tok} style={{ '--i': i } as CSSProperties}>
          {match[0]}
        </span>
      ),
    );
    last = at + match[0].length;
  }
  return (
    <>
      {paras.map((parts, k) => (
        <p key={starts[k]}>
          {delays ? parts : parts.join('')}
          {k === paras.length - 1 && tail}
        </p>
      ))}
    </>
  );
}

interface TokenState {
  seen: number;
  chunks: number;
  delays: ReadonlyMap<number, number>;
}

/** Gives each word that arrives a stagger index once; words already shown keep theirs (no re-animation). */
function useWordDelays(text: string): TokenState {
  const [state, setState] = useState<TokenState>({ seen: 0, chunks: 0, delays: new Map() });
  if (text.length !== state.seen) {
    // A shorter text means the reply was rewritten: start over.
    const from = text.length < state.seen ? 0 : state.seen;
    const delays = new Map(from === 0 ? [] : state.delays);
    let n = 0;
    for (const match of text.matchAll(WORDS)) {
      if (match.index >= from && !delays.has(match.index)) delays.set(match.index, Math.min(n++, STAGGER_CAP));
    }
    setState({ seen: text.length, chunks: state.chunks + 1, delays });
  }
  return state;
}

/** An online reply as it streams in, then settles to plain paragraphs. */
export function LiveReply({ text, streaming }: { text: string; streaming: boolean }) {
  const { chunks, delays } = useWordDelays(text);
  const [settled, setSettled] = useState(false);

  useEffect(() => {
    if (streaming) return;
    const timer = window.setTimeout(() => setSettled(true), SETTLE_MS);
    return () => window.clearTimeout(timer);
  }, [streaming]);

  if (settled) return <Paragraphs text={text} />;
  // A fresh caret per chunk restarts its 500 ms delay: it breathes only when the text stalls.
  const caret = (
    <span key={chunks} className={s.caret} aria-hidden="true" data-leaving={streaming ? undefined : ''} />
  );
  return <Paragraphs text={text} delays={delays} tail={caret} />;
}

/** "Thinking" (then "Still thinking" after 3 s) over three placeholder lines. */
export function ThinkingBlock({ motionOk }: { motionOk: boolean }) {
  const [still, setStill] = useState(false);
  useEffect(() => {
    const timer = window.setTimeout(() => setStill(true), STILL_THINKING_MS);
    return () => window.clearTimeout(timer);
  }, []);
  const label = still ? 'Still thinking' : 'Thinking';
  return (
    <div className={s.thinking}>
      <p className={s.label}>{motionOk ? label : `${label}…`}</p>
      <div className={s.ghost} aria-hidden="true">
        <i />
        <i />
        <i />
      </div>
    </div>
  );
}

/** Reveals `full` at a typing pace (rAF, punctuation pauses); the whole text at once without motion. */
function useTypedLength(full: string, animate: boolean): number {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!animate) return;
    const costOf = (i: number) => (i > 0 && TYPE_PAUSE_AFTER.test(full[i - 1]!) ? TYPE_PAUSE_COST : 1);
    let total = 0;
    for (let k = 0; k < full.length; k += 1) total += costOf(k);
    const rate = Math.max(TYPE_CPS, (total * 1000) / TYPE_MAX_MS) / 1000;
    let raf = 0;
    let i = 0;
    let budget = 0;
    let prev = performance.now();
    const step = (now: number) => {
      budget += (now - prev) * rate;
      prev = now;
      while (i < full.length) {
        const cost = costOf(i);
        if (cost > budget) break;
        budget -= cost;
        i += 1;
      }
      setCount(i);
      if (i < full.length) raf = window.requestAnimationFrame(step);
    };
    raf = window.requestAnimationFrame(step);
    return () => window.cancelAnimationFrame(raf);
  }, [full, animate]);
  return animate ? count : full.length;
}

/** An offline (CLI) reply typed out behind a solid block caret; screen readers get the whole text at once. */
export function TypedReply({ text, animate }: { text: string; animate: boolean }) {
  const count = useTypedLength(text, animate);
  const blockRef = useRef<HTMLSpanElement>(null);
  const typing = count < text.length;

  useEffect(() => {
    if (typing) blockRef.current?.scrollIntoView({ block: 'nearest' });
  }, [count, typing]);

  if (!typing) return <pre className={s.cliOut}>{text}</pre>;
  return (
    <pre className={s.cliOut}>
      <span aria-hidden="true">{text.slice(0, count)}</span>
      <span className="sr-only">{text}</span>
      <span ref={blockRef} className={s.block} aria-hidden="true" />
    </pre>
  );
}
