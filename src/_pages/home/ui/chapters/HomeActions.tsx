'use client';

import { ArrowDown, BookOpen, Lock, SquareTerminal } from 'lucide-react';

import { openTerminal } from '@/features/ai-terminal';
import { openStory } from '@/features/read-story';
import { openVault } from '@/features/secure-vault';
import type { Story } from '@/entities/story';
import { scrollToTarget } from '@/shared/lib/smooth-scroll';
import { useStageHold } from '@/shared/lib/stage-prefetch';
import { Button, type ButtonVariant } from '@/shared/ui/button';
import { StatusChip } from '@/shared/ui/status-chip';

/*
 * The home page's client actions. Everything else on the page is server-rendered; these buttons are
 * the islands. The terminal and vault buttons keep the old chapter 5/6 behavior (same functions, real
 * <button>s) and carry the §C.3 return-focus keys, so focus comes back after the overlay closes.
 */

interface ActionProps {
  variant?: ButtonVariant;
  label: string;
  className?: string;
}

const ROUTE_ID = 'meander';

/**
 * Scrolls to `#meander` and moves focus there (WCAG 2.4.3), the way the rail does: the section gets
 * `tabindex="-1"` and takes focus without a second scroll, so the next Tab starts in the route instead of
 * jumping back to the hero.
 */
function goToRoute(): void {
  scrollToTarget(ROUTE_ID);
  const el = document.getElementById(ROUTE_ID);
  if (!el) return;
  if (!el.hasAttribute('tabindex')) el.setAttribute('tabindex', '-1');
  el.focus({ preventScroll: true });
}

/** Hero primary action: scrolls to `#meander` and focuses it. */
export function ReadStoryButton({ variant = 'primary', label, className }: ActionProps) {
  return (
    <Button
      variant={variant}
      icon={ArrowDown}
      iconPosition="end"
      className={className}
      onClick={goToRoute}
    >
      {label}
    </Button>
  );
}

export function OpenTerminalButton({ variant = 'primary', label, className }: ActionProps) {
  return (
    <Button
      variant={variant}
      icon={SquareTerminal}
      className={className}
      data-return-focus="home-terminal"
      aria-haspopup="dialog"
      onClick={openTerminal}
    >
      {label}
    </Button>
  );
}

export function SecureContactButton({ variant = 'secondary', label, className }: ActionProps) {
  return (
    <Button
      variant={variant}
      icon={Lock}
      className={className}
      data-return-focus="home-vault"
      aria-haspopup="dialog"
      onClick={openVault}
    >
      {label}
    </Button>
  );
}

/** Opens a published story in the reader (the server passes the one story, so the list never ships to the client). */
export function ReadJournalEntryButton({ variant = 'text', label, story, className }: ActionProps & { story: Story }) {
  return (
    <Button variant={variant} icon={BookOpen} className={className} aria-haspopup="dialog" onClick={() => openStory(story)}>
      {label}
    </Button>
  );
}

/** The hero's status chip: its /professional link keeps prefetch off while the stage holds the network. */
export function HeroStatusChip({ href, label }: { href: string; label: string }) {
  const hold = useStageHold();
  return (
    <StatusChip tone="success" href={href} prefetch={hold ? false : undefined}>
      {label}
    </StatusChip>
  );
}
