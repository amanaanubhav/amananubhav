import type { Star } from '../../lib/meander-geometry';

/* ═══════════════════════════════════════
   LAYER 1: STAR FIELD
   ═══════════════════════════════════════ */
export function StarField({ stars }: { stars: readonly Star[] }) {
  return (
    <div className="absolute inset-0 pointer-events-none z-0">
      {stars.map((star, i) => (
        <div
          key={i}
          className="absolute rounded-full"
          style={{
            left: `${star.x}%`,
            top: `${star.y}%`,
            width: `${star.size}px`,
            height: `${star.size}px`,
            backgroundColor:
              i % 5 === 0
                ? 'rgba(139, 92, 246, 0.8)' // violet stars
                : i % 7 === 0
                  ? 'rgba(6, 182, 212, 0.8)' // cyan stars
                  : `rgba(255, 255, 255, ${star.opacity})`,
            animation: `twinkle ${star.duration}s ease-in-out ${star.delay}s infinite`,
          }}
        />
      ))}
    </div>
  );
}
