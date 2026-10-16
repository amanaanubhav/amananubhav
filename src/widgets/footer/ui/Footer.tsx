'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Fragment, useRef, type CSSProperties } from 'react';
import { ArrowUpRight, Lock, Mail } from 'lucide-react';
import { PROFILE } from '@/entities/profile';
import { openVault } from '@/features/secure-vault';
import { cn } from '@/shared/lib/cn';
import { useMotionAllowed } from '@/shared/lib/motion-tier';
import { buttonClassName } from '@/shared/ui/button';
import { JournalGrid } from '@/shared/ui/journal';
import { StatusChip } from '@/shared/ui/status-chip';
import { TrigMark } from '@/shared/ui/trig-mark';
import { VisuallyHidden } from '@/shared/ui/visually-hidden';
import { COMPACT_FOOTER_ROUTES, ELSEWHERE_LINKS, FOOTER_COPY, PAGE_LINKS } from '../config/footer';
import { useFooterPointer, useFooterReveal } from '../lib/use-footer-motion';
import { CopyEmail } from './CopyEmail';
import { ReduceMotionSwitch } from './ReduceMotionSwitch';
import { RollText } from './RollText';
import { Wordmark } from './Wordmark';
import styles from './Footer.module.css';

const EMAIL = PROFILE.links.email;
const MAILTO = `mailto:${EMAIL}`;

/** Column label in the journal's log-key voice (Literata italic, muted). */
function Key({ id, children }: { id?: string; children: string }) {
  return (
    <h3 id={id} className="m-0 font-body text-caption font-normal italic text-ink-muted">
      {children}
    </h3>
  );
}

/** Words of a closing line, each in its own mask so they can rise in on arrival (see useFooterReveal). */
function RisingWords({ text, offset = 0 }: { text: string; offset?: number }) {
  return text.split(' ').map((word, index, words) => (
    <Fragment key={index}>
      <span className={styles.mask}>
        <span className={styles.rise} style={{ '--d': offset + index } as CSSProperties}>
          {word}
        </span>
      </span>
      {index < words.length - 1 ? ' ' : null}
    </Fragment>
  ));
}

function TopRow({ compact }: { compact: boolean }) {
  return (
    <div className="col-[content-start/content-end] flex flex-wrap items-center justify-between gap-x-6 gap-y-2 lg:col-[2/span_12]">
      <p className="m-0 inline-flex items-center gap-2.5 font-display text-ui font-semibold text-ink">
        <TrigMark size={18} className="shrink-0 text-signal" />
        {PROFILE.displayName}
        <span className="font-body font-normal italic text-ink-muted">· the last page</span>
      </p>
      <div className="flex flex-wrap items-center gap-x-5 gap-y-1">
        {!compact && PROFILE.availability?.openToRemote ? (
          <StatusChip tone="success">Open to remote roles</StatusChip>
        ) : null}
        <p className="m-0 font-data text-caption text-ink-muted">{PROFILE.availability?.utcLabel}</p>
      </div>
    </div>
  );
}

function Closing({ compact }: { compact: boolean }) {
  if (compact) {
    // The page above already made the ask: the last page closes on the sign-off, not a second ask.
    return (
      <div className="col-[content-start/content-end] lg:col-[2/span_7] lg:self-end">
        <p className={cn(styles.closing, 'm-0')}>
          <RisingWords text={FOOTER_COPY.signOff} />
        </p>
      </div>
    );
  }

  return (
    <div className="col-[content-start/content-end] lg:col-[2/span_7]">
      <h2 className={cn(styles.closing, 'm-0')}>
        <RisingWords text={FOOTER_COPY.heading} />
      </h2>
      <p className={cn(styles.rise, 'm-0 mt-6 max-w-[34rem] font-body text-body text-ink lg:mt-8')} style={{ '--d': 7 } as CSSProperties}>
        {FOOTER_COPY.bodyLead}{' '}
        <a href={MAILTO} className={cn(styles.inlineTarget, 'prose-link')}>
          {EMAIL}
        </a>
        {FOOTER_COPY.bodyTail}
      </p>
      <div className={cn(styles.rise, 'mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap')} style={{ '--d': 8 } as CSSProperties}>
        <span data-magnetic="" className={styles.magnetic}>
          <span data-magnet="" className={styles.magnet}>
            <button
              type="button"
              onClick={openVault}
              data-return-focus="footer-vault"
              className={buttonClassName({ variant: 'primary', size: 'lg', className: cn(styles.sheen, 'w-full px-6 sm:w-auto') })}
            >
              <Lock aria-hidden="true" focusable="false" className="size-[18px] shrink-0" strokeWidth={1.75} />
              Secure contact
            </button>
          </span>
        </span>
        <span data-magnetic="" className={styles.magnetic}>
          <span data-magnet="" className={styles.magnet}>
            <a
              href={MAILTO}
              className={buttonClassName({ variant: 'secondary', size: 'lg', className: cn(styles.glass, 'w-full px-6 sm:w-auto') })}
            >
              <Mail aria-hidden="true" focusable="false" className="size-[18px] shrink-0" strokeWidth={1.75} />
              Email me
            </a>
          </span>
        </span>
      </div>
    </div>
  );
}

