import { FileText } from 'lucide-react';
import { SITE } from '@/shared/config';
import { Button } from '@/shared/ui/button';
import type { ButtonSize, ButtonVariant } from '@/shared/ui/button';

export interface ResumeLinkProps {
  variant?: ButtonVariant;
  size?: ButtonSize;
  /** Default "Résumé". */
  label?: string;
  className?: string;
}

/**
 * A direct link to the résumé (same URL as before, `SITE.resumeDriveUrl`), opening in a new tab.
 * Replaces the old 2-second StatefulButton delay, which also tripped popup blockers.
 */
export function ResumeLink({ variant = 'secondary', size = 'md', label = 'Résumé', className }: ResumeLinkProps) {
  return (
    <Button href={SITE.resumeDriveUrl} external variant={variant} size={size} icon={FileText} className={className}>
      {label}
    </Button>
  );
}
