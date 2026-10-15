import { PBKDF2_ITERATIONS } from '../config/vault';

/** PBKDF2(SHA-256, 2000 iterations) -> AES-GCM 256 key. Byte-identical to the legacy implementation. */
export async function deriveKey(password: string, salt: string): Promise<CryptoKey> {
  const enc = new TextEncoder();
  const keyMaterial = await window.crypto.subtle.importKey(
    'raw', enc.encode(password), { name: 'PBKDF2' }, false, ['deriveKey'],
  );
  return window.crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt: enc.encode(salt), iterations: PBKDF2_ITERATIONS, hash: 'SHA-256' },
    keyMaterial, { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt'],
  );
}

/** AES-GCM with a random 12-byte IV; output is base64(iv || ciphertext). */
export async function encryptData(key: CryptoKey, data: unknown): Promise<string> {
  const enc = new TextEncoder();
  const iv = window.crypto.getRandomValues(new Uint8Array(12));
  const encodedData = enc.encode(JSON.stringify(data));
  const encryptedContent = await window.crypto.subtle.encrypt({ name: 'AES-GCM', iv: iv }, key, encodedData);

  const buffer = new Uint8Array(iv.byteLength + encryptedContent.byteLength);
  buffer.set(iv, 0);
  buffer.set(new Uint8Array(encryptedContent), iv.byteLength);
  return btoa(String.fromCharCode(...buffer));
}

export async function decryptData<T = unknown>(key: CryptoKey, encryptedBase64: string): Promise<T> {
  try {
    const binaryString = atob(encryptedBase64);
    const buffer = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) { buffer[i] = binaryString.charCodeAt(i); }

    const iv = buffer.slice(0, 12);
    const data = buffer.slice(12);

    const decryptedContent = await window.crypto.subtle.decrypt({ name: 'AES-GCM', iv: iv }, key, data);
    return JSON.parse(new TextDecoder().decode(decryptedContent)) as T;
  } catch {
    throw new Error('Decryption failed.');
  }
}

/** Lowercase hex SHA-256 of the UTF-8 string. */
export async function computeHash(dataString: string): Promise<string> {
  const enc = new TextEncoder();
  const hashBuffer = await window.crypto.subtle.digest('SHA-256', enc.encode(dataString));
  return Array.from(new Uint8Array(hashBuffer)).map((b) => b.toString(16).padStart(2, '0')).join('');
}
