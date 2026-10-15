/**
 * Legacy client-side admin passcode check shared by the secure vault and the admin chat gate.
 * It is client-visible exactly as before; real authentication is a follow-up.
 */
const ADMIN_PASSCODE = 'youcantguess';

export function isAdminPasscode(input: string): boolean {
  return input === ADMIN_PASSCODE;
}
