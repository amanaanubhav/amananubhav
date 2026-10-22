'use client';

import { useEffect, useRef, useState, type Dispatch, type RefObject, type SetStateAction } from 'react';

import {
  addChainBlock, deleteChainBlock, deleteVaultUser, hasVaultDb, nukeVaultChain,
  subscribeToChain, subscribeToVaultUsers, updateVaultUserStatus,
} from '../api/vault-firestore';
import { ADMIN_CHANNEL_SALT, ADMIN_CHANNEL_SECRET } from '../config/vault';
import { VaultTimeoutError, withVaultTimeout } from '../lib/time-limit';
import { computeHash, decryptData, deriveKey, encryptData } from '../lib/webcrypto';
import type {
  DecryptSource, LedgerBlock, VaultPayload, VaultSessionUser, VaultUser, VaultUserStatus, VaultView,
} from './vault-types';

interface UseLedgerArgs {
  view: VaultView;
  currentUser: VaultSessionUser | null;
  userKey: CryptoKey | null;
  adminKey: CryptoKey | null;
  setError: Dispatch<SetStateAction<string>>;
}

export interface Ledger {
  chain: LedgerBlock[];
  usersList: VaultUser[];
  chainEndRef: RefObject<HTMLDivElement | null>;
  msgInput: string;
  setMsgInput: Dispatch<SetStateAction<string>>;
  resetChain: () => void;
  handleAddBlock: () => Promise<void>;
  deleteBlock: (id: string) => Promise<void>;
  toggleUserStatus: (id: string, s: VaultUserStatus) => Promise<void>;
  deleteUser: (id: string) => Promise<void>;
  nukeChain: () => Promise<void>;
}

const BLOCK_FAILED = 'Failed to commit block.';
/** A send past the time limit: Firestore keeps the write queued (the block shows as Pending) and retries it itself. */
const BLOCK_QUEUED =
  'Vault unreachable. Your block is queued and commits when the connection returns; keep this tab open.';

/** Realtime ledger + admin user directory sync and the block/user actions (legacy SecureContact.jsx). */
export function useLedger({ view, currentUser, userKey, adminKey, setError }: UseLedgerArgs): Ledger {
  const [msgInput, setMsgInput] = useState('');
  const [chain, setChain] = useState<LedgerBlock[]>([]);
  const [usersList, setUsersList] = useState<VaultUser[]>([]);
  const chainEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (view !== 'dashboard' || !hasVaultDb()) return;

    // Ledger Sync
    const chainUnsub = subscribeToChain(async (fetchedChain) => {
      fetchedChain.sort((a, b) => a.index - b.index);

      const processedChain = await Promise.all(fetchedChain.map(async (block): Promise<LedgerBlock> => {
        let decrypted: VaultPayload | null = null;
        let source: DecryptSource | null = null;

        // Admin Decrypt
        if (currentUser?.role === 'admin' && adminKey && block.adminPayload) {
          try {
            const content = await decryptData<VaultPayload>(adminKey, block.adminPayload);
            decrypted = content;
            source = 'admin';
          } catch { /* */ }
        }

        // User Decrypt
        if (userKey && block.userPayload) {
          try {
            const content = await decryptData<VaultPayload>(userKey, block.userPayload);
            if (content.sender === block.sender) {
              decrypted = content;
              source = 'user';
            }
          } catch { /* */ }
        }

        return { ...block, decryptedContent: decrypted, decryptSource: source };
      }));

      setChain(processedChain);
      setTimeout(() => chainEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 200);
    });

    // Users Sync (Admin Only)
    let usersUnsub = () => { };
    if (currentUser?.role === 'admin') {
      usersUnsub = subscribeToVaultUsers((users) => {
        setUsersList(users);
      });
    }

    return () => { chainUnsub(); usersUnsub(); };
  }, [view, currentUser, userKey, adminKey]);

  const handleAddBlock = async () => {
    if (!msgInput.trim()) return;

    const messageToCommit = msgInput;
    setMsgInput('');
    /** On a definite failure the message goes back into the composer, unless the visitor has typed a new one. */
    const restoreMessage = () => setMsgInput((current) => current || messageToCommit);

    let write: Promise<void> | null = null;
    try {
      const index = chain.length;
      const previousHash = index === 0 ? '0' : chain[index - 1].hash;
      // Legacy dereferenced currentUser/userKey unguarded; failures land in the catch below.
      const sender = (currentUser as VaultSessionUser).username;
      const payload: VaultPayload = { sender, text: messageToCommit, timestamp: Date.now() };

      const userPayload = await encryptData(userKey as CryptoKey, payload);
      const adminKeyTemp = await deriveKey(ADMIN_CHANNEL_SECRET, ADMIN_CHANNEL_SALT);
      const adminPayload = await encryptData(adminKeyTemp, payload);

      const hash = await computeHash(`${index}${previousHash}${userPayload}`);

      write = addChainBlock({ index, previousHash, userPayload, adminPayload, hash, sender });
      await withVaultTimeout(write);
    } catch (err) {
      if (err instanceof VaultTimeoutError && write) {
        // Not lost and not retried here (that would add a second block): settle the line when the late outcome lands.
        setError(BLOCK_QUEUED);
        write.then(
          () => setError((current) => (current === BLOCK_QUEUED ? '' : current)),
          (lateErr: unknown) => { console.error(lateErr); setError(BLOCK_FAILED); restoreMessage(); },
        );
        return;
      }
      console.error(err); setError(BLOCK_FAILED); restoreMessage();
    }
  };

  // --- ADMIN ACTIONS (Delete/Block) ---
  const deleteBlock = async (id: string) => {
    try {
      await deleteChainBlock(id);
    } catch (err) { console.error('Delete failed:', err); }
  };

  const toggleUserStatus = async (id: string, s: VaultUserStatus) => {
    const newStatus: VaultUserStatus = s === 'active' ? 'blocked' : 'active';
    try {
      await updateVaultUserStatus(id, newStatus);
    } catch (err) { console.error('Toggle failed:', err); }
  };

  const deleteUser = async (id: string) => {
    if (window.confirm('Are you sure? This action is permanent.')) {
      try {
        await deleteVaultUser(id);
      } catch (err) { console.error('Delete user failed:', err); }
    }
  };

  const nukeChain = async () => {
    if (!window.confirm('NUKE CHAIN? This will delete all messages permanently.')) return;
    await nukeVaultChain();
  };

  const resetChain = () => setChain([]);

  return {
    chain, usersList, chainEndRef, msgInput, setMsgInput, resetChain,
    handleAddBlock, deleteBlock, toggleUserStatus, deleteUser, nukeChain,
  };
}
