
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

const PhotoCard = ({ src, index }) => {
    if (!src) return null; // Handle empty strings

    const isVideo = src.match(/\.(mp4|webm|ogg)$/i);
    const isYoutube = src.includes("youtube.com/embed");

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: index * 0.05, ease: "easeOut" }}
            viewport={{ once: true, margin: "100px" }}
            className="group relative w-full overflow-hidden rounded-sm mb-4 md:mb-6 grayscale hover:grayscale-0 transition-all duration-700 ease-in-out cursor-pointer"
        >
            <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors z-10 pointer-events-none" />

            {isYoutube ? (
                <div className="relative w-full aspect-[9/16] pointer-events-none">
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
                    className="w-full h-auto object-cover transform scale-100 group-hover:scale-110 transition-transform duration-700 ease-in-out will-change-transform"
                />
            ) : (
                <motion.img
                    src={src}
                    alt="Gallery Item"
                    className="w-full h-auto object-cover transform scale-100 group-hover:scale-110 transition-transform duration-700 ease-in-out will-change-transform"
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

const ParallaxPortfolio = () => {
    const containerRef = useRef(null);

    // Track scroll progress relative to the container
    const { scrollYProgress } = useScroll({
        target: containerRef,
        offset: ["start end", "end start"]
    });

    // Map scroll progress to Y offsets (Reduced intensity to minimize bottom gaps)
    const y1 = useTransform(scrollYProgress, [0, 1], [0, -100]); // Up
    const y2 = useTransform(scrollYProgress, [0, 1], [0, 100]);  // Down
    const y3 = useTransform(scrollYProgress, [0, 1], [0, -200]); // Up faster
    const y4 = useTransform(scrollYProgress, [0, 1], [0, 200]);  // Down faster

    return (
        <section ref={containerRef} className="relative w-full h-auto bg-zinc-950 text-white overflow-hidden py-0 px-4 md:px-8 border-t border-b border-zinc-950 -mb-2em z-0">

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
                    <p className="text-zinc-500 mt-2 mb-3 font-mono text-sm">ARCHIVES</p>
                </motion.div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                    <ParallaxColumn images={images[0]} y={y1} className="mt-0 lg:mt-[100px]" />
                    <ParallaxColumn images={images[1]} y={y2} className="mt-0 lg:-mt-[10px]" />
                    <ParallaxColumn images={images[2]} y={y3} className="mt-0 lg:mt-[200px]" />
                    <ParallaxColumn images={images[3]} y={y4} className="mt-0 lg:-mt-[10px]" />
                </div>
            </div>
        </section>
    );
};

export default ParallaxPortfolio;
