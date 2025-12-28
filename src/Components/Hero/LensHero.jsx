import React, { useState } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import NeuralNetwork from "./NeuralNetwork";
import WireframeTunnel from "./WireframeTunnel";
import { BackgroundRippleEffect } from "@/Components/Hero/BackgroundRippleEffect";


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
            {/* Background Ripple Effect - Replaces Wireframe/Tunnel */}
            <div className="absolute inset-0 z-0">
                <BackgroundRippleEffect rows={24} cols={50} />
            </div>

            {/* Main Content */}
            <div className="relative z-10 flex flex-col items-center justify-center text-center pointer-events-none select-none space-y-6 md:space-y-8">

                <div className="relative flex items-center justify-center pointer-events-auto cursor-default z-20">
                    <span className="absolute -left-12 md:-left-24 top-1/2 -translate-y-1/2 text-4xl md:text-6xl font-light text-neutral-500 transition-opacity duration-300 hover:text-white/80">{">_"}</span>
                    <h1 className="text-5xl md:text-8xl font-bold tracking-tighter uppercase font-cyber text-center group">
                        {/* AMAN ANUBHAV */}
                        <span
                            className="inline-block transition-all duration-300 ease-out"
                            style={{
                                textShadow: isHovered
                                    ? isDark
                                        ? "0 0 2px rgba(99,102,241,0.4), 0 0 12px rgba(99,102,241,0.3)" // Dark Hover: Indigo Glow
                                        : "0 0 2px rgba(99,102,241,0.3), 0 0 10px rgba(99,102,241,0.2)" // Light Hover
                                    : "none"
                            }}
                        >
                            AMAN  ANUBHAV
                        </span>
                    </h1>
                </div>

                {/* Subtitle - Negative margin to compensate for tracking space */}
                <h2 className="text-lg md:text-2xl font-light tracking-[0.3em] md:tracking-[0.5em] uppercase opacity-70 text-center -mr-[0.3em] md:-mr-[0.5em] pointer-events-auto transition-all duration-300 hover:opacity-100 hover:drop-shadow-[0_0_8px_rgba(255,255,255,0.5)]">
                    ENGINEER <span className="mx-4 md:mx-8">ARCHITECT</span>
                </h2>

                {/* Footer System Text - Now Relative/Stacked */}
                <div className="pt-8 md:pt-12 flex items-center gap-4 text-xs md:text-sm font-mono tracking-widest opacity-50 pl-[2px]">{/* Added slight pl to balance visually */}
                    <span>SYSTEMS</span>
                    <span className="text-neutral-500">//</span>
                    <span>INTELLIGENCE</span>
                    <motion.div
                        animate={{
                            opacity: [0.2, 1, 0.2],
                            scale: [1, 1.5, 1],
                            boxShadow: isDark
                                ? ["0px 0px 0px rgba(227, 225, 225, 0)", "0px 0px 10px rgba(227, 225, 225, 0.9)", "0px 0px 0px rgba(227, 225, 225, 0)"]
                                : ["0px 0px 0px rgba(18, 17, 17, 0)", "0px 0px 10px rgba(18, 17, 17, 0.8)", "0px 0px 0px rgba(18, 17, 17, 0)"]
                        }}
                        transition={{ duration: 0.8, repeat: Infinity, ease: "easeInOut" }}
                        className={cn(
                            "w-1 h-1 rounded-full",
                            isDark ? "bg-[#E3E1E1]" : "bg-[#000]"
                        )}
                    />
                </div>
            </div>

            {/*Large Negative Lens
            <motion.div
                className="absolute top-0 left-0 w-[75px] h-[25px] bg-white rounded-full pointer-events-none z-20 mix-blend-difference"
                animate={{
                    x: mousePosition.x - 35,
                    y: mousePosition.y - 15,
                    scale: isHovered ? 1 : 0,
                }}
                transition={{
                    type: "tween",
                    ease: "backOut",
                    duration: 0.15
                }}
            />*/}

        </section>
    );
};

export default LensHero;