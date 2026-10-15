import { FLOATING_SHAPES } from '../../config/meander';
import { GeometricShape } from './GeometricShape';

/** Dark-only layers 2-5: nebula blobs, holographic grid, CRT scan lines and floating shapes. */
export function CosmicBackdrop() {
  return (
    <>
      {/* ═══════════════════════════════════════
          LAYER 2: NEBULA GRADIENT BLOBS
          ═══════════════════════════════════════ */}
      <div className="absolute inset-0 pointer-events-none z-[1]">
        {/* Cyan nebula — top-left */}
        <div
          className="absolute animate-float-nebula"
          style={{
            top: '10%',
            left: '5%',
            width: '500px',
            height: '500px',
            borderRadius: '50%',
            background:
              'radial-gradient(circle, rgba(6,182,212,0.12) 0%, rgba(6,182,212,0.04) 40%, transparent 70%)',
            animation: 'float-nebula 20s ease-in-out infinite, pulse-glow 6s ease-in-out infinite',
          }}
        />
        {/* Violet nebula — center-right */}
        <div
          className="absolute"
          style={{
            top: '40%',
            right: '0%',
            width: '600px',
            height: '600px',
            borderRadius: '50%',
            background:
              'radial-gradient(circle, rgba(139,92,246,0.1) 0%, rgba(139,92,246,0.03) 40%, transparent 70%)',
            animation: 'float-nebula 25s ease-in-out 3s infinite, pulse-glow 8s ease-in-out 2s infinite',
          }}
        />
        {/* Deep rose/magenta nebula — bottom */}
        <div
          className="absolute"
          style={{
            bottom: '5%',
            left: '30%',
            width: '450px',
            height: '450px',
            borderRadius: '50%',
            background:
              'radial-gradient(circle, rgba(236,72,153,0.06) 0%, rgba(236,72,153,0.02) 40%, transparent 70%)',
            animation: 'float-nebula 22s ease-in-out 6s infinite, pulse-glow 7s ease-in-out 4s infinite',
          }}
        />
      </div>

      {/* ═══════════════════════════════════════
          LAYER 3: HOLOGRAPHIC GRID OVERLAY
          ═══════════════════════════════════════ */}
      <div
        className="absolute inset-0 pointer-events-none z-[2]"
        style={{
          backgroundImage: `
                                linear-gradient(rgba(6,182,212,0.03) 1px, transparent 1px),
                                linear-gradient(90deg, rgba(6,182,212,0.03) 1px, transparent 1px)
                            `,
          backgroundSize: '60px 60px',
        }}
      />

      {/* ═══════════════════════════════════════
          LAYER 4: CRT SCAN LINES
          ═══════════════════════════════════════ */}
      <div
        className="absolute inset-0 pointer-events-none z-[3]"
        style={{
          backgroundImage:
            'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(6,182,212,0.015) 2px, rgba(6,182,212,0.015) 4px)',
        }}
      />

      {/* ═══════════════════════════════════════
          LAYER 5: FLOATING GEOMETRIC SHAPES
          ═══════════════════════════════════════ */}
      <div className="absolute inset-0 pointer-events-none z-[4]">
        {FLOATING_SHAPES.map((shape, i) => (
          <div
            key={i}
            className="absolute"
            style={{
              left: shape.x,
              top: shape.y,
              animation: `drift ${shape.duration}s ease-in-out ${shape.delay}s infinite, rotate-slow ${shape.duration + 10}s linear ${shape.delay}s infinite`,
              opacity: 0.5,
            }}
          >
            <GeometricShape type={shape.type} size={shape.size} />
          </div>
        ))}
      </div>
    </>
  );
}

/* ═══════════════════════════════════════
   LAYER 6: DISTANT PLANET / MOON
   ═══════════════════════════════════════ */
export function DistantPlanet() {
  return (
    <div
      className="absolute pointer-events-none z-[3]"
      style={{
        top: '8%',
        right: '-5%',
        width: '300px',
        height: '300px',
      }}
    >
      {/* Planet body */}
      <div
        className="absolute inset-0 rounded-full"
        style={{
          background:
            'radial-gradient(circle at 35% 35%, rgba(139,92,246,0.15) 0%, rgba(59,130,246,0.08) 40%, rgba(6,182,212,0.03) 70%, transparent 100%)',
          boxShadow: '0 0 80px 20px rgba(139,92,246,0.05), inset -30px -30px 60px rgba(0,0,0,0.4)',
        }}
      />
      {/* Planet ring */}
      <div
        className="absolute"
        style={{
          top: '50%',
          left: '50%',
          width: '380px',
          height: '80px',
          transform: 'translate(-50%, -50%) rotateX(75deg) rotateZ(-15deg)',
          border: '1px solid rgba(139,92,246,0.12)',
          borderRadius: '50%',
        }}
      />
    </div>
  );
}
