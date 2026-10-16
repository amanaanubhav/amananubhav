'use client';

import { Lock } from 'lucide-react';
import { openVault } from '@/features/secure-vault';
import { Button } from '@/shared/ui/button';
import type { ButtonVariant } from '@/shared/ui/button';

/** Opens the secure contact vault (the same `openVault` the navbar and footer use). */
export function SecureContactButton({
  label,
  variant = 'secondary',
  returnFocusKey,
}: {
  label: string;
  variant?: ButtonVariant;
  /** `data-return-focus` key, so focus can find this button again after the vault closes (§C.3). */
  returnFocusKey?: string;
}) {
  return (
    <Button variant={variant} icon={Lock} onClick={openVault} data-return-focus={returnFocusKey}>
      {label}
    </Button>
  );
}
