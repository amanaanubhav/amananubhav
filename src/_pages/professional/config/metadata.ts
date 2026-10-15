import type { Metadata } from 'next';
import { SITE } from '@/shared/config';

export const metadata: Metadata = {
  title: SITE.title,
  description: SITE.description,
  robots: 'index, follow',
};
