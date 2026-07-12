import React, { useRef, useState, useMemo, useEffect } from 'react';
import { motion, useScroll, useTransform, useMotionValueEvent, AnimatePresence } from 'framer-motion';

/* ─────────────────────────────────────────────
   STORY DATA
   ───────────────────────────────────────────── */
const storyPoints = [
    {
        title: "Origin",
        subtitle: "Where it began",
        description: "I am a Genetically Engineered Learner. My journey is not defined by inheriting talent, but by cultivating an obsessive curiosity. This space is a living architecture of my thoughts, built to translate theoretical knowledge into practical systems that solve real problems.",
    },
    {
        title: "Life",
        subtitle: "The human layer",
        description: "Beyond the code and the algorithms, this section explores my personal philosophies, core values, and the intrinsic motivations that drive my work. A raw look at the mindset required to constantly evolve, adapt, and build from the ground up.",
    },
    {
        title: "Professional",
        subtitle: "The trajectory",
        description: "A curated overview of my engineering journey and career milestones. Trace my path as an AI Researcher and Full Stack Engineer, from architecting sophisticated LLM pipelines to deploying scalable microservices for real world impact.",
    },
    {
        title: "Terminal",
        subtitle: "The interface",
        description: "A direct gateway to an intelligent agent embedded within this platform. The AI Terminal lets you dynamically interact with my portfolio, execute commands, and explore my capabilities through a powerful, developer centric environment.",
    },
    {
        title: "Secure Contact",
        subtitle: "The gateway",
        description: "A specialized, highly secure channel for communication. Designed with privacy and efficiency at its core, ensuring that professional inquiries and collaborations are handled with the utmost security and speed.",
    },
    {
        title: "Insights",
        subtitle: "The repository",
        description: "A collection of deep dives, technical breakdowns, and research notes. This serves as an open ledger of my ongoing experiments, discoveries in Artificial Intelligence, and thoughts on the future of scalable architectures.",
    }
];

/* ─────────────────────────────────────────────
   BUILD MEANDERING SVG PATH
   Small amplitude so it stays in a narrow
   center band and never touches text.
   ───────────────────────────────────────────── */
function buildMeanderPath(nodeCount) {
    const cx = 50;
    const amp = 12;
    const margin = 8;
    const range = 100 - 2 * margin;

    const nodeY = [];
    for (let i = 0; i < nodeCount; i++) {
        nodeY.push(margin + (i / (nodeCount - 1)) * range);
    }

    let d = `M ${cx},0`;
    for (let i = 0; i < nodeCount; i++) {
        const y = nodeY[i];
        const x = cx + (i % 2 === 0 ? -amp : amp);
        const prevY = i === 0 ? 0 : nodeY[i - 1];
        const prevX = i === 0 ? cx : cx + ((i - 1) % 2 === 0 ? -amp : amp);
        d += ` C ${prevX},${(prevY + y) / 2} ${x},${(prevY + y) / 2} ${x},${y}`;
    }
    const lastY = nodeY[nodeCount - 1];
    const lastX = cx + ((nodeCount - 1) % 2 === 0 ? -amp : amp);
    d += ` C ${lastX},${(lastY + 100) / 2} ${cx},${(lastY + 100) / 2} ${cx},100`;

    const nodes = nodeY.map((y, i) => ({
        x: cx + (i % 2 === 0 ? -amp : amp),
        y,
    }));

    return { d, nodes };
}

/* ─────────────────────────────────────────────
   STAR FIELD – generates random star data once
   ───────────────────────────────────────────── */
function generateStars(count) {
    const stars = [];
    for (let i = 0; i < count; i++) {
        stars.push({
            x: Math.random() * 100,
            y: Math.random() * 100,
            size: Math.random() * 2 + 0.5,
            delay: Math.random() * 6,
            duration: Math.random() * 4 + 3,
            opacity: Math.random() * 0.6 + 0.2,
        });
    }
    return stars;
}

/* ─────────────────────────────────────────────
   FLOATING GEOMETRIC SHAPES DATA
   ───────────────────────────────────────────── */
