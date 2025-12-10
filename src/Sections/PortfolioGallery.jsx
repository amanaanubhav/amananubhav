import React, { useRef } from 'react';
import { useScroll, useTransform, motion } from 'framer-motion';

// Mock Data
const images = [
    // Column 1 - Travel & Nature
    [
        "/G1.jpg",
        "/G2.jpg",
        "/G21.jpg",
        "/G8.jpg",
        "/GV7.mp4",
    ],
    // Column 2 - Inverse
    [
        "/G12.jpg",
        "/G5.jpg",
        "/G9.jpg",
        "/GV3.mp4",
        "/G17.jpg",
    ],
    // Column 3
    [
        "/G6.jpg",
        "/G11.jpg",
        "/G20.jpg",
        "/GV16.mp4",
        "/G18.jpg",
    ],
    // Column 4 - Inverse
    [
        "/G19.jpg",
        "/G13.jpg",
        "/G14.jpg",
        "/GV10.mp4",
        "/G4.jpg",
    ],
];

const PhotoCard = ({ src, index, className, imgClassName }) => {
    if (!src) return null; // Handle empty strings

    const isVideo = src.match(/\.(mp4|webm|ogg)$/i);
    const isYoutube = src.includes("youtube.com/embed");

    // Default image classes if not overridden
    const defaultImgClass = "w-full h-auto object-cover transform scale-100 group-hover:scale-110 transition-transform duration-700 ease-in-out will-change-transform";
    const appliedImgClass = imgClassName || defaultImgClass;

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: index * 0.05, ease: "easeOut" }}
            viewport={{ once: true, margin: "100px" }}
            className={`group relative w-full overflow-hidden rounded-sm grayscale hover:grayscale-0 transition-all duration-700 ease-in-out cursor-pointer ${className || 'mb-4 md:mb-6'}`}
        >
            <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors z-10 pointer-events-none" />

            {isYoutube ? (
                <div className={`relative w-full pointer-events-none ${imgClassName ? 'h-full' : 'aspect-[9/16]'}`}>
                    <iframe
                        src={`${src.split('?')[0]}?controls=0&autoplay=1&mute=1&loop=1&playlist=${src.split('/embed/')[1].split('?')[0]}&showinfo=0&rel=0&iv_load_policy=3&modestbranding=1&disablekb=1`}
                        title="YouTube video player"
                        frameBorder="0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                        className="absolute inset-0 w-full h-full object-cover scale-[1.35]"
                    ></iframe>
                </div>
            ) : isVideo ? (
                <motion.video
                    src={src}
                    autoPlay
                    loop
                    muted
                    playsInline
                    className={appliedImgClass}
                />
            ) : (
                <motion.img
                    src={src}
                    alt="Gallery Item"
                    className={appliedImgClass}
                    loading="lazy"
                />
            )}
        </motion.div>
    );
};

const ParallaxColumn = ({ images, y, className }) => {
    return (
        <motion.div style={{ y }} className={`flex flex-col w-full ${className}`}>
            {images.map((src, i) => (
                <PhotoCard key={i} src={src} index={i} />
            ))}
        </motion.div>
    );
};

