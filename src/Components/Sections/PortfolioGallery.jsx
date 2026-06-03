import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const rawImages = [
    "/G1.webp", "/G21.webp", "/G8.webp",
    "/G5.webp", "/G6.webp", "/GV16.mp4",
    "/G13.webp", "/G14.webp", "/GV10.mp4",
    "/G2.webp", "/G9.webp", "/GV7.mp4",
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
                ${isActive ? 'cursor-default group z-20 hover:scale-[1.02]' : 'cursor-pointer opacity-40 hover:opacity-70 z-10'}
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
                    className="absolute inset-0 w-full h-full object-cover pointer-events-none"
                />
            ) : isVideo ? (
                <video
                    ref={videoRef}
                    src={src}
                    loop
                    muted
                    playsInline
                    className="w-full h-full object-cover transition-[filter,transform] duration-700 ease-out"
                />
            ) : (
                <img
                    src={src}
                    alt="Gallery"
                    className="w-full h-full object-cover transition-[filter,transform] duration-700 ease-out"
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
    const [isHovered, setIsHovered] = useState(false);

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

    // Auto-scroll loop
    useEffect(() => {
        if (!isHovered) {
            const interval = setInterval(() => {
                setActiveIndex((prev) => getIndex(prev + 1));
            }, 1500);
            return () => clearInterval(interval);
        }
    }, [isHovered, getIndex]);

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
            transition: { type: "tween", ease: "easeInOut", duration: 0.6 }
        },
        left: {
            x: -300,
            scale: 0.6,
            zIndex: 10,
            opacity: 0.6,
            rotateY: 25,
            filter: "brightness(0.5)",
            transition: { type: "tween", ease: "easeInOut", duration: 0.6 }
        },
        right: {
            x: 300,
            scale: 0.6,
            zIndex: 10,
            opacity: 0.6,
            rotateY: -25,
            filter: "brightness(0.5)",
            transition: { type: "tween", ease: "easeInOut", duration: 0.6 }
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
            className={`relative w-full h-[80vh] min-h-[600px] flex flex-col items-center justify-center overflow-hidden isolate perspective-container transition-colors duration-500 ${isDark ? 'bg-black' : 'bg-white'}`}
        >

            {/* Header */}
            <div className="absolute top-12 text-center z-10 pointer-events-none">
                <p className={`text-[10px] font-mono tracking-[0.3em] uppercase ${isDark ? 'text-zinc-500' : 'text-zinc-400'}`}>{/* Archive Secure Deck */}</p>
            </div>

            {/* 3D Stage */}
            <div
                className="relative w-full max-w-[1000px] h-[500px] flex items-center justify-center perspective-[1200px]"
                style={{ perspective: '1200px' }}
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
            >
                <AnimatePresence initial={false}>
                    {visibleItems.map((item) => (
                        <motion.div
                            key={item.src} // Stable Image Key
                            className="absolute w-[400px] h-[280px] md:w-[480px] md:h-[320px] flex items-center justify-center"
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
        </div>
    );
};

// MOBILE GALLERY (Safe & Simple)

const PhotoCardMobile = ({ src, index }) => {
    if (!src) return null;
    const isVideo = src.match(/\.(mp4|webm|ogg)$/i);
    const isYoutube = src.includes("youtube.com/embed");
    const videoRef = useRef(null);

    return (
        <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            onViewportEnter={() => isVideo && videoRef.current?.play()}
            onViewportLeave={() => isVideo && videoRef.current?.pause()}
            className="group relative w-full aspect-[4/5] overflow-hidden rounded-sm transition-all duration-500"
        >
            {isYoutube ? (
                <iframe src={`${src.split('?')[0]}?controls=0&autoplay=0&mute=1&loop=1&playlist=${src.split('/embed/')[1]?.split('?')[0]}&showinfo=0&rel=0`} className="w-full h-full object-cover pointer-events-none scale-[1.35]" />
            ) : isVideo ? (
                <video ref={videoRef} src={src} loop muted playsInline className="w-full h-full object-cover" />
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
        <section className={`relative w-full z-0 ${isDark ? 'bg-black text-white' : 'bg-zinc-100 text-zinc-900'} min-h-screen`}>
            {/* Desktop */}
            <div className="hidden lg:block">
                <DesktopCardGallery items={rawImages} isDark={isDark} />
            </div>

            {/* Mobile */}
            <div className="block lg:hidden py-10">
                <div className="mb-8 text-center px-6">
                    <p className="text-[10px] font-mono uppercase tracking-[0.2em] opacity-60">{/* Archive // Mobile */}</p>
                </div>
                <MobileGallery images={rawImages} />
            </div>
        </section>
    );
};

export default ParallaxPortfolio;