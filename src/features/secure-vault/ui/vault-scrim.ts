/**
 * The Vault's modal scrim (C-14 part 2, PALETTE-SPEC §5.4): `glass-scrim` behind the glass sheet. It is the
 * component's own translucent layer, not `.glass-chrome`, so it turns solid itself under reduced transparency and
 * more contrast, and becomes Canvas under forced colors.
 */
export const VAULT_SCRIM_CLASS =
  'bg-[var(--glass-scrim)] [@media(prefers-reduced-transparency:reduce)]:bg-ground ' +
  '[@media(prefers-contrast:more)]:bg-ground forced-colors:bg-[Canvas]';

/**
 * Set while the code-split chunk's loading scrim is on screen, so the dialog's own scrim mounts already opaque
 * instead of blinking the page through on its fade-in. The loading fallback sets it on mount and clears it on
 * unmount; the dialog reads it while rendering, before that cleanup runs. Module state: one Vault at a time.
 */
export const vaultScrimHandoff = { shown: false };