const MobileGallery = ({ images }) => {
    const containerRef = useRef(null);


    const [activeIndex, setActiveIndex] = React.useState(0);

    const handleScroll = () => {
        if (!containerRef.current) return;
        const container = containerRef.current;
        const center = container.scrollLeft + container.clientWidth / 2;

        const cards = Array.from(container.children);
        let closestIndex = 0;
        let minDistance = Infinity;

        cards.forEach((card, index) => {
            const cardCenter = card.offsetLeft + card.offsetWidth / 2;
            const distance = Math.abs(center - cardCenter);
            if (distance < minDistance) {
                minDistance = distance;
                closestIndex = index;
            }
        });

        setActiveIndex(closestIndex);
    };

    return (
        <div
            ref={containerRef}
            onScroll={handleScroll}
            className="flex relative overflow-x-auto overflow-y-hidden snap-x snap-mandatory w-full h-[60vh] items-center px-[50vw] scroll-smooth no-scrollbar"

            style={{ paddingLeft: '15vw', paddingRight: '15vw' }}
        >
            {images.map((src, i) => {
                const isActive = i === activeIndex;
                return (
                    <motion.div
                        key={i}
                        className="relative flex-shrink-0 w-[70vw] aspect-[4/5] snap-center mx-4 first:ml-0 last:mr-0 rounded-sm overflow-hidden"
                        animate={{
                            scale: isActive ? 1 : 0.9,
                            opacity: isActive ? 1 : 0.5,
                            filter: isActive ? 'grayscale(0%)' : 'grayscale(100%)',
                        }}
                        transition={{ duration: 0.4, ease: "easeOut" }}
                    >
                        <PhotoCard
                            src={src}
                            index={i}
                            className="w-full h-full mb-0"
                            imgClassName="w-full h-full object-cover"
                        />
                    </motion.div>
                );
            })}
        </div>
    );
};

const ParallaxPortfolio = ({ isDark }) => {
    const containerRef = useRef(null);

    // Track scroll progress relative to the container for Desktop
    const { scrollYProgress } = useScroll({
        target: containerRef,
        offset: ["start end", "end start"]
    });

    // Map scroll progress to Y offsets (Reduced intensity to minimize bottom gaps)
    const y1 = useTransform(scrollYProgress, [0, 1], [0, -100]); // Up
    const y2 = useTransform(scrollYProgress, [0, 1], [0, 100]);  // Down
    const y3 = useTransform(scrollYProgress, [0, 1], [0, -200]); // Up faster
    const y4 = useTransform(scrollYProgress, [0, 1], [0, 200]);  // Down faster

    const allImages = images.flat();

    return (
        <section className={`relative w-full h-auto text-white overflow-hidden py-0 border-t border-b -mb-2em z-0 ${isDark ? 'bg-zinc-950 border-zinc-950' : 'bg-gray-50 border-gray-200'}`}>

            {/* Desktop / Tablet Grid View (>= md) */}
            <div ref={containerRef} className="hidden md:block px-4 md:px-8">
                {/* Noise Texture - Commented out for performance
                <div className="absolute inset-0 pointer-events-none opacity-[0.05]"
                    style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }} 
                />
                */}

                <div className="max-w-[1600px] mx-auto relative z-10">
                    <motion.div
                        initial={{ opacity: 0 }}
                        whileInView={{ opacity: 1 }}
                        transition={{ duration: 1 }}
                        className="my-10 text-center"
                    >
                        <h2 className="text-3xl md:text-5xl font-bold tracking-tighter">{/*header optional*/}</h2>
                        <p className={`mt-2 mb-3 font-mono text-sm ${isDark ? 'text-zinc-500' : 'text-zinc-400'}`}>ARCHIVES</p>
                    </motion.div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                        <ParallaxColumn images={images[0]} y={y1} className="mt-0 lg:mt-[100px]" />
                        <ParallaxColumn images={images[1]} y={y2} className="mt-0 lg:-mt-[10px]" />
                        <ParallaxColumn images={images[2]} y={y3} className="mt-0 lg:mt-[200px]" />
                        <ParallaxColumn images={images[3]} y={y4} className="mt-0 lg:-mt-[10px]" />
                    </div>
                </div>
            </div>

            {/* Mobile Horizontal Scroll View (< md) */}
            <div className="block md:hidden">
                <div className={`py-10 text-center absolute top-0 left-0 w-full z-10 pointer-events-none mix-blend-difference -mt-5 mb-10`}>
                    <p className={`font-mono text-sm uppercase tracking-widest drop-shadow-md ${isDark ? 'text-white' : 'text-zinc-800'}`}>ARCHIVES</p>
                </div>
                <MobileGallery images={allImages} />
            </div>
        </section>
    );
};

export default ParallaxPortfolio;