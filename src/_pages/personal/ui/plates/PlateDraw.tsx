'use client';

import { useEffect, useImperativeHandle, useRef, type ReactElement, type Ref } from 'react';
import { DrawOnView, type DrawOnViewHandle } from '@/shared/ui/draw';
import { useDrawRegistry } from './draw-registry';

export interface PlateDrawProps {
  children: ReactElement;
  className?: string;
  /** `'view'` (default): draws once at 30 % in view. `'manual'`: finished until `replay()`. */
  trigger?: 'view' | 'manual';
  /** Optional handle for a client parent. */
  drawRef?: Ref<DrawOnViewHandle>;
  /** Registers the handle with the light table's registry under this key (server-rendered plates). */
  drawKey?: string;
}

/** A plate's `DrawOnView`, reachable through `drawRef` or the light table's registry. */
export function PlateDraw({ children, className, trigger = 'view', drawRef, drawKey }: PlateDrawProps) {
  const local = useRef<DrawOnViewHandle>(null);
  const registry = useDrawRegistry();

  useImperativeHandle(
    drawRef,
    () => ({
      replay: () => local.current?.replay(),
      finish: () => local.current?.finish(),
    }),
    [],
  );

  useEffect(() => {
    if (!registry || !drawKey) return;
    return registry.register(drawKey, {
      replay: () => local.current?.replay(),
      finish: () => local.current?.finish(),
    });
  }, [registry, drawKey]);

  return (
    <DrawOnView ref={local} trigger={trigger} className={className}>
      {children}
    </DrawOnView>
  );
}

/** The draw props every light-table plate takes (passed through to `PlateDraw`). */
export type PlateDrawOptions = Pick<PlateDrawProps, 'trigger' | 'drawRef' | 'drawKey'>;