function WriteColumn({ compact }: { compact: boolean }) {
  return (
    <section aria-labelledby="footer-write" className="flex flex-col gap-2">
      <Key id="footer-write">write</Key>
      <a href={MAILTO} className={cn(styles.line, styles.email)}>
        <span className={styles.lineText}>{EMAIL}</span>
      </a>
      <div className="flex flex-wrap items-center gap-x-6 gap-y-1">
        <CopyEmail email={EMAIL} />
        {compact ? (
          <button type="button" onClick={openVault} data-return-focus="footer-vault" className={cn(styles.line, styles.textAction)}>
            <Lock aria-hidden="true" focusable="false" className="size-4 shrink-0" strokeWidth={1.75} />
            <span className={styles.lineText}>Secure contact</span>
          </button>
        ) : null}
      </div>
    </section>
  );
}

function PagesColumn({ pathname }: { pathname: string }) {
  return (
    <nav aria-labelledby="footer-pages" className="flex flex-col gap-2">
      <Key id="footer-pages">pages</Key>
      <ol className="m-0 grid list-none grid-cols-2 gap-x-6 p-0 sm:grid-cols-1">
        {PAGE_LINKS.map(({ label, href }, index) => (
          <li key={href}>
            <Link href={href} aria-current={pathname === href ? 'page' : undefined} className={cn(styles.line, styles.page)}>
              <span aria-hidden="true" className={styles.pageNo}>
                {String(index + 1).padStart(2, '0')}
              </span>
              <span className={styles.lineText}>
                <RollText>{label}</RollText>
              </span>
            </Link>
          </li>
        ))}
      </ol>
    </nav>
  );
}

function ElsewhereColumn() {
  return (
    <section aria-labelledby="footer-elsewhere" className="flex flex-col gap-3">
      <Key id="footer-elsewhere">elsewhere</Key>
      <ul className="m-0 grid list-none grid-cols-2 gap-2 p-0 sm:grid-cols-1">
        {ELSEWHERE_LINKS.map(({ label, href, icon: Icon }) => (
          <li key={label} data-magnetic="" className={styles.magnetic}>
            <a data-magnet="" href={href} target="_blank" rel="noopener noreferrer" className={cn(styles.magnet, styles.tile)}>
              <Icon aria-hidden="true" focusable="false" className={styles.tileIcon} strokeWidth={1.75} />
              <span className={styles.tileLabel}>
                <RollText>{label}</RollText>
              </span>
              <ArrowUpRight aria-hidden="true" focusable="false" className={styles.tileArrow} strokeWidth={1.75} />
              <VisuallyHidden> (opens in a new tab)</VisuallyHidden>
            </a>
          </li>
        ))}
      </ul>
    </section>
  );
}

function BottomBar({ compact }: { compact: boolean }) {
  return (
    <div className="col-[content-start/content-end] flex flex-col gap-4 border-0 border-t border-solid border-line pt-5 lg:col-[2/span_12]">
      {/* lg:pe-36 keeps the copyright clear of the fixed "Say hello" launcher (bottom-right, about 130 x 48, 24 px in). */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between lg:gap-10 lg:pe-36">
        {compact ? null : <p className="m-0 font-body text-lead italic text-ink">{FOOTER_COPY.signOff}</p>}
        <div className={cn('flex flex-wrap items-center gap-x-8 gap-y-3', compact ? 'lg:ms-auto' : null)}>
          <ReduceMotionSwitch />
          <p className="m-0 font-body text-caption text-ink-muted">
            © <span suppressHydrationWarning>{new Date().getFullYear()}</span> Aman Anubhav
          </p>
        </div>
      </div>
    </div>
  );
}

/**
 * The last page (§H.3, redesigned per the owner's brief): a full-viewport closing spread that brings back the
 * previous footer's spirit (one huge stamp, one clear ask, a cursor that is rewarded) in the journal's palette
 * and type. Full variant on every route except `/` and `/professional`, which already end on the full ask and
 * close here on the sign-off instead. Motion: reveal on arrival, rolling letters and drawn underlines on links,
 * magnetic buttons and tiles, and a lens over the stamp; all transform/opacity, fine pointers only for the
 * pointer effects, and none of it under reduced motion (OS setting or the switch below).
 */
export function Footer() {
  const pathname = usePathname() ?? '';
  const compact = COMPACT_FOOTER_ROUTES.includes(pathname);
  const motion = useMotionAllowed();
  const rootRef = useRef<HTMLElement>(null);

  useFooterPointer(rootRef, motion);
  useFooterReveal(rootRef, motion, pathname);

  return (
    // Above the page's waypoint rail / section chip (z-rail 40) so they slide under the last page instead of
    // covering its controls (WCAG 2.4.11); below the chat launcher (z-chat 60) and the navbar.
    <footer ref={rootRef} className={cn(styles.root, 'relative z-[41] bg-ground')}>
      <div aria-hidden="true" className={styles.vignette} />

      <JournalGrid className="relative gap-y-12 lg:gap-y-10">
        <TopRow compact={compact} />
        <Closing compact={compact} />
        <div className="col-[content-start/content-end] grid grid-cols-1 gap-x-8 gap-y-10 sm:grid-cols-2 lg:col-[9/span_5] lg:self-end">
          <div className="sm:col-span-2">
            <WriteColumn compact={compact} />
          </div>
          <PagesColumn pathname={pathname} />
          <ElsewhereColumn />
        </div>
      </JournalGrid>

      <div className="relative mt-auto">
        <Wordmark text={FOOTER_COPY.wordmark} />
        <JournalGrid>
          <BottomBar compact={compact} />
        </JournalGrid>
      </div>
    </footer>
  );
}
