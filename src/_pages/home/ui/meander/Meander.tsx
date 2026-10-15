'use client';

import { useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import { AnimatePresence, motion, useMotionValueEvent, useScroll, useTransform } from 'motion/react';

import { useTheme } from '@/shared/lib/theme';

import { STAR_COUNT, STORY_POINTS, TITLE_END, VIEWPORTS_PER_CHAPTER } from '../../config/meander';
import { buildMeanderPath, generateStars, type Star } from '../../lib/meander-geometry';
import { ChapterText } from './ChapterText';
import { CosmicBackdrop, DistantPlanet } from './CosmicBackdrop';
import { MeanderPath } from './MeanderPath';
import { StarField } from './StarField';

/** Canvas helix: client only (absolutely positioned, so no layout shift). */
const HelixField = dynamic(() => import('./HelixField').then((m) => m.HelixField), {
  ssr: false,
});

const totalChapters = STORY_POINTS.length;
// Scroll -> chapter mapping
const titleEnd = TITLE_END;
const chapterSize = (1 - titleEnd) / totalChapters;
// SVG path
const { d: meanderPath, nodes } = buildMeanderPath(totalChapters);

/* ─────────────────────────────────────────────
   MAIN COMPONENT
   ───────────────────────────────────────────── */
export function Meander() {
  const { isDark } = useTheme();
  const sectionRef = useRef<HTMLElement | null>(null);
  const [activeIndex, setActiveIndex] = useState(-1);

  // Star data is random, so it is generated once after mount (never during render).
  const [stars, setStars] = useState<Star[]>([]);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- client-only random data, avoids hydration mismatch
    setStars(generateStars(STAR_COUNT));
  }, []);

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ['start start', 'end end'],
  });

  useMotionValueEvent(scrollYProgress, 'change', (v) => {
    if (v < titleEnd) {
      setActiveIndex(-1);
    } else {
      const idx = Math.min(Math.floor((v - titleEnd) / chapterSize), totalChapters - 1);
      setActiveIndex(idx);
    }
  });

  // ─── SVG ANIMATION TRANSFORMS ───
  const litPathOffset = useTransform(scrollYProgress, (v) => 1 - v);
  const dotDashOffset = useTransform(scrollYProgress, (v) => 1 - v);
  const dotVisibility = useTransform(scrollYProgress, [0, 0.005, 0.97, 1], [0, 1, 1, 0]);

  // Title opacity
  const titleOpacity = useTransform(scrollYProgress, [0, 0.06, titleEnd], [1, 1, 0]);
  const titleY = useTransform(scrollYProgress, [0, titleEnd], [0, -60]);
  const titleScale = useTransform(scrollYProgress, [0, titleEnd], [1, 0.95]);

  // "Scroll" hint
  const hintOpacity = useTransform(scrollYProgress, [0, 0.03, 0.12, 0.15], [0, 0.5, 0.5, 0]);

  const activePoint = STORY_POINTS[activeIndex];

  return (
    <section
      ref={sectionRef}
      className="relative"
      style={{
        height: `${totalChapters * VIEWPORTS_PER_CHAPTER * 100}vh`,
        background: isDark
          ? 'linear-gradient(180deg, #030014 0%, #0a0a1a 30%, #050520 60%, #030014 100%)'
          : 'linear-gradient(180deg, #fafafa 0%, #f0f0ff 50%, #fafafa 100%)',
      }}
    >
      {/* ─── STICKY VIEWPORT ─── */}
      <div className="sticky top-0 h-screen w-full overflow-hidden">
        {/* LAYER 1: STAR FIELD */}
        {isDark && <StarField stars={stars} />}

        {/* LAYERS 2-5: NEBULA, GRID, SCAN LINES, FLOATING SHAPES */}
        {isDark && <CosmicBackdrop />}

        {/* LAYER 5.5: DNA HELIX / HOURGLASS GALAXY */}
        <HelixField scrollProgress={scrollYProgress} isDark={isDark} />

        {/* LAYER 6: DISTANT PLANET / MOON */}
        {isDark && <DistantPlanet />}

        {/* ═══════════════════════════════════════
            LAYER 7: AMBIENT RADIAL GRADIENT
            ═══════════════════════════════════════ */}
        <div
          className={`absolute inset-0 pointer-events-none z-[5] ${isDark
            ? 'bg-[radial-gradient(ellipse_60%_40%_at_50%_50%,rgba(6,182,212,0.06),transparent)]'
            : 'bg-[radial-gradient(ellipse_60%_40%_at_50%_50%,rgba(228,228,231,0.4),transparent)]'
            }`}
        />

        {/* LAYER 8: SVG MEANDER LINE */}
        <MeanderPath
          d={meanderPath}
          nodes={nodes}
          activeIndex={activeIndex}
          isDark={isDark}
          litPathOffset={litPathOffset}
          dotDashOffset={dotDashOffset}
          dotVisibility={dotVisibility}
        />

        {/* ═══════════════════════════════════════
            TITLE SCREEN — "Meander"
            ═══════════════════════════════════════ */}
        <motion.div
          className="absolute inset-0 flex flex-col items-center justify-center z-20 pointer-events-none"
          style={{ opacity: titleOpacity, y: titleY, scale: titleScale }}
        >
          {/* Orbital rings behind title */}
          {isDark && (
            <div className="absolute pointer-events-none">
              <div
                className="animate-rotate-slow"
                style={{
                  width: '500px',
                  height: '500px',
                  border: '1px solid rgba(6,182,212,0.08)',
                  borderRadius: '50%',
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                }}
              />
              <div
                style={{
                  width: '650px',
                  height: '650px',
                  border: '1px solid rgba(139,92,246,0.06)',
                  borderRadius: '50%',
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  animation: 'rotate-slow 45s linear infinite reverse',
                }}
              />
            </div>
          )}

          <p
            className="text-xs md:text-sm font-cyber tracking-[0.6em] uppercase mb-8"
            style={{ color: isDark ? '#22d3ee' : '#a1a1aa' }}
          >
            The Narrative
          </p>
          <h2
            className="text-6xl md:text-8xl lg:text-[9rem] font-serif italic tracking-tight leading-none"
            style={{
              background: isDark
                ? 'linear-gradient(135deg, #ffffff 0%, #06b6d4 50%, #8b5cf6 100%)'
                : 'linear-gradient(135deg, #18181b 0%, #3b82f6 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              filter: isDark ? 'drop-shadow(0 0 40px rgba(6,182,212,0.3))' : 'none',
            }}
          >
            Meander
          </h2>
        </motion.div>

        {/* ═══════════════════════════════════════
            CHAPTER TEXT — one at a time
            ═══════════════════════════════════════ */}
        <div className="absolute inset-0 z-20 pointer-events-none">
          <AnimatePresence mode="wait">
            {activeIndex >= 0 && activeIndex < totalChapters && activePoint && (
              <ChapterText
                key={activeIndex}
                point={activePoint}
                index={activeIndex}
                isDark={isDark}
              />
            )}
          </AnimatePresence>
        </div>

        {/* ═══════════════════════════════════════
            SCROLL HINT — enhanced sci-fi pulse
            ═══════════════════════════════════════ */}
        <motion.div
          className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-3 z-30"
          style={{ opacity: hintOpacity }}
        >
          <span
            className="text-xs font-cyber tracking-[0.4em] uppercase"
            style={{ color: isDark ? '#22d3ee' : '#a1a1aa' }}
          >
            Scroll to explore
          </span>
          {/* Chevron arrows */}
          <div className="flex flex-col items-center gap-1">
            {[0, 1, 2].map((i) => (
              <svg
                key={i}
                width="16"
                height="8"
                viewBox="0 0 16 8"
                style={{
                  animation: `chevron-pulse 2s ease-in-out ${i * 0.2}s infinite`,
                }}
              >
                <polyline
                  points="1,1 8,7 15,1"
                  fill="none"
                  stroke={isDark ? '#06b6d4' : '#a1a1aa'}
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            ))}
          </div>
        </motion.div>

        {/* ═══════════════════════════════════════
            PROGRESS DOTS — orbital markers
            ═══════════════════════════════════════ */}
        <div
          className={`absolute bottom-10 right-10 flex flex-col gap-3 z-30 ${activeIndex < 0 ? 'opacity-0' : 'opacity-100'} transition-opacity duration-500`}
        >
          {STORY_POINTS.map((_, i) => (
            <div key={i} className="relative flex items-center justify-center">
              {/* Active ping ring */}
              {activeIndex === i && isDark && (
                <div
                  className="absolute w-4 h-4 rounded-full"
                  style={{
                    border: '1px solid #06b6d4',
                    animation: 'orbital-ping 2s ease-out infinite',
                  }}
                />
              )}
              {/* Outer ring */}
              <div
                className="w-3 h-3 rounded-full flex items-center justify-center transition-all duration-500"
                style={{
                  border: `1px solid ${isDark
                    ? activeIndex >= i
                      ? 'rgba(6,182,212,0.5)'
                      : 'rgba(6,182,212,0.1)'
                    : activeIndex >= i
                      ? 'rgba(0,0,0,0.3)'
                      : 'rgba(0,0,0,0.1)'
                    }`,
                }}
              >
                {/* Inner dot */}
                <div
                  className="rounded-full transition-all duration-500"
                  style={{
                    width: activeIndex === i ? '6px' : '4px',
                    height: activeIndex === i ? '6px' : '4px',
                    backgroundColor: isDark
                      ? activeIndex === i
                        ? '#22d3ee'
                        : activeIndex > i
                          ? 'rgba(6,182,212,0.5)'
                          : 'rgba(6,182,212,0.1)'
                      : activeIndex === i
                        ? '#18181b'
                        : activeIndex > i
                          ? '#71717a'
                          : '#d4d4d8',
                    boxShadow:
                      isDark && activeIndex === i
                        ? '0 0 8px rgba(6,182,212,0.6), 0 0 16px rgba(6,182,212,0.3)'
                        : 'none',
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
