'use client';

import { useRef, useState, type MouseEvent, type ReactNode } from 'react';

export interface MagneticProps {
  children: ReactNode;
}

export function Magnetic({ children }: MagneticProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });

  const handleMouse = (e: MouseEvent<HTMLDivElement>) => {
    const el = ref.current;
    if (!el) return;
    const { clientX, clientY } = e;
    const { height, width, left, top } = el.getBoundingClientRect();
    const middleX = clientX - (left + width / 2);
    const middleY = clientY - (top + height / 2);

    // Move the element 50% of the distance to the cursor for the magnetic effect
    setPosition({ x: middleX * 0.5, y: middleY * 0.5 });
  };

  const reset = () => {
    setPosition({ x: 0, y: 0 });
  };

  const { x, y } = position;

  return (
    <div style={{ position: 'relative' }} ref={ref} onMouseMove={handleMouse} onMouseLeave={reset}>
      <div
        style={{
          transform: `translate(${x}px, ${y}px)`,
          transition: 'transform 0.1s ease-out', // Fast response for "stickiness"
          willChange: 'transform',
        }}
      >
        {children}
      </div>
    </div>
  );
}
