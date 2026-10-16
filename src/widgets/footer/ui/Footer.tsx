'use client';

import { usePathname } from 'next/navigation';
import { Lock, Mail } from 'lucide-react';
import { PROFILE } from '@/entities/profile';
import { openVault } from '@/features/secure-vault';
import { cn } from '@/shared/lib/cn';
import { Button } from '@/shared/ui/button';
import { ChapterHeader } from '@/shared/ui/chapter-header';
import { JournalGrid, Log, Spread, type LogEntry } from '@/shared/ui/journal';
import { StatusChip } from '@/shared/ui/status-chip';
import { TrigMark } from '@/shared/ui/trig-mark';
import { VisuallyHidden } from '@/shared/ui/visually-hidden';
import { COMPACT_FOOTER_ROUTES, ELSEWHERE_LINKS, FOOTER_COPY } from '../config/footer';
import { CopyEmail } from './CopyEmail';
import { ReduceMotionSwitch } from './ReduceMotionSwitch';

const EMAIL = PROFILE.links.email;
const MAILTO = `mailto:${EMAIL}`;

/** Text-link look of §B.10 on an inner span, so the underline survives the link's inline-flex box. */
const LINK =
  'group/link inline-flex min-h-6 items-center gap-1.5 rounded-control text-ink ' +
  'focus-visible:[outline-style:solid] focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-signal ' +
  '[@media(pointer:coarse)]:min-h-11';
const LINK_TEXT =
  'underline decoration-signal decoration-1 underline-offset-[0.22em] ' +
  'transition-[text-decoration-thickness] duration-hover ease-settle group-hover/link:decoration-2';

function EmailValue() {
  return (
    <span className="inline-flex flex-wrap items-center gap-x-4 gap-y-1">
      <a href={MAILTO} className={LINK}>
        <span className={LINK_TEXT}>{EMAIL}</span>
      </a>
      <CopyEmail email={EMAIL} />
    </span>
  );
}

function ElsewhereValue() {
  return (
    <ul className="m-0 flex list-none flex-wrap gap-x-4 gap-y-1 p-0">
      {ELSEWHERE_LINKS.map(({ label, href, icon: Icon }) => (
        <li key={label}>
          <a href={href} target="_blank" rel="noopener noreferrer" className={LINK}>
            <Icon aria-hidden="true" focusable="false" className="size-4 shrink-0 text-ink-muted" strokeWidth={1.75} />
            <span className={LINK_TEXT}>{label}</span>
            <VisuallyHidden> (opens in a new tab)</VisuallyHidden>
          </a>
        </li>
      ))}
    </ul>
  );
}

function footerLog(compact: boolean): LogEntry[] {
  const availability = PROFILE.availability;
  const entries: LogEntry[] = [];
  if (!compact) {
    entries.push({
      key: 'status',
      value: availability?.openToRemote ? <StatusChip tone="success">Open to remote roles</StatusChip> : undefined,
      mono: false,
    });
  }
  entries.push({ key: 'email', value: <EmailValue /> });
  if (!compact) entries.push({ key: 'time zone', value: availability?.utcLabel });
  entries.push({ key: 'elsewhere', value: <ElsewhereValue />, mono: false });
  return entries;
}

function FullSpread() {
  return (
    <Spread
      as="div"
      logSticky={false}
      plateSpan="none"
      heading={
        <ChapterHeader as="h2" reveal="none">
          {FOOTER_COPY.heading}
        </ChapterHeader>
      }
      log={<Log items={footerLog(false)} label="Contact log" />}
    >
      <p className="m-0 max-w-measure font-body text-body text-ink">
        {FOOTER_COPY.bodyLead}{' '}
        <a href={MAILTO} className="prose-link">
          {EMAIL}
        </a>
        {FOOTER_COPY.bodyTail}
      </p>
      <div className="mt-8 flex flex-wrap gap-3">
        <Button variant="primary" icon={Lock} onClick={openVault} data-return-focus="footer-vault">
          Secure contact
        </Button>
        <Button variant="secondary" icon={Mail} href={MAILTO}>
          Email me
        </Button>
      </div>
    </Spread>
  );
}

function CompactRow() {
  return (
    <JournalGrid>
      <div className="col-[content-start/content-end] flex flex-col gap-6 lg:col-[2/span_10] lg:flex-row lg:items-start lg:justify-between">
        <Log items={footerLog(true)} label="Contact log" layout="strip" className="gap-x-8 gap-y-3" />
        <Button
          variant="text"
          icon={Lock}
          onClick={openVault}
          data-return-focus="footer-vault"
          className="self-start font-body font-medium"
        >
          Secure contact
        </Button>
      </div>
    </JournalGrid>
  );
}

/**
 * The last page (§H.3). Full variant on every route except `/` and `/professional`, which already carry
 * the page's one full ask and get the compact contact row. No motion: the footer is simply there.
 */
export function Footer() {
  const pathname = usePathname();
  const compact = COMPACT_FOOTER_ROUTES.includes(pathname);

  return (
    <footer
      className={cn(
        'relative z-content bg-ground pb-28 lg:pb-12',
        compact ? 'pt-16 lg:pt-24' : 'flex min-h-[70svh] flex-col justify-end pt-24 lg:pt-32',
      )}
    >
      {compact ? <CompactRow /> : <FullSpread />}

      <JournalGrid className={compact ? 'mt-12' : 'mt-20 lg:mt-28'}>
        <hr className="col-[full-start/full-end] m-0 border-0 border-t border-line" />
        <p className="col-[content-start/content-end] m-0 mt-8 font-body text-lead italic text-ink lg:col-[2/span_10]">
          {FOOTER_COPY.signOff}
        </p>
        <div className="col-[content-start/content-end] mt-6 flex flex-col gap-6 lg:col-[2/span_10] lg:flex-row lg:items-end lg:justify-between lg:gap-12">
          <p className="m-0 max-w-measure font-body text-caption text-ink-muted">
            {FOOTER_COPY.colophon.join(' ')}
          </p>
          <div className="flex flex-wrap items-center gap-x-8 gap-y-4 lg:shrink-0 lg:flex-nowrap">
            <ReduceMotionSwitch />
            <p className="m-0 font-body text-caption text-ink-muted">
              © <span suppressHydrationWarning>{new Date().getFullYear()}</span> Aman Anubhav
            </p>
            <TrigMark size={20} className="ms-auto shrink-0 text-signal lg:ms-0" />
          </div>
        </div>
      </JournalGrid>
    </footer>
  );
}
