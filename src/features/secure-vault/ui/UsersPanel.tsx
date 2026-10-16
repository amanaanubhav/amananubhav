'use client';

import { ShieldCheck, ShieldOff, Trash2 } from 'lucide-react';

import { Stamp } from '@/shared/ui/journal';

import type { VaultUser, VaultUserStatus } from '../model/vault-types';
import { VaultScrollPane } from './vault-form';

export interface UsersPanelProps {
  titleId: string;
  usersList: VaultUser[];
  onToggleStatus: (id: string, status: VaultUserStatus) => void;
  onDeleteUser: (id: string) => void;
}

const ROW_BUTTON =
  'inline-flex h-10 items-center gap-1.5 rounded-control border px-3 font-display text-caption font-semibold ' +
  'transition-colors duration-hover hover:bg-surface-2 active:scale-[0.98] [@media(pointer:coarse)]:h-11';

const TH = 'py-2 pr-4 font-body text-caption font-normal italic text-ink-muted';

/** People (§H.7, admin only): every identity with its status and the block/unblock and delete actions. */
export function UsersPanel({ titleId, usersList, onToggleStatus, onDeleteUser }: UsersPanelProps) {
  const count = usersList.length;

  return (
    <VaultScrollPane>
      <div className="px-5 py-6 sm:px-8">
        <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
          <h2
            id={titleId}
            tabIndex={-1}
            data-vault-focus=""
            className="font-display text-title font-semibold text-ink focus:outline-none"
          >
            People
          </h2>
          <p className="tabular font-body text-caption text-ink-muted">
            {count === 1 ? '1 identity' : `${new Intl.NumberFormat('en').format(count)} identities`}
          </p>
        </div>

        {count === 0 ? (
          <p className="mt-6 font-body text-body italic text-ink-muted">No one has created an identity yet.</p>
        ) : (
          <div data-lenis-prevent="" className="scroll-pane mt-6 overflow-x-auto overscroll-x-contain">
            <table className="w-full min-w-[720px] border-collapse text-left">
              <caption className="sr-only">Identities in the vault, with their status and actions</caption>
              <thead>
                <tr className="border-b border-line-strong">
                  <th scope="col" className={TH}>Name</th>
                  <th scope="col" className={TH}>Organisation</th>
                  <th scope="col" className={TH}>Email</th>
                  <th scope="col" className={TH}>Status</th>
                  <th scope="col" className={TH}>
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {usersList.map((u) => {
                  const blocked = u.status === 'blocked';
                  return (
                    <tr key={u.id} className="border-b border-line align-top">
                      <th scope="row" className="py-3 pr-4 text-left font-normal">
                        <span className="block font-body text-ui font-medium text-ink">{u.fullName || u.username}</span>
                        <span className="block font-data text-caption text-ink-muted">@{u.username}</span>
                      </th>
                      <td className="py-3 pr-4 font-body text-caption text-ink">
                        {u.org || <span className="italic text-ink-muted">Not given</span>}
                      </td>
                      <td className="py-3 pr-4">
                        <a href={`mailto:${u.email}`} className="prose-link break-all font-body text-caption">
                          {u.email}
                        </a>
                        {u.phone ? (
                          <span className="tabular mt-0.5 block font-data text-caption text-ink-muted">{u.phone}</span>
                        ) : null}
                      </td>
                      <td className="py-3 pr-4">
                        <Stamp className={blocked ? 'border-error text-error' : undefined}>
                          {blocked ? 'Blocked' : 'Active'}
                        </Stamp>
                      </td>
                      <td className="py-3">
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => onToggleStatus(u.id, u.status)}
                            className={`${ROW_BUTTON} border-line-strong text-ink`}
                          >
                            {blocked ? (
                              <ShieldCheck aria-hidden="true" focusable="false" className="size-4 shrink-0" strokeWidth={2} />
                            ) : (
                              <ShieldOff aria-hidden="true" focusable="false" className="size-4 shrink-0" strokeWidth={2} />
                            )}
                            {blocked ? 'Unblock' : 'Block'}
                            <span className="sr-only"> {u.username}</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => onDeleteUser(u.id)}
                            className={`${ROW_BUTTON} border-error text-error`}
                          >
                            <Trash2 aria-hidden="true" focusable="false" className="size-4 shrink-0" strokeWidth={2} />
                            Delete<span className="sr-only"> {u.username}</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </VaultScrollPane>
  );
}
