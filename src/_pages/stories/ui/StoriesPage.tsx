import type { JSX } from 'react';
import { StoriesShowcase } from './StoriesShowcase';

export function StoriesPage(): JSX.Element {
  return (
    <div className="min-h-screen pt-20" style={{ backgroundColor: 'var(--bg-primary)' }}>
      <StoriesShowcase />
    </div>
  );
}
