'use client';

import { lazy, Suspense } from 'react';
import type { ReactNode } from 'react';
import { useMediaView } from './media-view';
import type { SpecPlateProps } from './SpecPlate';

const SpecPlate = lazy(() => import('./SpecPlate'));

export type PendingSwitchProps =
  | {
      /** Production: `children` is the live rendering (strip, fill plate or nothing); `?media=spec` swaps in the full plate. */
      spec: SpecPlateProps;
      live?: never;
      children?: ReactNode;
    }
  | {
      /** Development: `children` is the full pending plate; `?media=live` swaps in this production rendering. */
      live: ReactNode;
      spec?: never;
      children: ReactNode;
    };

/**
 * The view switch of a needed placeholder (C-05). The server HTML is always the build's default view, so nothing
 * shifts at hydration unless a `?media=` flag asks for the other one: production keeps the live rendering and loads
 * the spec plate's chunk only for `?media=spec`; development keeps the full plate and previews production with
 * `?media=live`.
 */
export function PendingSwitch(props: PendingSwitchProps) {
  const view = useMediaView();
  if (props.spec !== undefined) {
    if (view !== 'spec') return props.children ?? null;
    return (
      <Suspense fallback={props.children ?? null}>
        <SpecPlate {...props.spec} />
      </Suspense>
    );
  }
  return view === 'live' ? props.live : props.children;
}