const floatingShapes = [
    { type: 'hexagon', x: '8%', y: '15%', size: 24, delay: 0, duration: 28 },
    { type: 'triangle', x: '85%', y: '25%', size: 18, delay: 3, duration: 32 },
    { type: 'circle', x: '12%', y: '70%', size: 14, delay: 6, duration: 24 },
    { type: 'hexagon', x: '90%', y: '65%', size: 20, delay: 2, duration: 30 },
    { type: 'triangle', x: '75%', y: '85%', size: 16, delay: 5, duration: 26 },
    { type: 'circle', x: '20%', y: '45%', size: 10, delay: 8, duration: 22 },
    { type: 'diamond', x: '92%', y: '12%', size: 12, delay: 1, duration: 35 },
    { type: 'diamond', x: '5%', y: '88%', size: 16, delay: 4, duration: 27 },
];

const ShapeComponent = ({ type, size }) => {
    const stroke = 'rgba(6, 182, 212, 0.15)';
    if (type === 'hexagon') {
        const r = size / 2;
        const points = Array.from({ length: 6 }, (_, i) => {
            const angle = (Math.PI / 3) * i - Math.PI / 2;
            return `${r + r * Math.cos(angle)},${r + r * Math.sin(angle)}`;
        }).join(' ');
        return (
            <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
                <polygon points={points} fill="none" stroke={stroke} strokeWidth="0.8" />
            </svg>
        );
    }
    if (type === 'triangle') {
        return (
            <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
                <polygon
                    points={`${size / 2},1 ${size - 1},${size - 1} 1,${size - 1}`}
                    fill="none" stroke={stroke} strokeWidth="0.8"
                />
            </svg>
        );
    }
    if (type === 'diamond') {
        return (
            <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
                <polygon
                    points={`${size / 2},1 ${size - 1},${size / 2} ${size / 2},${size - 1} 1,${size / 2}`}
                    fill="none" stroke={stroke} strokeWidth="0.8"
                />
            </svg>
        );
    }
    // circle
    return (
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
            <circle cx={size / 2} cy={size / 2} r={size / 2 - 1} fill="none" stroke={stroke} strokeWidth="0.8" />
        </svg>
    );
};

/* ─────────────────────────────────────────────
   DNA HELIX / HOURGLASS GALAXY FIELD
   Canvas-rendered double helix of glowing dots
   that responds to scroll with rotation and
   pulsing. Hourglass shape narrows at center.
   ───────────────────────────────────────────── */
