import React, { useState } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import NeuralNetwork from "@/Components/UI/NeuralNetwork";
import WireframeTunnel from "@/Components/UI/WireframeTunnel";
import { BackgroundRippleEffect } from "@/Components/UI/BackgroundRippleEffect";
import { Button as StatefulButton } from "@/Components/UI/StatefulButton";


const Hero = ({ isDark }) => {
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

                {/* Resume Button - Tailwind Connect Inspired */}
                <div className="pt-12 md:pt-16 relative z-30 pointer-events-auto">
                    <StatefulButton
                        onClick={() => new Promise((resolve) => {
                            setTimeout(() => {
                                window.open("https://drive.google.com/drive/folders/1fj8BIHpUcvZEpkfAyvdmK_Ke8jpmRNDv?usp=sharing", "_blank");
                                resolve();
                            }, 2000);
                        })}
                        className={cn(
                            // Base styling - Pill shape with gradient glow
                            "group relative px-6 py-3 rounded-full text-sm font-medium tracking-wide",
                            "min-w-[180px] overflow-hidden",
                            // Background & Border
                            "bg-zinc-900/80 backdrop-blur-md",
                            "border border-zinc-700/50",
                            // Text
                            "text-zinc-100",
                            // Glow effect on hover
                            "shadow-[0_0_0_1px_rgba(56,189,248,0.1)]",
                            "hover:shadow-[0_0_20px_rgba(56,189,248,0.3),0_0_40px_rgba(56,189,248,0.1)]",
                            "hover:border-cyan-500/50",
                            // Transition
                            "transition-all duration-500 ease-out",
                            // Ring for focus
                            "focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:ring-offset-2 focus:ring-offset-black"
                        )}
                    >
                        {/* Gradient overlay on hover */}
                        <span className="absolute inset-0 rounded-full bg-gradient-to-r from-cyan-500/10 via-transparent to-cyan-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                        {/* Button content with arrow */}
                        <span className="relative flex items-center justify-center gap-3">
                            <span>Resume</span>
                            <svg
                                className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                            >
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                        </span>
                    </StatefulButton>
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

export default Hero;