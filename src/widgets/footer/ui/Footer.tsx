'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ArrowUpRight, Lock, Terminal } from 'lucide-react';
import { PROFILE } from '@/entities/profile';
import { openTerminal } from '@/features/ai-terminal';
import { openVault } from '@/features/secure-vault';
import { cn } from '@/shared/lib/cn';
import { buttonClassName } from '@/shared/ui/button';
import { JournalGrid } from '@/shared/ui/journal';
import { RidgeMark } from '@/shared/ui/ridge-mark';
import { RidgeName } from '@/shared/ui/ridge-name';
import { StatusChip } from '@/shared/ui/status-chip';
import { VisuallyHidden } from '@/shared/ui/visually-hidden';
import { COMPACT_FOOTER_ROUTES, ELSEWHERE_LINKS, FOOTER_COPY, PAGE_LINKS } from '../config/footer';
import { CopyEmail } from './CopyEmail';
import styles from './Footer.module.css';

const EMAIL = PROFILE.links.email;
const MAILTO = `mailto:${EMAIL}`;
const ICON = { 'aria-hidden': true, focusable: false, strokeWidth: 1.75 } as const;

/** Column label in the journal's log-key voice (Literata italic, muted, 16 px). */
function Key({ id, children }: { id: string; children: string }) {
  return (
    <h3 id={id} className={styles.key}>
      {children}
    </h3>
  );
}

/** The email, once, with Copy beside it. */
function EmailRow({ full }: { full?: boolean }) {
  return (
    <div className={cn(styles.mail, full && styles.mailFull)}>
      <a href={MAILTO} className={styles.email}>
        {EMAIL}
      </a>
      <CopyEmail email={EMAIL} />
    </div>
  );
}

/** Ask Alpenglow: opens the terminal; focus comes back here when it closes. */
function AskAction() {
  return (
    <button
      type="button"
      onClick={openTerminal}
      aria-haspopup="dialog"
      data-return-focus="footer-terminal"
      className={styles.act}
    >
      <Terminal {...ICON} />
      <span className={styles.tx}>{FOOTER_COPY.askLabel}</span>
    </button>
  );
}

/** `/` and `/professional` already made the ask: the sheet closes on the sign-off and the quiet "write" actions. */
function CompactClose() {
  return (
    <>
      <p className={styles.sign}>{FOOTER_COPY.signOff}</p>
      <section aria-labelledby="footer-write" className={styles.write}>
        <Key id="footer-write">{FOOTER_COPY.keys.write}</Key>
        <EmailRow />
        <div className={styles.acts}>
          <button
            type="button"
            onClick={openVault}
            aria-haspopup="dialog"
            data-return-focus="footer-vault"
            className={styles.act}
          >
            <Lock {...ICON} />
            <span className={styles.tx}>{FOOTER_COPY.vaultLabel}</span>
          </button>
          <AskAction />
        </div>
      </section>
    </>
  );
}

/** Every other route: the one ask, the email once, the Vault as the primary action. */
function FullClose() {
  return (
    <>
      <h2 className={styles.h2}>{FOOTER_COPY.heading}</h2>
      <p className={styles.body}>{FOOTER_COPY.bodyLead}</p>
      <EmailRow full />
      <div className={cn(styles.acts, styles.actsWide)}>
        <button
          type="button"
          onClick={openVault}
          aria-haspopup="dialog"
          data-return-focus="footer-vault"
          className={buttonClassName({ variant: 'primary', size: 'lg', className: 'px-6' })}
        >
          <Lock {...ICON} className="size-[18px] shrink-0" />
          {FOOTER_COPY.vaultLabel}
        </button>
        <AskAction />
      </div>
    </>
  );
}

function PagesColumn({ pathname }: { pathname: string }) {
  return (
    <nav aria-labelledby="footer-pages" className={styles.pages}>
      <Key id="footer-pages">{FOOTER_COPY.keys.pages}</Key>
      <ul className={styles.list}>
        {PAGE_LINKS.map(({ label, href }) => (
          <li key={href}>
            <Link href={href} aria-current={pathname === href ? 'page' : undefined} className={styles.link}>
              <span className={styles.tx}>{label}</span>
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}

function ElsewhereColumn() {
  return (
    <section aria-labelledby="footer-elsewhere" className={styles.elsewhere}>
      <Key id="footer-elsewhere">{FOOTER_COPY.keys.elsewhere}</Key>
      <ul className={styles.list}>
        {ELSEWHERE_LINKS.map(({ label, href, icon: Icon }) => (
          <li key={label}>
            <a href={href} target="_blank" rel="noopener noreferrer" className={styles.link}>
              <Icon {...ICON} className={styles.icon} />
              <span className={styles.tx}>{label}</span>
              <ArrowUpRight {...ICON} className={styles.arrow} />
              <VisuallyHidden> (opens in a new tab)</VisuallyHidden>
            </a>
          </li>
        ))}
      </ul>
    </section>
  );
}

/**
 * The last sheet (HERO-FOOTER-SPEC §2.5, Survey Ridge). The band: the close (the sign-off on `/` and `/professional`,
 * the one ask elsewhere), the six pages and the four profiles, top-aligned so no column leaves a void. Then his name
 * across the sheet over a contour drawing, the steel ridge as its horizon and the trekker on the summit (decorative:
 * the © line carries the name), then the bar. As tall as its content; only the bar keeps the chat bead's corner clear.
 * The one moment is the name's survey pass on arrival; links answer hover and focus with their underline alone.
 */
export function Footer() {
  const pathname = usePathname() ?? '';
  const compact = COMPACT_FOOTER_ROUTES.includes(pathname);

  return (
    // Above the waypoint rail and the dock (z-rail 40) so they slide under the last sheet instead of covering its
    // controls (WCAG 2.4.11); below the chat bead (z-chat 60) and the navbar.
    <footer className={styles.root}>
      <JournalGrid className={styles.band}>
        <div className={styles.close}>{compact ? <CompactClose /> : <FullClose />}</div>
        <PagesColumn pathname={pathname} />
        <ElsewhereColumn />
      </JournalGrid>

      <div className={styles.nameBand}>
        <div aria-hidden="true" className={styles.sheet} />
        <JournalGrid>
          <RidgeName
            as="p"
            text={FOOTER_COPY.wordmark}
            layout="auto"
            span="sheet"
            decorative
            replayKey={pathname}
            className={styles.name}
          />
        </JournalGrid>
      </div>

      <JournalGrid>
        <div className={styles.bar}>
          <p className={styles.own}>
            <RidgeMark size={20} lit className="shrink-0 text-ink" />
            <span>
              © <span suppressHydrationWarning>{new Date().getFullYear()}</span> {PROFILE.displayName}
            </span>
          </p>
          {PROFILE.availability?.utcLabel ? <p className={styles.zone}>{PROFILE.availability.utcLabel}</p> : null}
          {!compact && PROFILE.availability?.openToRemote ? (
            <StatusChip tone="live" href={FOOTER_COPY.statusHref}>
              {FOOTER_COPY.status}
            </StatusChip>
          ) : null}
        </div>
      </JournalGrid>
    </footer>
  );
}
