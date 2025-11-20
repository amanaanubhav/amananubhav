import React, { useState } from 'react';
import useMousePosition from '../../hooks/useMousePosition';
import WireframeTunnel from './WireframeTunnel';
import CustomCursor from '../UI/CustomCursor';

const LensHero = ({ isDark }) => {
  const { x, y } = useMousePosition();
  const [isHovering, setIsHovering] = useState(false);
  
  // Config
  const lensSize = 200; 

  return (
    <section 
      id="home" 
      className={`relative h-screen w-full overflow-hidden flex flex-col justify-center items-center cursor-none transition-colors duration-700 ${isDark ? 'bg-black' : 'bg-gray-100'}`}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
    >
      <CustomCursor isHovering={isHovering} isDark={isDark} />

      {/* FONT INJECTION */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@100;400;800&display=swap');
        .font-cyber { font-family: 'JetBrains Mono', monospace; }
        .text-metal-dark {
            background: linear-gradient(to bottom, #ffffff 0%, #a0a0a0 50%, #404040 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
        }
        .text-metal-light {
            background: linear-gradient(to bottom, #202020 0%, #505050 50%, #909090 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
        }
      `}</style>

      {/* LAYER 1: BASE (Standard View) */}
      {/* Low opacity content that sits in the background */}
      <div className={`absolute inset-0 flex flex-col justify-center items-center z-10 pointer-events-none select-none p-4 font-cyber ${isDark ? 'opacity-30' : 'opacity-40'}`}>
         <WireframeTunnel isDark={isDark} gridColor={isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.05)"} />
         
         <h1 className={`text-[6vw] md:text-[7vw] font-extrabold tracking-tighter text-center z-10 whitespace-nowrap transition-opacity duration-500 ${isDark ? 'text-white' : 'text-zinc-900'}`}>
           &gt;_ AMAN ANUBHAV
         </h1>

         <h2 className={`mt-6 text-sm md:text-xl font-medium tracking-[0.5em] z-10 uppercase ${isDark ? 'text-zinc-600' : 'text-zinc-400'}`}>
           Engineer Architect
         </h2>
         
         <div className={`mt-16 flex items-center gap-4 text-[10px] font-bold tracking-widest z-10 uppercase ${isDark ? 'text-zinc-600' : 'text-zinc-400'}`}>
            <span>SYSTEM</span>
            <span>//</span>
            <span>INTELLIGENCE</span>
            <div className={`w-1.5 h-1.5 rounded-full ${isDark ? 'bg-zinc-700' : 'bg-zinc-400'} animate-pulse`}></div>
         </div>
      </div>

      {/* LAYER 2: REVEAL (Lens Effect - Inverted) */}
      {/* High opacity, inverted content visible only inside the mask */}
      <div 
        className={`absolute inset-0 z-20 flex flex-col justify-center items-center pointer-events-none select-none font-cyber ${isDark ? 'bg-white' : 'bg-black'}`}
        style={{
          maskImage: `radial-gradient(${lensSize}px circle at ${x}px ${y}px, black 0%, transparent 100%)`,
          WebkitMaskImage: `radial-gradient(${lensSize}px circle at ${x}px ${y}px, black 0%, transparent 100%)`
        }}
      >
         {/* Inverted Tunnel */}
         <WireframeTunnel isDark={!isDark} gridColor={isDark ? "rgba(0,0,0,0.15)" : "rgba(255,255,255,0.15)"} burstColor={isDark ? "#000000" : "#FFFFFF"} />
         
         {/* Background Texture */}
         <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10 mix-blend-multiply"></div>

         {/* MAIN TITLE - SHARP & BRIGHT */}
         <h1 className={`text-[6vw] md:text-[7vw] font-extrabold tracking-tighter text-center z-10 whitespace-nowrap ${isDark ? 'text-metal-light' : 'text-metal-dark'}`}>
           &gt;_ AMAN ANUBHAV
         </h1>

         {/* SUBTITLE - HIGH CONTRAST */}
         <h2 className={`mt-6 text-sm md:text-xl font-medium tracking-[0.5em] z-10 uppercase ${isDark ? 'text-black' : 'text-white'}`}>
           Engineer Architect
         </h2>

         {/* SYSTEM STATUS - ACTIVE */}
         <div className={`mt-16 flex items-center gap-4 text-[10px] font-bold tracking-widest z-10 uppercase ${isDark ? 'text-black' : 'text-white'}`}>
            <span>SYSTEM</span>
            <span>//</span>
            <span>INTELLIGENCE</span>
            <div className={`w-2 h-2 rounded-full animate-[ping_1s_ease-in-out_infinite] ${isDark ? 'bg-black' : 'bg-white shadow-[0_0_10px_white]'}`}></div>
         </div>
      </div>
    </section>
  );
};

export default LensHero;