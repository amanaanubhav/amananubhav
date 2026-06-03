import React, { useRef, useState } from 'react';
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
            {/* Chapter Number */}
            <motion.span
                initial={{ opacity: 0, x: isLeft ? -30 : 30 }}
                animate={{ opacity: 0.3, x: 0 }}
                transition={{ duration: 0.6, delay: 0.1 }}
                className={`block text-[8rem] md:text-[12rem] font-serif font-black leading-none absolute -top-16 md:-top-24 ${isLeft ? '-left-2' : '-right-2'} ${isDark ? 'text-zinc-800' : 'text-zinc-200'} pointer-events-none select-none`}
            >
                {String(index + 1).padStart(2, '0')}
            </motion.span>

            {/* Subtitle */}
            <motion.p
                initial={{ opacity: 0, x: isLeft ? -20 : 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.15 }}
                className={`text-xs font-cyber tracking-[0.5em] uppercase mb-5 relative z-10 ${isDark ? 'text-zinc-500' : 'text-zinc-400'}`}
            >
                {point.subtitle}
            </motion.p>

            {/* Title */}
            <motion.h3
                initial={{ opacity: 0, y: 25 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.2 }}
                className={`text-4xl md:text-6xl lg:text-7xl font-serif italic tracking-tight leading-[0.95] mb-6 relative z-10 ${isDark ? 'text-white' : 'text-zinc-900'}`}
            >
                {point.title}
            </motion.h3>

            {/* Description */}
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
const StoryGuide = ({ isDark }) => {
    const totalChapters = storyPoints.length;
    const sectionRef = useRef(null);
    const [activeIndex, setActiveIndex] = useState(-1);

    const { scrollYProgress } = useScroll({
        target: sectionRef,
        offset: ["start start", "end end"]
    });

    // Scroll -> chapter mapping
    // First ~12% is the title. Remaining split equally among chapters.
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
    // Lit path: strokeDashoffset goes from 1 (hidden) to 0 (fully drawn)
    const litPathOffset = useTransform(scrollYProgress, (v) => 1 - v);

    // Bright dot: positioned at the leading edge of the drawn path
    // With strokeDasharray="0.008 1", a positive dashoffset shifts the tiny dash
    // backward along the path. offset = (1 - scrollYProgress) places it at the edge.
    const dotDashOffset = useTransform(scrollYProgress, (v) => 1 - v);

    // Dot visibility: appears as soon as user starts scrolling, disappears at the end
    const dotVisibility = useTransform(scrollYProgress, [0, 0.005, 0.97, 1], [0, 1, 1, 0]);

    // Title opacity
    const titleOpacity = useTransform(scrollYProgress, [0, 0.06, titleEnd], [1, 1, 0]);
    const titleY = useTransform(scrollYProgress, [0, titleEnd], [0, -60]);

    // "Scroll" hint
    const hintOpacity = useTransform(scrollYProgress, [0, 0.03, 0.12, 0.15], [0, 0.5, 0.5, 0]);

    return (
        <section
            ref={sectionRef}
            className={`relative ${isDark ? 'bg-zinc-950' : 'bg-gray-50'}`}
            // Increase the total height to give each chapter much more scroll distance
            style={{ height: `${(totalChapters * 3) * 100}vh` }}
        >
            {/* ─── STICKY VIEWPORT (scroll-locked screen) ─── */}
            <div className="sticky top-0 h-screen w-full overflow-hidden">

                {/* Ambient radial gradient */}
                <div className={`absolute inset-0 pointer-events-none ${isDark
                    ? 'bg-[radial-gradient(ellipse_60%_40%_at_50%_50%,rgba(39,39,42,0.3),transparent)]'
                    : 'bg-[radial-gradient(ellipse_60%_40%_at_50%_50%,rgba(228,228,231,0.4),transparent)]'
                    }`}
                />

                {/* ─── SVG MEANDER LINE ─── */}
                <div className="absolute inset-0 w-full h-full pointer-events-none z-10">
                    <svg
                        viewBox="0 0 100 100"
                        preserveAspectRatio="none"
                        className="w-full h-full"
                    >
                        <defs>
                            <filter id="trailGlow" x="-300%" y="-300%" width="700%" height="700%">
                                <feGaussianBlur in="SourceGraphic" stdDeviation="3" result="blur1" />
                                <feGaussianBlur in="SourceGraphic" stdDeviation="1" result="blur2" />
                                <feMerge>
                                    <feMergeNode in="blur1" />
                                    <feMergeNode in="blur2" />
                                    <feMergeNode in="SourceGraphic" />
                                </feMerge>
                            </filter>
                        </defs>

                        {/* 1. Near-invisible base path (the full track, barely visible) */}
                        <path
                            d={meanderPath}
                            fill="none"
                            stroke={isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.04)"}
                            strokeWidth="0.5"
                            vectorEffect="non-scaling-stroke"
                        />

                        {/* 2. Bright lit-up path (reveals as user scrolls down, hides on scroll up) */}
                        <motion.path
                            d={meanderPath}
                            fill="none"
                            stroke={isDark ? "rgba(255,255,255,0.2)" : "rgba(0,0,0,0.2)"}
                            strokeWidth="0.8"
                            vectorEffect="non-scaling-stroke"
                            pathLength="1"
                            strokeDasharray="1"
                            strokeDashoffset="1"
                            style={{
                                strokeDashoffset: litPathOffset,
                            }}
                        />

                        {/* 3. Glow halo around the dot (wider, softer) */}
                        <motion.path
                            d={meanderPath}
                            fill="none"
                            stroke={isDark ? "rgba(255,255,255,0.3)" : "rgba(0,0,0,0.3)"}
                            strokeWidth="4"
                            vectorEffect="non-scaling-stroke"
                            pathLength="1"
                            strokeDasharray="0.02 1"
                            filter="url(#trailGlow)"
                            style={{
                                strokeDashoffset: dotDashOffset,
                                opacity: dotVisibility,
                            }}
                        />

                        {/* 4. BRIGHT DOT (small, intense, follows scroll) */}
                        <motion.path
                            d={meanderPath}
                            fill="none"
                            stroke={isDark ? "#ffffff" : "#000000"}
                            strokeWidth="5"
                            strokeLinecap="round"
                            vectorEffect="non-scaling-stroke"
                            pathLength="1"
                            strokeDasharray="0.008 1"
                            filter="url(#trailGlow)"
                            style={{
                                strokeDashoffset: dotDashOffset,
                                opacity: dotVisibility,
                            }}
                        />

                        {/* 5. Node indicator dots along the path */}
                        {nodes.map((pos, i) => (
                            <circle
                                key={i}
                                cx={pos.x}
                                cy={pos.y}
                                r="0.3"
                                fill={isDark
                                    ? (activeIndex >= i ? "#a1a1aa" : "#27272a")
                                    : (activeIndex >= i ? "#52525b" : "#d4d4d8")
                                }
                                style={{ transition: 'fill 0.5s ease' }}
                            />
                        ))}
                    </svg>
                </div>

                {/* ─── TITLE SCREEN (fades out as you scroll into chapters) ─── */}
                <motion.div
                    className="absolute inset-0 flex flex-col items-center justify-center z-20 pointer-events-none"
                    style={{ opacity: titleOpacity, y: titleY }}
                >
                    <p className={`text-xs md:text-sm font-cyber tracking-[0.6em] uppercase mb-8 ${isDark ? 'text-zinc-600' : 'text-zinc-400'}`}>
                        The Narrative
                    </p>
                    <h2 className={`text-6xl md:text-8xl lg:text-[9rem] font-serif italic tracking-tight leading-none ${isDark ? 'text-white' : 'text-black'}`}>
                        Meander
                    </h2>
                </motion.div>

                {/* ─── CHAPTER TEXT (one at a time, positioned to left or right of center line) ─── */}
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

                {/* ─── SCROLL HINT ─── */}
                <motion.div
                    className={`absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-3 z-30 ${isDark ? 'text-zinc-600' : 'text-zinc-400'}`}
                    style={{ opacity: hintOpacity }}
                >
                    <span className="text-xs font-cyber tracking-[0.4em] uppercase">Scroll to explore</span>
                    <motion.div
                        animate={{ y: [0, 8, 0] }}
                        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                        className={`w-[1px] h-6 ${isDark ? 'bg-zinc-600' : 'bg-zinc-400'}`}
                    />
                </motion.div>

                {/* ─── PROGRESS DOTS (bottom right) ─── */}
                <div className={`absolute bottom-10 right-10 flex flex-col gap-2 z-30 ${activeIndex < 0 ? 'opacity-0' : 'opacity-100'} transition-opacity duration-500`}>
                    {storyPoints.map((_, i) => (
                        <div
                            key={i}
                            className={`w-1.5 h-1.5 rounded-full transition-all duration-500 ${activeIndex === i
                                ? (isDark ? 'bg-white scale-125' : 'bg-black scale-125')
                                : activeIndex > i
                                    ? (isDark ? 'bg-zinc-600' : 'bg-zinc-400')
                                    : (isDark ? 'bg-zinc-800' : 'bg-zinc-200')
                                }`}
                        />
                    ))}
                </div>
            </div>
        </section>
    );
};

export default StoryGuide;
