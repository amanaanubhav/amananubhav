'use client';

import { useId, type Dispatch, type RefObject, type SetStateAction } from 'react';
import { KeyRound, Lock, Trash2 } from 'lucide-react';

import { Button } from '@/shared/ui/button';

import type { LedgerBlock, VaultSessionUser } from '../model/vault-types';
import { VAULT_INPUT_CLASS, VaultError } from './vault-form';

export interface LedgerPanelProps {
  titleId: string;
  currentUser: VaultSessionUser;
  chain: LedgerBlock[];
  chainEndRef: RefObject<HTMLDivElement | null>;
  msgInput: string;
  setMsgInput: Dispatch<SetStateAction<string>>;
  /** The session's error line (e.g. a failed send), shown above the composer. */
  error: string;
  onAddBlock: () => void;
  onDeleteBlock: (id: string) => void;
  onNukeChain: () => void;
}

const HASH_CHARS = 12;

const TIME_FORMAT = new Intl.DateTimeFormat('en-IN', {
  day: 'numeric',
  month: 'short',
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
});

const shortHash = (hash: string) => (hash.length > HASH_CHARS ? `${hash.slice(0, HASH_CHARS)}…` : hash);

const DESTRUCTIVE_TEXT =
  'inline-flex min-h-6 items-center gap-1.5 rounded-control font-display text-caption font-semibold text-error ' +
  'underline decoration-1 underline-offset-[0.22em] transition-[text-decoration-thickness] duration-hover ' +
  'hover:decoration-2 [@media(pointer:coarse)]:min-h-11';

function BlockEntry({ block, isAdmin, onDelete }: { block: LedgerBlock; isAdmin: boolean; onDelete: () => void }) {
  const date = block.timestamp?.toDate() ?? null;
  const content = block.decryptedContent;

  return (
    <li className="group relative grid grid-cols-[24px_minmax(0,1fr)] gap-x-3 pb-8 last:pb-0">
      {/* Spine: connector from this node to the next one, 1 px line-strong, never a verification color. */}
      <span
        aria-hidden="true"
        className="absolute -bottom-[7px] left-[11px] top-[13px] w-px bg-line-strong group-last:hidden"
      />
      <span aria-hidden="true" className="absolute left-[8.5px] top-[7px] size-1.5 bg-ink forced-colors:bg-[CanvasText]" />

      <div className="col-start-2 min-w-0">
        <p className="flex flex-wrap items-baseline gap-x-3 gap-y-0.5">
          <span className="tabular font-data text-caption text-ink">Block {block.index}</span>
          <span className="min-w-0 truncate font-body text-caption font-medium text-ink">{block.sender}</span>
          {date ? (
            <time dateTime={date.toISOString()} className="tabular font-data text-caption text-ink-muted">
              {TIME_FORMAT.format(date)}
            </time>
          ) : (
            <span className="font-body text-caption italic text-ink-muted">Pending</span>
          )}
        </p>

        {content ? (
          <>
            <p className="mt-2 max-w-measure whitespace-pre-wrap break-words font-body text-body text-ink">
              {content.text}
            </p>
            {block.decryptSource === 'admin' ? (
              <p className="mt-1.5 flex items-center gap-1.5 font-body text-caption italic text-ink-muted">
                <KeyRound aria-hidden="true" focusable="false" className="size-3.5 shrink-0" strokeWidth={2} />
                Read with the admin key
              </p>
            ) : null}
          </>
        ) : (
          <p className="mt-2 flex items-center gap-2 font-body text-caption italic text-ink-muted">
            <Lock aria-hidden="true" focusable="false" className="size-3.5 shrink-0" strokeWidth={2} />
            Encrypted entry. It does not open with your key.
          </p>
        )}

        <dl className="mt-3 flex flex-wrap gap-x-5 gap-y-1">
          <div className="flex items-baseline gap-2">
            <dt className="font-body text-caption italic text-ink-muted">hash</dt>
            <dd className="font-data text-caption text-ink-muted" title={block.hash}>
              {shortHash(block.hash)}
            </dd>
          </div>
          <div className="flex items-baseline gap-2">
            <dt className="font-body text-caption italic text-ink-muted">prev</dt>
            <dd className="font-data text-caption text-ink-muted" title={block.previousHash}>
              {shortHash(block.previousHash)}
            </dd>
          </div>
        </dl>

        {isAdmin ? (
          <button type="button" onClick={onDelete} className={`mt-3 ${DESTRUCTIVE_TEXT}`}>
            <Trash2 aria-hidden="true" focusable="false" className="size-3.5 shrink-0" strokeWidth={2} />
            Remove entry<span className="sr-only">, block {block.index}</span>
          </button>
        ) : null}
      </div>
    </li>
  );
}

