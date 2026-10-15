'use client';

import {
  addDoc, collection, deleteDoc, doc, getDocs, onSnapshot, query, serverTimestamp, updateDoc, where,
  type Firestore, type QuerySnapshot, type Unsubscribe,
} from 'firebase/firestore';

import { getDb } from '@/shared/api';

import { VAULT_APP_ID } from '../config/vault';
import type {
  NewVaultUser, VaultBlock, VaultBlockDoc, VaultUser, VaultUserDoc, VaultUserStatus,
} from '../model/vault-types';

/**
 * Legacy code passed the (possibly undefined) db straight to collection(); the Firestore SDK
 * then throws and the caller surfaces err.message. The cast keeps that exact behaviour.
 */
const db = (): Firestore => getDb() as Firestore;

export const hasVaultDb = (): boolean => getDb() !== null;

const usersCol = () => collection(db(), 'artifacts', VAULT_APP_ID, 'public', 'data', 'vault_users');
const chainCol = () => collection(db(), 'artifacts', VAULT_APP_ID, 'public', 'data', 'vault_chain');

export async function findUsersByUsername(username: string): Promise<QuerySnapshot> {
  return getDocs(query(usersCol(), where('username', '==', username)));
}

/** Writes a vault_users doc; createdAt is stamped server-side (legacy key order kept). */
export async function createVaultUser(user: Omit<NewVaultUser, 'createdAt'>): Promise<void> {
  const newUser: NewVaultUser = {
    username: user.username,
    fullName: user.fullName,
    org: user.org,
    email: user.email,
    phone: user.phone,
    passwordHash: user.passwordHash,
    role: user.role,
    createdAt: serverTimestamp(),
    status: user.status,
  };
  await addDoc(usersCol(), newUser);
}

export function subscribeToChain(cb: (blocks: VaultBlock[]) => void | Promise<void>): Unsubscribe {
  return onSnapshot(query(chainCol()), (snapshot) => {
    void cb(snapshot.docs.map((d) => ({ id: d.id, ...(d.data() as VaultBlockDoc) })));
  });
}

export function subscribeToVaultUsers(cb: (users: VaultUser[]) => void): Unsubscribe {
  return onSnapshot(usersCol(), (snap) => {
    cb(snap.docs.map((d) => ({ id: d.id, ...(d.data() as VaultUserDoc) })));
  });
}

export async function addChainBlock(block: Omit<VaultBlockDoc, 'timestamp'>): Promise<void> {
  await addDoc(chainCol(), {
    index: block.index,
    previousHash: block.previousHash,
    userPayload: block.userPayload,
    adminPayload: block.adminPayload,
    hash: block.hash,
    sender: block.sender,
    timestamp: serverTimestamp(),
  });
}

export async function deleteChainBlock(id: string): Promise<void> {
  await deleteDoc(doc(db(), 'artifacts', VAULT_APP_ID, 'public', 'data', 'vault_chain', id));
}

export async function updateVaultUserStatus(id: string, status: VaultUserStatus): Promise<void> {
  await updateDoc(doc(db(), 'artifacts', VAULT_APP_ID, 'public', 'data', 'vault_users', id), { status });
}

export async function deleteVaultUser(id: string): Promise<void> {
  await deleteDoc(doc(db(), 'artifacts', VAULT_APP_ID, 'public', 'data', 'vault_users', id));
}

/** Deletes every chain document (fire-and-forget per doc, as in legacy). */
export async function nukeVaultChain(): Promise<void> {
  const snap = await getDocs(chainCol());
  snap.forEach((d) => { void deleteDoc(d.ref); });
}
