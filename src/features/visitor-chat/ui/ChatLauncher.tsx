import type { MouseEvent, Ref } from 'react';

import { cn } from '@/shared/lib/cn';

import { ChatPlane } from './ChatPlane';
import styles from './chat-launcher.module.css';

interface ChatLauncherProps {
  ref: Ref<HTMLButtonElement>;
  isOpen: boolean;
  /** The accessible name, also the tooltip: "Chat with Aman", "Hide chat" or "Chat with Aman, 2 new replies". */
  label: string;
  hasUnread: boolean;
  /** The window's id, only while it is open. */
  controls?: string;
  onClick: (event: MouseEvent<HTMLButtonElement>) => void;
}

/**
 * The closed chat (chat design §3): a 52 px (48 px on phones) glass bead with the Ridge Dart, no label at rest.
 * Open, the plane turns into an X and the bead stays as the stable focus-return target. The tooltip repeats the
 * name for sighted pointer and keyboard users; the dot is decoration (the name carries the count).
 */
export function ChatLauncher({ ref, isOpen, label, hasUnread, controls, onClick }: ChatLauncherProps) {
  return (
    <>
      <button
        ref={ref}
        type="button"
        data-return-focus="chat-launcher"
        data-unread={hasUnread ? '' : undefined}
        aria-label={label}
        aria-expanded={isOpen}
        aria-controls={controls}
        onClick={onClick}
        className={cn(styles.bead, styles.glass)}
      >
        <ChatPlane className={cn(styles.icon, styles.planeIcon)} />
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.75}
          strokeLinecap="round"
          aria-hidden="true"
          focusable="false"
          className={cn(styles.icon, styles.close)}
        >
          <path d="M18 6 6 18M6 6l12 12" />
        </svg>
        <span aria-hidden="true" className={styles.dot} />
      </button>
      <span aria-hidden="true" className={cn(styles.tip, styles.glass)}>
        {label}
      </span>
    </>
  );
}