const HelixField = ({ scrollProgress, isDark }) => {
    const canvasRef = useRef(null);
    const scrollRef = useRef(0);
    const timeRef = useRef(0);
    const animFrameRef = useRef(null);

    // Track scroll via motion value
    useMotionValueEvent(scrollProgress, "change", (v) => {
        scrollRef.current = v;
    });

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        let lastTime = performance.now();

        const resize = () => {
            const dpr = window.devicePixelRatio || 1;
            canvas.width = window.innerWidth * dpr;
            canvas.height = window.innerHeight * dpr;
            canvas.style.width = window.innerWidth + 'px';
            canvas.style.height = window.innerHeight + 'px';
            ctx.scale(dpr, dpr);
        };
        resize();
        window.addEventListener('resize', resize);

        const draw = (now) => {
            const dt = (now - lastTime) / 1000;
            lastTime = now;
            timeRef.current += dt;

            const w = window.innerWidth;
            const h = window.innerHeight;
            const scroll = scrollRef.current;
            const time = timeRef.current;

            // Clear with transparency
            const dpr = window.devicePixelRatio || 1;
            ctx.clearRect(0, 0, w * dpr, h * dpr);
            ctx.save();
            // Reset scale since we already set it in resize
            ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

            const centerX = w / 2;
            const dotCount = 70;
            const baseAmp = Math.min(w * 0.12, 140);
            // Scroll drives the helix rotation — 6 full twists over the scroll range
            const phaseShift = scroll * Math.PI * 8;
            // Gentle autonomous drift so it feels alive even without scrolling
            const liveDrift = time * 0.3;

            // ─── CONNECTING RUNGS (draw first, behind dots) ───
            for (let i = 0; i < dotCount; i += 3) {
                const t = i / (dotCount - 1);
                const y = h * 0.03 + t * h * 0.94;

                // Hourglass: amplitude is large at top/bottom, narrow at center
                const hourglassFactor = 0.35 + 0.65 * Math.pow(Math.abs(Math.cos(Math.PI * t)), 0.6);
                const amp = baseAmp * hourglassFactor;

                const theta1 = t * Math.PI * 5 + phaseShift + liveDrift;
                const theta2 = theta1 + Math.PI;
                const x1 = centerX + amp * Math.sin(theta1);
                const x2 = centerX + amp * Math.sin(theta2);

                const z1 = Math.cos(theta1);
                const z2 = Math.cos(theta2);
                const avgZ = (z1 + z2) / 2;

                // Only draw rungs that face the viewer
                if (avgZ > -0.2) {
                    const rungAlpha = Math.max(0, (avgZ + 0.2) * 0.12);
                    ctx.beginPath();
                    ctx.moveTo(x1, y);
                    ctx.lineTo(x2, y);
                    // Magenta / rose rungs
                    ctx.strokeStyle = `rgba(236, 72, 153, ${rungAlpha})`;
                    ctx.lineWidth = 0.6;
                    ctx.stroke();
                }
            }

            // ─── DOT STRANDS ───
            const colors = [
                // Strand A: cyan → electric blue gradient
                (alpha) => {
                    const r = 6, g = 182, b = 212;
                    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
                },
                // Strand B: violet → purple gradient
                (alpha) => {
                    const r = 139, g = 92, b = 246;
                    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
                },
            ];

            for (let strand = 0; strand < 2; strand++) {
                const strandOffset = strand * Math.PI;

                for (let i = 0; i < dotCount; i++) {
                    const t = i / (dotCount - 1); // 0→1 top→bottom
                    const y = h * 0.03 + t * h * 0.94;

                    // Hourglass amplitude modulation
                    const hourglassFactor = 0.35 + 0.65 * Math.pow(Math.abs(Math.cos(Math.PI * t)), 0.6);
                    const amp = baseAmp * hourglassFactor;

                    const theta = t * Math.PI * 5 + phaseShift + liveDrift + strandOffset;
                    const x = centerX + amp * Math.sin(theta);

                    // Z-depth for pseudo-3D — dots in front are bigger/brighter
                    const z = Math.cos(theta);
                    const depthScale = 0.5 + (z + 1) * 0.5; // 0→1 range
                    const size = 1.2 + depthScale * 2.0;
                    const alpha = 0.15 + depthScale * 0.65;

                    // Subtle color shift based on vertical position
                    const colorFn = colors[strand];

                    // Outer glow (only for front-facing dots)
                    if (z > 0) {
                        ctx.beginPath();
                        ctx.arc(x, y, size * 3.5, 0, Math.PI * 2);
                        ctx.fillStyle = colorFn(alpha * 0.08);
                        ctx.fill();
                    }

                    // Core dot
                    ctx.beginPath();
                    ctx.arc(x, y, Math.max(size, 0.6), 0, Math.PI * 2);
                    ctx.fillStyle = colorFn(alpha);
                    ctx.fill();

                    // Bright white center for the frontmost dots
                    if (z > 0.7) {
                        ctx.beginPath();
                        ctx.arc(x, y, size * 0.35, 0, Math.PI * 2);
                        ctx.fillStyle = `rgba(255, 255, 255, ${(z - 0.7) * 1.5})`;
                        ctx.fill();
                    }
                }
            }

            // ─── ACCENT: BRIGHT TRAVELING PULSE ───
            // A bright dot that races along strand A, position tied to scroll
            const pulseT = (scroll * 3 + time * 0.05) % 1;
            const pulseY = h * 0.03 + pulseT * h * 0.94;
            const pulseHourglass = 0.35 + 0.65 * Math.pow(Math.abs(Math.cos(Math.PI * pulseT)), 0.6);
            const pulseAmp = baseAmp * pulseHourglass;
            const pulseTheta = pulseT * Math.PI * 5 + phaseShift + liveDrift;
            const pulseX = centerX + pulseAmp * Math.sin(pulseTheta);
            const pulseZ = Math.cos(pulseTheta);

            if (pulseZ > 0) {
                // Large outer halo
                const grad = ctx.createRadialGradient(pulseX, pulseY, 0, pulseX, pulseY, 20);
                grad.addColorStop(0, `rgba(6, 182, 212, ${0.4 * pulseZ})`);
                grad.addColorStop(0.5, `rgba(139, 92, 246, ${0.15 * pulseZ})`);
                grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
                ctx.beginPath();
                ctx.arc(pulseX, pulseY, 20, 0, Math.PI * 2);
                ctx.fillStyle = grad;
                ctx.fill();

                // Core white dot
                ctx.beginPath();
                ctx.arc(pulseX, pulseY, 2.5, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(255, 255, 255, ${0.9 * pulseZ})`;
                ctx.fill();
            }

            ctx.restore();
            animFrameRef.current = requestAnimationFrame(draw);
        };

        animFrameRef.current = requestAnimationFrame(draw);

        return () => {
            window.removeEventListener('resize', resize);
            if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
        };
    }, [isDark]);

    if (!isDark) return null;

    return (
        <canvas
            ref={canvasRef}
            className="absolute inset-0 pointer-events-none z-[6]"
            style={{ opacity: 0.75 }}
        />
    );
};

/* ─────────────────────────────────────────────
   CHAPTER TEXT COMPONENT
   Positioned entirely on LEFT or RIGHT half,
   never crossing the center meander line.
   ───────────────────────────────────────────── */
const ChapterText = ({ point, index, isDark }) => {
    const isLeft = index % 2 === 0;

    return (
        <motion.div
            key={index}
            initial={{ opacity: 0, y: 50, filter: 'blur(6px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            exit={{ opacity: 0, y: -40, filter: 'blur(6px)' }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            className={`absolute top-1/2 -translate-y-1/2 w-[40%] px-8 md:px-12 ${isLeft ? 'left-0 text-left' : 'right-0 text-right'
                }`}
        >
            {/* Chapter Number — Holographic gradient */}
            <motion.span
                initial={{ opacity: 0, x: isLeft ? -30 : 30 }}
                animate={{ opacity: 0.25, x: 0 }}
                transition={{ duration: 0.6, delay: 0.1 }}
                className={`block text-[8rem] md:text-[12rem] font-serif font-black leading-none absolute -top-16 md:-top-24 ${isLeft ? '-left-2' : '-right-2'} pointer-events-none select-none`}
                style={{
                    background: isDark
                        ? 'linear-gradient(135deg, #06b6d4 0%, #8b5cf6 50%, #ec4899 100%)'
                        : 'linear-gradient(135deg, #d4d4d8 0%, #a1a1aa 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                }}
            >
                {String(index + 1).padStart(2, '0')}
            </motion.span>

            {/* Subtitle — with scan-line entrance */}
            <motion.p
                initial={{ opacity: 0, x: isLeft ? -20 : 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.15 }}
                className="text-xs font-cyber tracking-[0.5em] uppercase mb-5 relative z-10"
                style={{ color: isDark ? '#22d3ee' : '#71717a' }}
            >
                {point.subtitle}
            </motion.p>

            {/* Scan line that sweeps on chapter enter */}
            <motion.div
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ duration: 0.4, delay: 0.2 }}
                className={`h-px mb-6 origin-left ${isDark ? 'bg-gradient-to-r from-cyan-500/60 via-violet-500/30 to-transparent' : 'bg-gradient-to-r from-zinc-400/60 to-transparent'}`}
                style={{ transformOrigin: isLeft ? 'left' : 'right' }}
            />

            {/* Title — Gradient text */}
            <motion.h3
                initial={{ opacity: 0, y: 25 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.2 }}
                className="text-4xl md:text-6xl lg:text-7xl font-serif italic tracking-tight leading-[0.95] mb-6 relative z-10"
                style={{
                    background: isDark
                        ? 'linear-gradient(180deg, #ffffff 30%, #06b6d4 100%)'
                        : 'linear-gradient(180deg, #18181b 30%, #3b82f6 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                }}
            >
                {point.title}
            </motion.h3>

            {/* Description — staggered reveal */}
            <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.3 }}
                className={`text-base md:text-lg font-sans leading-relaxed relative z-10 ${isDark ? 'text-zinc-400' : 'text-zinc-600'}`}
            >
                {point.description}
            </motion.p>
        </motion.div>
    );
};

/* ─────────────────────────────────────────────
   MAIN COMPONENT
   ───────────────────────────────────────────── */
const Meander = ({ isDark }) => {
    const totalChapters = storyPoints.length;
    const sectionRef = useRef(null);
    const [activeIndex, setActiveIndex] = useState(-1);

    // Generate star data once
    const stars = useMemo(() => generateStars(180), []);

    const { scrollYProgress } = useScroll({
        target: sectionRef,
        offset: ["start start", "end end"]
    });

    // Scroll -> chapter mapping
    const titleEnd = 0.10;
    const chapterSize = (1 - titleEnd) / totalChapters;

    useMotionValueEvent(scrollYProgress, "change", (v) => {
        if (v < titleEnd) {
            setActiveIndex(-1);
        } else {
            const idx = Math.min(
                Math.floor((v - titleEnd) / chapterSize),
                totalChapters - 1
            );
            setActiveIndex(idx);
        }
    });

    // SVG path
    const { d: meanderPath, nodes } = buildMeanderPath(totalChapters);

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

    return (
        <section
            ref={sectionRef}
            className="relative"
            style={{
                height: `${(totalChapters * 3) * 100}vh`,
                background: isDark
                    ? 'linear-gradient(180deg, #030014 0%, #0a0a1a 30%, #050520 60%, #030014 100%)'
                    : 'linear-gradient(180deg, #fafafa 0%, #f0f0ff 50%, #fafafa 100%)',
            }}
        >
            {/* ─── STICKY VIEWPORT ─── */}
            <div className="sticky top-0 h-screen w-full overflow-hidden">

                {/* ═══════════════════════════════════════
                    LAYER 1: STAR FIELD
                    ═══════════════════════════════════════ */}
                {isDark && (
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
                                    backgroundColor: i % 5 === 0
                                        ? 'rgba(139, 92, 246, 0.8)'   // violet stars
                                        : i % 7 === 0
                                            ? 'rgba(6, 182, 212, 0.8)'  // cyan stars
                                            : `rgba(255, 255, 255, ${star.opacity})`,
                                    animation: `twinkle ${star.duration}s ease-in-out ${star.delay}s infinite`,
                                }}
                            />
                        ))}
                    </div>
                )}

                {/* ═══════════════════════════════════════
                    LAYER 2: NEBULA GRADIENT BLOBS
                    ═══════════════════════════════════════ */}
                {isDark && (
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
                                background: 'radial-gradient(circle, rgba(6,182,212,0.12) 0%, rgba(6,182,212,0.04) 40%, transparent 70%)',
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
                                background: 'radial-gradient(circle, rgba(139,92,246,0.1) 0%, rgba(139,92,246,0.03) 40%, transparent 70%)',
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
                                background: 'radial-gradient(circle, rgba(236,72,153,0.06) 0%, rgba(236,72,153,0.02) 40%, transparent 70%)',
                                animation: 'float-nebula 22s ease-in-out 6s infinite, pulse-glow 7s ease-in-out 4s infinite',
                            }}
                        />
                    </div>
                )}

                {/* ═══════════════════════════════════════
                    LAYER 3: HOLOGRAPHIC GRID OVERLAY
                    ═══════════════════════════════════════ */}
                {isDark && (
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
                )}

                {/* ═══════════════════════════════════════
                    LAYER 4: CRT SCAN LINES
                    ═══════════════════════════════════════ */}
                {isDark && (
                    <div
                        className="absolute inset-0 pointer-events-none z-[3]"
                        style={{
                            backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(6,182,212,0.015) 2px, rgba(6,182,212,0.015) 4px)',
                        }}
                    />
                )}

                {/* ═══════════════════════════════════════
                    LAYER 5: FLOATING GEOMETRIC SHAPES
                    ═══════════════════════════════════════ */}
                {isDark && (
                    <div className="absolute inset-0 pointer-events-none z-[4]">
                        {floatingShapes.map((shape, i) => (
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
                                <ShapeComponent type={shape.type} size={shape.size} />
                            </div>
                        ))}
                    </div>
                )}

                {/* ═══════════════════════════════════════
                    LAYER 5.5: DNA HELIX / HOURGLASS GALAXY
                    ═══════════════════════════════════════ */}
                <HelixField scrollProgress={scrollYProgress} isDark={isDark} />

                {/* ═══════════════════════════════════════
                    LAYER 6: DISTANT PLANET / MOON
                    ═══════════════════════════════════════ */}
                {isDark && (
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
                                background: 'radial-gradient(circle at 35% 35%, rgba(139,92,246,0.15) 0%, rgba(59,130,246,0.08) 40%, rgba(6,182,212,0.03) 70%, transparent 100%)',
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
                )}

                {/* ═══════════════════════════════════════
                    LAYER 7: AMBIENT RADIAL GRADIENT
                    ═══════════════════════════════════════ */}
                <div className={`absolute inset-0 pointer-events-none z-[5] ${isDark
                    ? 'bg-[radial-gradient(ellipse_60%_40%_at_50%_50%,rgba(6,182,212,0.06),transparent)]'
                    : 'bg-[radial-gradient(ellipse_60%_40%_at_50%_50%,rgba(228,228,231,0.4),transparent)]'
                    }`}
                />

                {/* ═══════════════════════════════════════
                    LAYER 8: SVG MEANDER LINE
                    ═══════════════════════════════════════ */}
                <div className="absolute inset-0 w-full h-full pointer-events-none z-10">
                    <svg
                        viewBox="0 0 100 100"
                        preserveAspectRatio="none"
                        className="w-full h-full"
                    >
                        <defs>
                            {/* Gradient for the lit path */}
                            <linearGradient id="meanderGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                                <stop offset="0%" stopColor={isDark ? "#06b6d4" : "#71717a"} />
                                <stop offset="50%" stopColor={isDark ? "#8b5cf6" : "#a1a1aa"} />
                                <stop offset="100%" stopColor={isDark ? "#ec4899" : "#71717a"} />
                            </linearGradient>

                            {/* Glow filter for path */}
                            <filter id="pathGlow" x="-300%" y="-300%" width="700%" height="700%">
                                <feGaussianBlur in="SourceGraphic" stdDeviation="2" result="blur1" />
                                <feGaussianBlur in="SourceGraphic" stdDeviation="0.8" result="blur2" />
                                <feMerge>
                                    <feMergeNode in="blur1" />
                                    <feMergeNode in="blur2" />
                                    <feMergeNode in="SourceGraphic" />
                                </feMerge>
                            </filter>

                            {/* Intense glow for the dot */}
                            <filter id="dotGlow" x="-500%" y="-500%" width="1100%" height="1100%">
                                <feGaussianBlur in="SourceGraphic" stdDeviation="4" result="blur1" />
                                <feGaussianBlur in="SourceGraphic" stdDeviation="2" result="blur2" />
                                <feGaussianBlur in="SourceGraphic" stdDeviation="0.5" result="blur3" />
                                <feMerge>
                                    <feMergeNode in="blur1" />
                                    <feMergeNode in="blur2" />
                                    <feMergeNode in="blur3" />
                                    <feMergeNode in="SourceGraphic" />
                                </feMerge>
                            </filter>

                            {/* Glow for active nodes */}
                            <filter id="nodeGlow" x="-200%" y="-200%" width="500%" height="500%">
                                <feGaussianBlur in="SourceGraphic" stdDeviation="1.5" />
                            </filter>
                        </defs>

                        {/* 1. Ghost base path — barely visible track */}
                        <path
                            d={meanderPath}
                            fill="none"
                            stroke={isDark ? "rgba(6,182,212,0.06)" : "rgba(0,0,0,0.04)"}
                            strokeWidth="0.5"
                            vectorEffect="non-scaling-stroke"
                        />

                        {/* 2. Lit gradient path — reveals on scroll */}
                        <motion.path
                            d={meanderPath}
                            fill="none"
                            stroke="url(#meanderGradient)"
                            strokeWidth="1"
                            vectorEffect="non-scaling-stroke"
                            pathLength="1"
                            strokeDasharray="1"
                            strokeDashoffset="1"
                            filter={isDark ? "url(#pathGlow)" : undefined}
                            style={{
                                strokeDashoffset: litPathOffset,
                                opacity: isDark ? 0.6 : 0.3,
                            }}
                        />

                        {/* 3. Wide glow halo around dot */}
                        <motion.path
                            d={meanderPath}
                            fill="none"
                            stroke={isDark ? "#06b6d4" : "rgba(0,0,0,0.2)"}
                            strokeWidth="6"
                            vectorEffect="non-scaling-stroke"
                            pathLength="1"
                            strokeDasharray="0.02 1"
                            filter="url(#dotGlow)"
                            style={{
                                strokeDashoffset: dotDashOffset,
                                opacity: dotVisibility,
                            }}
                        />

                        {/* 4. Core bright dot */}
                        <motion.path
                            d={meanderPath}
                            fill="none"
                            stroke={isDark ? "#ffffff" : "#000000"}
                            strokeWidth="5"
                            strokeLinecap="round"
                            vectorEffect="non-scaling-stroke"
                            pathLength="1"
                            strokeDasharray="0.008 1"
                            filter={isDark ? "url(#dotGlow)" : "url(#pathGlow)"}
                            style={{
                                strokeDashoffset: dotDashOffset,
                                opacity: dotVisibility,
                            }}
                        />

                        {/* 5. Node indicators — warp points */}
                        {nodes.map((pos, i) => (
                            <g key={i}>
                                {/* Outer glow ring (active only) */}
                                {activeIndex >= i && isDark && (
                                    <circle
                                        cx={pos.x}
                                        cy={pos.y}
                                        r="0.8"
                                        fill="none"
                                        stroke="#06b6d4"
                                        strokeWidth="0.15"
                                        filter="url(#nodeGlow)"
                                        style={{
                                            opacity: activeIndex === i ? 0.8 : 0.3,
                                            transition: 'opacity 0.5s ease',
                                        }}
                                    />
                                )}
                                {/* Core dot */}
                                <circle
                                    cx={pos.x}
                                    cy={pos.y}
                                    r="0.3"
                                    fill={isDark
                                        ? (activeIndex >= i ? "#22d3ee" : "rgba(6,182,212,0.15)")
                                        : (activeIndex >= i ? "#52525b" : "#d4d4d8")
                                    }
                                    style={{ transition: 'fill 0.5s ease' }}
                                />
                            </g>
                        ))}
                    </svg>
                </div>

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
                        {activeIndex >= 0 && activeIndex < totalChapters && (
                            <ChapterText
                                key={activeIndex}
                                point={storyPoints[activeIndex]}
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
                                width="16" height="8" viewBox="0 0 16 8"
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
                <div className={`absolute bottom-10 right-10 flex flex-col gap-3 z-30 ${activeIndex < 0 ? 'opacity-0' : 'opacity-100'} transition-opacity duration-500`}>
                    {storyPoints.map((_, i) => (
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
                                        ? (activeIndex >= i ? 'rgba(6,182,212,0.5)' : 'rgba(6,182,212,0.1)')
                                        : (activeIndex >= i ? 'rgba(0,0,0,0.3)' : 'rgba(0,0,0,0.1)')
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
                                            ? (activeIndex === i
                                                ? '#22d3ee'
                                                : activeIndex > i
                                                    ? 'rgba(6,182,212,0.5)'
                                                    : 'rgba(6,182,212,0.1)')
                                            : (activeIndex === i
                                                ? '#18181b'
                                                : activeIndex > i
                                                    ? '#71717a'
                                                    : '#d4d4d8'),
                                        boxShadow: isDark && activeIndex === i
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
};

export default Meander;
