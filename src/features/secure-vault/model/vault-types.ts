import type { FieldValue, Timestamp } from 'firebase/firestore';

export type VaultView = 'login' | 'register' | 'dashboard';
export type VaultTab = 'ledger' | 'users';
export type VaultUserStatus = 'active' | 'blocked';

/** Document shape in artifacts/securevault_v1/public/data/vault_users. */
export interface VaultUserDoc {
  username: string;
  fullName: string;
  org: string;
  email: string;
  phone: string;
  passwordHash: string;
  role: string;
  createdAt: Timestamp | null;
  status: VaultUserStatus;
}

export type VaultUser = VaultUserDoc & { id: string };

/** Payload written on registration (createdAt is a server timestamp sentinel). */
export type NewVaultUser = Omit<VaultUserDoc, 'createdAt'> & { createdAt: FieldValue };

/** Signed-in principal: the pseudo-admin or a Firestore vault user. */
export type VaultSessionUser =
  | { username: string; role: 'admin'; fullName: string }
  | VaultUser;

/** Plaintext encrypted into each block (both user and admin copies). */
export interface VaultPayload {
  sender: string;
  text: string;
  timestamp: number;
}

/** Document shape in artifacts/securevault_v1/public/data/vault_chain. */
export interface VaultBlockDoc {
  index: number;
  previousHash: string;
  userPayload: string;
  adminPayload: string;
  hash: string;
  sender: string;
  timestamp: Timestamp | null;
}

export type VaultBlock = VaultBlockDoc & { id: string };

export type DecryptSource = 'admin' | 'user';

export type LedgerBlock = VaultBlock & {
  decryptedContent: VaultPayload | null;
  decryptSource: DecryptSource | null;
};

export interface RegisterForm {
  username: string;
  password: string;
  fullName: string;
  org: string;
  email: string;
  phone: string;
}

export interface LoginForm {
  username: string;
  password: string;
}