/** The ledger (§H.7): a vertical chain on a spine, newest at the bottom, with the composer below. */
export function LedgerPanel({
  titleId, currentUser, chain, chainEndRef, msgInput, setMsgInput, error, onAddBlock, onDeleteBlock, onNukeChain,
}: LedgerPanelProps) {
  const isAdmin = currentUser.role === 'admin';
  const inputId = useId();
  const errorId = useId();
  const count = chain.length;

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex shrink-0 flex-wrap items-center justify-between gap-x-6 gap-y-3 border-b border-line px-5 py-4 sm:px-8">
        <div className="min-w-0">
          <h2
            id={titleId}
            tabIndex={-1}
            {...(isAdmin ? { 'data-vault-focus': '' } : {})}
            className="font-display text-title font-semibold text-ink focus:outline-none"
          >
            Messages
          </h2>
          <p className="tabular font-body text-caption text-ink-muted">
            {count === 1 ? '1 entry' : `${new Intl.NumberFormat('en').format(count)} entries`} in the ledger
          </p>
        </div>
        {isAdmin ? (
          <button
            type="button"
            onClick={onNukeChain}
            className={
              'inline-flex h-10 items-center gap-2 rounded-control border border-error px-3 font-display text-caption ' +
              'font-semibold text-error transition-colors duration-hover hover:bg-surface-2 active:scale-[0.98] ' +
              '[@media(pointer:coarse)]:h-11'
            }
          >
            <Trash2 aria-hidden="true" focusable="false" className="size-4 shrink-0" strokeWidth={2} />
            Delete all entries
          </button>
        ) : null}
      </div>

      <div
        data-lenis-prevent=""
        role="region"
        aria-label="Ledger entries"
        tabIndex={0}
        className="scroll-pane min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-6 sm:px-8"
      >
        {count === 0 ? (
          <p className="max-w-measure font-body text-body italic text-ink-muted">
            {isAdmin
              ? 'The ledger is empty.'
              : 'No messages yet. Write the first one below; it is encrypted before it leaves this page.'}
          </p>
        ) : (
          <ol aria-label="Ledger, oldest first">
            {chain.map((block) => (
              <BlockEntry key={block.id} block={block} isAdmin={isAdmin} onDelete={() => onDeleteBlock(block.id)} />
            ))}
          </ol>
        )}
        <div ref={chainEndRef} />
      </div>

      {!isAdmin ? (
        <div className="shrink-0 border-t border-line px-5 pb-[max(16px,env(safe-area-inset-bottom))] pt-4 sm:px-8">
          {error ? (
            <div className="mb-3">
              <VaultError id={errorId}>{error}</VaultError>
            </div>
          ) : null}
          <label htmlFor={inputId} className="font-body text-ui font-medium text-ink">
            Message
          </label>
          <div className="mt-1.5 flex flex-col gap-3 sm:flex-row">
            <input
              id={inputId}
              data-vault-focus=""
              type="text"
              autoComplete="off"
              enterKeyHint="send"
              aria-describedby={error ? errorId : undefined}
              className={`min-w-0 flex-1 ${VAULT_INPUT_CLASS}`}
              placeholder="Write your message. It's encrypted before it leaves this page."
              value={msgInput}
              onChange={(e) => setMsgInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.nativeEvent.isComposing) onAddBlock();
              }}
            />
            <Button icon={Lock} onClick={onAddBlock} disabled={!msgInput.trim()} className="shrink-0">
              Encrypt and send
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
