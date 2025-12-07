import React, { useEffect, useState } from 'react';
import { motion, useMotionValue, useTransform, animate } from 'framer-motion';

const Preloader = ({ onComplete }) => {
  const count = useMotionValue(0);
  const rounded = useTransform(count, (latest) => Math.round(latest));
  const [displayCount, setDisplayCount] = useState(0);
  const [isFinished, setIsFinished] = useState(false);

  useEffect(() => {
    // Animate count from 0 to 100
    const controls = animate(count, 100, {
      duration: 1.5,
      ease: "easeInOut", // smooth easing
      onUpdate: (latest) => {
        setDisplayCount(Math.round(latest));
      },
      onComplete: () => {
        // Wait a small moment after hitting 100 before sliding out
        setTimeout(() => {
          setIsFinished(true);
          setTimeout(onComplete, 800); // Wait for slide animation to finish
        }, 200);
      }
    });

    return controls.stop;
  }, [count, onComplete]);

  return (
    <div
      className={`fixed inset-0 z-[100] bg-black flex flex-col justify-between p-8 transition-transform duration-1000 ease-[cubic-bezier(0.76,0,0.24,1)] ${isFinished ? '-translate-y-full' : 'translate-y-0'}`}
    >
      <div className="flex justify-between text-zinc-500 text-xs font-mono uppercase tracking-widest">
        <span>Creation & Creativity</span>
        <span>System Boot</span>
      </div>

      <div className="text-[15vw] font-black leading-none text-white mix-blend-difference text-right">
        {displayCount}%
      </div>

      <div className="w-full h-[1px] bg-white/20 overflow-hidden">
        <motion.div
          className="h-full bg-white"
          style={{ width: useTransform(count, value => `${value}%`) }}
        />
      </div>
    </div>
  );
};

export default Preloader;