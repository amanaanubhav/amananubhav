import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const rawImages = [
    "/G1.webp", "/G2.webp", "/G21.webp", "/G8.webp", "/GV7.mp4",
    "/G12.webp", "/G5.webp", "/G9.webp", "/GV3.mp4", "/G17.jpg",
    "/G6.webp", "/G11.webp", "/G20.webp", "/GV16.mp4", "/G18.jpg",
    "/G19.jpg", "/G13.webp", "/G14.webp", "/GV10.mp4", "/G4.webp"
];

const Card3D = ({ src, isActive, onClick }) => {
    // Defensive guard: ensure src exists
    if (!src || typeof src !== 'string') return null;

    const isVideo = src.match(/\.(mp4|webm|ogg)$/i);
    const isYoutube = src.includes("youtube.com/embed");
    const videoRef = useRef(null);

    useEffect(() => {
        if (isVideo && videoRef.current) {
            if (isActive) {
                const playPromise = videoRef.current.play();
                if (playPromise !== undefined) {
                    playPromise.catch(error => {
                        console.log("Auto-play was prevented:", error);
                    });
                }
            } else {
                videoRef.current.pause();
            }
        }
    }, [isActive, isVideo]);

    return (
        <div
            onClick={onClick}
            className={`
                relative w-full h-full overflow-hidden rounded-md bg-zinc-900 border border-zinc-800 shadow-2xl origin-center
                transition-all duration-500 ease-out
                ${isActive ? 'cursor-default group z-20' : 'cursor-pointer grayscale opacity-40 hover:opacity-70 z-10'}
            `}
        >
            {/* Active Glow */}
            {isActive && (
                <div className="absolute inset-0 z-20 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-700 bg-gradient-to-t from-white/10 via-transparent to-transparent mix-blend-overlay" />
            )}

            {/* Media */}
            {isYoutube ? (
                <iframe
                    src={`${src.split('?')[0]}?controls=0&autoplay=${isActive ? 1 : 0}&mute=1&loop=1&playlist=${src.split('/embed/')[1]?.split('?')[0]}&showinfo=0&rel=0&iv_load_policy=3&modestbranding=1&disablekb=1`}
                    title="YT"
                    frameBorder="0"
                    className={`absolute inset-0 w-full h-full object-cover pointer-events-none ${isActive ? 'grayscale-0' : 'grayscale'}`}
                />
            ) : isVideo ? (
                <video
                    ref={videoRef}
                    src={src}
                    loop
                    muted
                    playsInline
                    className={`
                        w-full h-full object-cover
                        transition-[filter,transform] duration-700 ease-out
                        ${isActive ? 'grayscale group-hover:grayscale-0 group-hover:scale-[1.02]' : 'grayscale'}
                    `}
                />
            ) : (
                <img
                    src={src}
                    alt="Gallery"
                    className={`
                        w-full h-full object-cover
                        transition-[filter,transform] duration-700 ease-out
                        ${isActive ? 'grayscale group-hover:grayscale-0 group-hover:scale-[1.02]' : 'grayscale'}
                    `}
                    loading="lazy"
                />
            )}
        </div>
    );
};

