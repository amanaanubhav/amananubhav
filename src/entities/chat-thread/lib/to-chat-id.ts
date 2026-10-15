/** Thread id derived from the visitor email (legacy regex, verbatim). */
export function toChatId(email: string): string {
  return email.toLowerCase().replace(/[^a-z0-9]/g, '_');
}
