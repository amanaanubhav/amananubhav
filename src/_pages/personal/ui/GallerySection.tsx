'use client';

import { useState, useEffect, useCallback, useMemo, useRef, type WheelEvent } from 'react';
import { motion, AnimatePresence, type Variants } from 'motion/react';

import { useTheme } from '@/shared/lib/theme';

import { GALLERY_ITEMS } from '../config/content';
import { useInterval } from '../lib/use-interval';

type SlotPosition = 'left' | 'center' | 'right';

const VIDEO_RE = /\.(mp4|webm|ogg)$/i;

interface Card3DProps {
    src: string;
    isActive: boolean;
    onClick: () => void;
}

const Card3D = ({ src, isActive, onClick }: Card3DProps) => {
    const isValid = typeof src === 'string' && src.length > 0;
    const isVideo = isValid && VIDEO_RE.test(src);
    const isYoutube = isValid && src.includes("youtube.com/embed");
    const videoRef = useRef<HTMLVideoElement>(null);

    useEffect(() => {
        if (isVideo && videoRef.current) {
            if (isActive) {
                const playPromise = videoRef.current.play();
                if (playPromise !== undefined) {
                    playPromise.catch((error: unknown) => {
                        console.log("Auto-play was prevented:", error);
                    });
                }
            } else {
                videoRef.current.pause();
            }
        }
    }, [isActive, isVideo]);

    // Defensive guard: ensure src exists (after hooks, rules-of-hooks)
    if (!isValid) return null;

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
                // eslint-disable-next-line @next/next/no-img-element
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

const variants: Variants = {
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

interface DesktopCardGalleryProps {
    items: readonly string[];
    isDark: boolean;
}

const DesktopCardGallery = ({ items, isDark }: DesktopCardGalleryProps) => {
    const [activeIndex, setActiveIndex] = useState(0);
    const [isAnimating, setIsAnimating] = useState(false);
    const [isHovered, setIsHovered] = useState(false);
    const hasItems = Array.isArray(items) && items.length > 0;

    // Safe Helper for Circular Index
    const getIndex = useCallback((idx: number) => {
        const len = items.length;
        return ((idx % len) + len) % len;
    }, [items.length]);

    // Handlers
    const handleNext = useCallback(() => {
        if (isAnimating) return;
        setIsAnimating(true);
        setActiveIndex((prev) => getIndex(prev + 1));
        setTimeout(() => setIsAnimating(false), 500);
    }, [isAnimating, getIndex]);

    const handlePrev = useCallback(() => {
        if (isAnimating) return;
        setIsAnimating(true);
        setActiveIndex((prev) => getIndex(prev - 1));
        setTimeout(() => setIsAnimating(false), 500);
    }, [isAnimating, getIndex]);

    // Keyboard Listener
    useEffect(() => {
        const handleKey = (e: KeyboardEvent) => {
            if (e.key === "ArrowRight") handleNext();
            if (e.key === "ArrowLeft") handlePrev();
        };
        window.addEventListener("keydown", handleKey);
        return () => window.removeEventListener("keydown", handleKey);
    }, [handleNext, handlePrev]);

    // Auto-scroll loop (paused while hovered)
    const autoAdvance = useCallback(() => {
        setActiveIndex((prev) => getIndex(prev + 1));
    }, [getIndex]);
    useInterval(autoAdvance, !isHovered && hasItems ? 1500 : null);

    // Scroll/Wheel Support
    const handleWheel = useCallback((e: WheelEvent<HTMLDivElement>) => {
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

    // Compute Visible Items Safely
    const visibleItems = useMemo(() => {
        if (!hasItems) return [];
        const prevIndex = getIndex(activeIndex - 1);
        const nextIndex = getIndex(activeIndex + 1);

        const slots: { index: number; position: SlotPosition }[] = [
            { index: prevIndex, position: 'left' },
            { index: activeIndex, position: 'center' },
            { index: nextIndex, position: 'right' }
        ];

        // Deduplicate based on index; when indices overlap (< 3 items) keep Center.
        const uniqueMap = new Map<number, SlotPosition>();
        slots.forEach(slot => {
            if (!uniqueMap.has(slot.index)) {
                uniqueMap.set(slot.index, slot.position);
            } else {
                if (slot.position === 'center') uniqueMap.set(slot.index, 'center');
            }
        });

        return Array.from(uniqueMap.entries()).map(([idx, pos]) => ({
            index: idx,
            position: pos,
            src: items[idx]
        }));

    }, [activeIndex, getIndex, items, hasItems]);

    // Initial Data Guard (after hooks, rules-of-hooks)
    if (!hasItems) {
        return null;
    }

    return (
        <div
            onWheel={handleWheel}
            className={`relative w-full h-[80vh] min-h-[600px] flex flex-col items-center justify-center overflow-hidden isolate perspective-container transition-colors duration-500`}
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

const PhotoCardMobile = ({ src }: { src: string }) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    if (!src) return null;
    const isVideo = VIDEO_RE.test(src);
    const isYoutube = src.includes("youtube.com/embed");

    return (
        <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            onViewportEnter={() => { if (isVideo) void videoRef.current?.play(); }}
            onViewportLeave={() => { if (isVideo) videoRef.current?.pause(); }}
            className="group relative w-full aspect-[4/5] overflow-hidden rounded-sm transition-all duration-500"
        >
            {isYoutube ? (
                <iframe src={`${src.split('?')[0]}?controls=0&autoplay=0&mute=1&loop=1&playlist=${src.split('/embed/')[1]?.split('?')[0]}&showinfo=0&rel=0`} className="w-full h-full object-cover pointer-events-none scale-[1.35]" />
            ) : isVideo ? (
                <video ref={videoRef} src={src} loop muted playsInline className="w-full h-full object-cover" />
            ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={src} alt="" className="w-full h-full object-cover" loading="lazy" />
            )}
        </motion.div>
    );
};

const MobileGallery = ({ images }: { images: readonly string[] }) => {
    return (
        <div className="flex overflow-x-auto snap-x snap-mandatory px-6 gap-4 pb-10 no-scrollbar">
            {images.map((src, i) => (
                <div key={i} className="flex-shrink-0 w-[80vw] snap-center">
                    <PhotoCardMobile src={src} />
                </div>
            ))}
        </div>
    );
};

export function GallerySection() {
    const { isDark } = useTheme();

    return (
        <section className={`relative w-full z-0 ${isDark ? 'bg-black text-white' : 'bg-white text-zinc-900'}`}>
            {/* Desktop */}
            <div className="hidden lg:block">
                <DesktopCardGallery items={GALLERY_ITEMS} isDark={isDark} />
            </div>

            {/* Mobile */}
            <div className="block lg:hidden py-10">
                <div className="mb-8 text-center px-6">
                    <p className="text-[10px] font-mono uppercase tracking-[0.2em] opacity-60">{/* Archive // Mobile */}</p>
                </div>
                <MobileGallery images={GALLERY_ITEMS} />
            </div>
        </section>
    );
}