const DesktopCardGallery = ({ items, isDark }) => {
    // 1. Initial Data Guard
    if (!items || !Array.isArray(items) || items.length === 0) {
        return null;
    }

    const [activeIndex, setActiveIndex] = useState(0);
    const [isAnimating, setIsAnimating] = useState(false);

    // 2. Safe Helper for Circular Index
    const getIndex = useCallback((idx) => {
        const len = items.length;
        return ((idx % len) + len) % len;
    }, [items.length]);

    // 3. Handlers
    const handleNext = useCallback(() => {
        if (isAnimating) return;
        setIsAnimating(true);
        setActiveIndex((prev) => getIndex(prev + 1));
        // Unlock slightly faster to allow rapid clicks if desired, but kept to anim duration
        setTimeout(() => setIsAnimating(false), 500);
    }, [isAnimating, getIndex]);

    const handlePrev = useCallback(() => {
        if (isAnimating) return;
        setIsAnimating(true);
        setActiveIndex((prev) => getIndex(prev - 1));
        setTimeout(() => setIsAnimating(false), 500);
    }, [isAnimating, getIndex]);

    // 4. Keyboard Listener
    useEffect(() => {
        const handleKey = (e) => {
            if (e.key === "ArrowRight") handleNext();
            if (e.key === "ArrowLeft") handlePrev();
        };
        window.addEventListener("keydown", handleKey);
        return () => window.removeEventListener("keydown", handleKey);
    }, [handleNext, handlePrev]);

    // 5. Scroll/Wheel Support
    const handleWheel = useCallback((e) => {
        if (isAnimating) return;

        // Threshold to prevent accidental jitters
        if (Math.abs(e.deltaX) < 10 && Math.abs(e.deltaY) < 10) return;

        // Determine primary direction
        const isHorizontal = Math.abs(e.deltaX) > Math.abs(e.deltaY);

        if (isHorizontal) {
            if (e.deltaX > 0) handleNext();
            else handlePrev();
        } else {
            // Vertical scroll: Down -> Next, Up -> Prev
            if (e.deltaY > 0) handleNext();
            else handlePrev();
        }
    }, [isAnimating, handleNext, handlePrev]);

    // 6. Variants
    const variants = {
        center: {
            x: 0,
            scale: 1,
            zIndex: 20,
            opacity: 1,
            rotateY: 0,
            filter: "brightness(1)",
            transition: { type: "spring", stiffness: 200, damping: 25 }
        },
        left: {
            x: -350,
            scale: 0.8,
            zIndex: 10,
            opacity: 0.6,
            rotateY: 25,
            filter: "brightness(0.5)",
            transition: { type: "spring", stiffness: 200, damping: 25 }
        },
        right: {
            x: 350,
            scale: 0.8,
            zIndex: 10,
            opacity: 0.6,
            rotateY: -25,
            filter: "brightness(0.5)",
            transition: { type: "spring", stiffness: 200, damping: 25 }
        },
        hidden: {
            opacity: 0,
            scale: 0.0,
            zIndex: 0,
            transition: { duration: 0.2 }
        }
    };

    // 7. Compute Visible Items Safely
    const visibleItems = useMemo(() => {
        const prevIndex = getIndex(activeIndex - 1);
        const nextIndex = getIndex(activeIndex + 1);

        // Define positions locally
        const slots = [
            { index: prevIndex, position: 'left' },
            { index: activeIndex, position: 'center' },
            { index: nextIndex, position: 'right' }
        ];

        // Deduplicate based on index to strict unique keys
        const uniqueMap = new Map();
        slots.forEach(slot => {
            // If items.length < 3, indices overlap. Map handles last-write-wins (not ideal).
            // Better: Allow overlap but use unique composite key?
            // User requires 3 frames. If only 1 image, prev=0, curr=0, next=0.
            if (!uniqueMap.has(slot.index)) {
                uniqueMap.set(slot.index, slot.position);
            } else {
                // Optimization: If index 0 is both center and prev (1 item list), keep Center.
                if (slot.position === 'center') uniqueMap.set(slot.index, 'center');
            }
        });

        return Array.from(uniqueMap.entries()).map(([idx, pos]) => ({
            index: idx,
            position: pos,
            src: items[idx]
        }));

    }, [activeIndex, getIndex, items]);

    return (
        <div
            onWheel={handleWheel}
            className={`relative w-full h-[80vh] min-h-[600px] flex flex-col items-center justify-center overflow-hidden isolate perspective-container transition-colors duration-500 ${isDark ? 'bg-zinc-950' : 'bg-gray-50'}`}
        >

            {/* Header */}
            <div className="absolute top-12 text-center z-10 pointer-events-none">
                <p className={`text-[10px] font-mono tracking-[0.3em] uppercase ${isDark ? 'text-zinc-500' : 'text-zinc-400'}`}>Archive Secure Deck</p>
            </div>

            {/* 3D Stage */}
            <div className="relative w-full max-w-[1000px] h-[500px] flex items-center justify-center perspective-[1200px]" style={{ perspective: '1200px' }}>
                <AnimatePresence initial={false}>
                    {visibleItems.map((item) => (
                        <motion.div
                            key={item.src} // Stable Image Key
                            className="absolute w-[500px] h-[350px] md:w-[600px] md:h-[400px] flex items-center justify-center"
                            initial={false}
                            animate={item.position}
                            variants={variants}
                            style={{ transformStyle: 'preserve-3d' }}
                            exit="hidden"
                        >
                            <Card3D
                                src={item.src}
                                isActive={item.position === 'center'}
                                onClick={() => {
                                    if (item.position === 'left') handlePrev();
                                    if (item.position === 'right') handleNext();
                                }}
                            />
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>

            {/* Controls */}
            <div className="absolute bottom-6 flex items-center gap-12 z-30">
                <button
                    onClick={handlePrev}
                    className={`p-3 rounded-full border transition-all active:scale-95 ${isDark
                        ? 'border-zinc-800 text-zinc-500 hover:text-white hover:border-zinc-600 hover:bg-zinc-900'
                        : 'border-zinc-300 text-zinc-400 hover:text-zinc-900 hover:border-zinc-400 hover:bg-white'
                        }`}
                >
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M15 18l-6-6 6-6" /></svg>
                </button>

                <span className={`font-mono text-xs tracking-widest ${isDark ? 'text-zinc-600' : 'text-zinc-400'}`}>
                    {String(activeIndex + 1).padStart(2, '0')} / {String(items.length).padStart(2, '0')}
                </span>

                <button
                    onClick={handleNext}
                    className={`p-3 rounded-full border transition-all active:scale-95 ${isDark
                        ? 'border-zinc-800 text-zinc-500 hover:text-white hover:border-zinc-600 hover:bg-zinc-900'
                        : 'border-zinc-300 text-zinc-400 hover:text-zinc-900 hover:border-zinc-400 hover:bg-white'
                        }`}
                >
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M9 18l6-6-6-6" /></svg>
                </button>
            </div>
        </div>
    );
};

// MOBILE GALLERY (Safe & Simple)

const PhotoCardMobile = ({ src, index }) => {
    if (!src) return null;
    const isVideo = src.match(/\.(mp4|webm|ogg)$/i);
    const isYoutube = src.includes("youtube.com/embed");

    return (
        <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            className="group relative w-full aspect-[4/5] overflow-hidden rounded-sm grayscale hover:grayscale-0 transition-all duration-500"
        >
            {isYoutube ? (
                <iframe src={`${src.split('?')[0]}?controls=0&autoplay=0&mute=1&loop=1&playlist=${src.split('/embed/')[1]?.split('?')[0]}&showinfo=0&rel=0`} className="w-full h-full object-cover pointer-events-none scale-[1.35]" />
            ) : isVideo ? (
                <video src={src} autoPlay loop muted playsInline className="w-full h-full object-cover" />
            ) : (
                <img src={src} alt="" className="w-full h-full object-cover" loading="lazy" />
            )}
        </motion.div>
    );
};

const MobileGallery = ({ images }) => {
    return (
        <div className="flex overflow-x-auto snap-x snap-mandatory px-6 gap-4 pb-10 no-scrollbar">
            {images.map((src, i) => (
                <div key={i} className="flex-shrink-0 w-[80vw] snap-center">
                    <PhotoCardMobile src={src} index={i} />
                </div>
            ))}
        </div>
    );
};


// MAIN EXPORT

const ParallaxPortfolio = ({ isDark }) => {
    return (
        <section className={`relative w-full z-0 ${isDark ? 'bg-zinc-950 text-white' : 'bg-gray-50 text-zinc-900'} min-h-screen`}>
            {/* Desktop */}
            <div className="hidden lg:block">
                <DesktopCardGallery items={rawImages} isDark={isDark} />
            </div>

            {/* Mobile */}
            <div className="block lg:hidden py-10">
                <div className="mb-8 text-center px-6">
                    <p className="text-[10px] font-mono uppercase tracking-[0.2em] opacity-60">Archive // Mobile</p>
                </div>
                <MobileGallery images={rawImages} />
            </div>
        </section>
    );
};

export default ParallaxPortfolio;