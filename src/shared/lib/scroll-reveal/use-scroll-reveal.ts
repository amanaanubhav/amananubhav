import { useEffect, useRef, useState, type RefObject } from 'react';

/** One-shot IntersectionObserver reveal (threshold 0.1); the observer is disconnected on cleanup. */
export function useScrollReveal<T extends Element = HTMLDivElement>(): readonly [
  RefObject<T | null>,
  boolean,
] {
  const ref = useRef<T | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setIsVisible(true);
          observer.unobserve(entry.target);
        }
      },
      { threshold: 0.1 },
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return [ref, isVisible] as const;
}
