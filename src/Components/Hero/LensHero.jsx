import React, { useState } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import NeuralNetwork from "./NeuralNetwork";
import WireframeTunnel from "./WireframeTunnel";

const LensHero = ({ isDark }) => {
    const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
    const [isHovered, setIsHovered] = useState(false);

    const handleMouseMove = (e) => {
        const { clientX, clientY } = e;
        const rect = e.currentTarget.getBoundingClientRect();
        const x = clientX - rect.left;
        const y = clientY - rect.top;
        setMousePosition({ x, y });
    };

    return (
        <section
            className={cn(
                "relative h-screen w-full overflow-hidden flex flex-col items-center justify-center bg-black text-white",
                isDark ? "bg-black text-white" : "bg-white text-black"
            )}
            onMouseMove={handleMouseMove}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            {/* Background Layers */}
            <div className="absolute inset-0 z-0">
                <WireframeTunnel isDark={isDark} />
            </div>


            {/* Main Content */}
            <div className="relative z-10 flex flex-col items-center justify-center text-center pointer-events-none select-none space-y-6 md:space-y-8">

                {/* Title Group - Relative container for strict centering */}
                <div className="relative flex items-center justify-center">
                    <span className="absolute -left-12 md:-left-24 top-1/2 -translate-y-1/2 text-4xl md:text-6xl font-light text-neutral-500">{">_"}</span>
                    <h1 className="text-5xl md:text-8xl font-bold tracking-tighter uppercase font-cyber text-center">
                        AMAN <span className="ml-4">ANUBHAV</span>
                    </h1>
                </div>

                {/* Subtitle - Negative margin to compensate for tracking space */}
                <h2 className="text-lg md:text-2xl font-light tracking-[0.3em] md:tracking-[0.5em] uppercase opacity-70 text-center -mr-[0.3em] md:-mr-[0.5em]">
                    ENGINEER <span className="mx-4 md:mx-8">ARCHITECT</span>
                </h2>

                {/* Footer System Text - Now Relative/Stacked */}
                <div className="pt-8 md:pt-12 flex items-center gap-4 text-xs md:text-sm font-mono tracking-widest opacity-50 pl-[2px]">{/* Added slight pl to balance visually */}
                    <span>SYSTEMS</span>
                    <span className="text-neutral-500">//</span>
                    <span>INTELLIGENCE</span>
                    <motion.div
                        animate={{ opacity: [0, 1, 0] }}
                        transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                        className={cn(
                            "w-2 h-2 rounded-full",
                            isDark ? "bg-green-500" : "bg-red-500"
                        )}
                    />
                </div>
            </div>

            {/* Large Negative Lens */}
            <motion.div
                className="absolute top-0 left-0 w-[250px] h-[250px] bg-white rounded-full pointer-events-none z-20 mix-blend-difference"
                animate={{
                    x: mousePosition.x - 125,
                    y: mousePosition.y - 125,
                    scale: isHovered ? 1 : 0,
                }}
                transition={{
                    type: "tween",
                    ease: "backOut",
                    duration: 0.15
                }}
            />

        </section>
    );
};

export default LensHero;
