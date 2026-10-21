import Link from 'next/link';
import { ArrowRight, ArrowUpRight } from 'lucide-react';

import { TERMINAL_COMMANDS, TERMINAL_PROMPTS, TERMINAL_QUICK_LINKS, type TerminalQuickLink } from './terminal-copy';
import s from './TerminalOverlay.module.css';

/*
 * Server-safe markup (no hooks); the client overlay passes the handlers.
 * Prompts and commands fill the input and focus it, they never submit.
 */

interface RailProps {
  onFill: (text: string) => void;
  onNavigate: () => void;
}

/** A Go-to link: in-site links close the terminal and navigate; the résumé opens in a new tab. */
export function QuickLink({ link, className, onNavigate }: { link: TerminalQuickLink; className: string; onNavigate: () => void }) {
  if (link.external) {
    return (
      <a href={link.href} target="_blank" rel="noopener noreferrer" className={className}>
        {link.label}
        <span className="sr-only"> (opens in a new tab)</span>
        <ArrowUpRight aria-hidden="true" focusable="false" strokeWidth={1.75} />
      </a>
    );
  }
  return (
    <Link href={link.href} onClick={onNavigate} className={className}>
      {link.label}
    </Link>
  );
}

/** The desktop rail: Ask about, Commands, Go to. */
export function TerminalRail({ onFill, onNavigate }: RailProps) {
  return (
    <aside data-lenis-prevent="" className={`scroll-pane ${s.rail}`} aria-label="Shortcuts">
      <section>
        <h3 className={s.railHead}>Ask about</h3>
        <ul className={s.list}>
          {TERMINAL_PROMPTS.map((prompt) => (
            <li key={prompt.full}>
              <button type="button" className={s.prompt} onClick={() => onFill(prompt.full)}>
                <ArrowRight aria-hidden="true" focusable="false" strokeWidth={1.75} />
                {prompt.full}
              </button>
            </li>
          ))}
        </ul>
      </section>
      <section>
        <h3 className={s.railHead}>Commands</h3>
        <div className={s.cmds} role="group" aria-label="Commands">
          {TERMINAL_COMMANDS.map((cmd) => (
            <button key={cmd} type="button" className={s.cmd} onClick={() => onFill(cmd)}>
              {cmd}
            </button>
          ))}
        </div>
      </section>
      <nav className={s.gotoNav} aria-label="Go to">
        <h3 className={s.railHead}>Go to</h3>
        <ul className={s.list}>
          {TERMINAL_QUICK_LINKS.map((link) => (
            <li key={link.label}>
              <QuickLink link={link} className={s.goto} onNavigate={onNavigate} />
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  );
}
