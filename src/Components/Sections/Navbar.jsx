"use client";
import React, { useState } from "react";
import {
  motion,
  AnimatePresence,
  useScroll,
  useMotionValueEvent,
} from "framer-motion";
import { cn } from "@/lib/utils";
import { useNavigate, useLocation } from 'react-router-dom';
import { Home, Briefcase, FolderGit2, BookOpen, Terminal, Sun, Moon, Lock } from 'lucide-react';
import { BackgroundGradient } from "@/Components/UI/BackgroundGradient";

const Navbar = ({ activeSection, setActiveSection, isDark, toggleTheme, openTerminal, openVault, closeStory }) => {
  const { scrollYProgress } = useScroll();
  const [visible, setVisible] = useState(true); // Default to true so it shows initially
  const navigate = useNavigate();
  const location = useLocation();

  useMotionValueEvent(scrollYProgress, "change", (current) => {
    // Check if current is not undefined and is a number
    if (typeof current === "number") {
      let direction = current - scrollYProgress.getPrevious();

      if (scrollYProgress.get() < 0.05) {
        setVisible(true); // Show at top
      } else {
        if (direction < 0) {
          setVisible(true); // Show on scroll up
        } else {
          setVisible(false); // Hide on scroll down
        }
      }
    }
  });

  const handleNavigation = (link) => {
    if (closeStory) {
      closeStory();
    }
    navigate(link);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setActiveSection(link);
  };

  const navItems = [
    {
      name: "Home",
      link: "/",
      icon: <Home className="h-4 w-4" />,
    },
    {
      name: "Life",
      link: "/personal",
      icon: <Briefcase className="h-4 w-4" />,
    },
    {
      name: "Professional",
      link: "/professional",
      icon: <FolderGit2 className="h-4 w-4" />,
    },
    {
      name: "Blogs",
      link: "/stories",
      icon: <BookOpen className="h-4 w-4" />,
    },
  ];

  return (
    <AnimatePresence mode="wait">
      <motion.div
        initial={{
          opacity: 1,
          y: -100,
        }}
        animate={{
          y: visible ? 0 : -100,
          opacity: visible ? 1 : 0,
        }}
        transition={{
          duration: 0.2,
        }}
        className={cn(
          "fixed top-10 inset-x-0 mx-auto max-w-fit z-[5000]",
        )}
      >
        {/* 
          Pearl Accent Container 
          - Replaces MovingBorderContainer
          - Static uniform glow
          - Engineered "Frosted" feel
        */}
        <BackgroundGradient
          containerClassName="rounded-[1.75rem]"
          className="rounded-[1.75rem] p-0"
        >
          <div
            className={cn(
              "flex items-center justify-center space-x-2 md:space-x-4 pr-2 pl-4 md:pl-8 py-2",
              "rounded-[1.75rem] transition-all duration-300 ease-out",
              // Base Colors & Borders
              "bg-white dark:bg-black",
              "border border-neutral-200 dark:border-slate-800",
              // Static Glow (Pearl Accent - Purple/Blue Spectrum)
              // Light: Subtle Violet/Indigo glow
              // Dark: Cool Silver/Blue glow
              "shadow-[0_2px_8px_-2px_rgba(0,0,0,0.05),0_0_1px_1px_rgba(99,102,241,0.1)]", // Rest state
              "dark:shadow-[0_2px_8px_-2px_rgba(0,0,0,0.2),0_0_1px_1px_rgba(165,180,252,0.15)]", // Dark Rest

              // Hover Glow Intensity
              "hover:shadow-[0_4px_16px_-4px_rgba(0,0,0,0.1),0_0_12px_0px_rgba(99,102,241,0.25)]", // Light Hover
              "dark:hover:shadow-[0_4px_16px_-4px_rgba(0,0,0,0.3),0_0_12px_0px_rgba(165,180,252,0.3)]" // Dark Hover
            )}
          >
            {navItems.map((navItem, idx) => (
              <button
                key={`link=${idx}`}
                onClick={() => handleNavigation(navItem.link)}
                className={cn(
                  "relative items-center flex space-x-1 transition-colors duration-300 ease-out px-3 py-1.5 rounded-full",
                  // Typography
                  "text-xs uppercase tracking-widest font-medium",
                  // Default Text
                  "text-neutral-600 dark:text-neutral-400",
                  // Hover Text -> Pearl Accent
                  "hover:text-indigo-600 dark:hover:text-indigo-300",
                  // NO Background on Hover
                  "bg-transparent hover:bg-transparent",
                  // Cursor
                  "cursor-pointer group"
                )}
              >
                <span className="block sm:hidden">{navItem.icon}</span>
                <span className="hidden sm:block">{navItem.name}</span>
              </button>
            ))}

            {/* Extra Actions (Theme & Terminal) */}
            <div className="flex items-center gap-1 md:gap-2 pl-2">
              <button
                onClick={toggleTheme}
                className={cn(
                  "p-2 rounded-full transition-colors duration-300 ease-out",
                  "text-neutral-600 dark:text-neutral-400",
                  "hover:text-indigo-600 dark:hover:text-indigo-300", // Pearl Accent
                  "bg-transparent hover:bg-transparent" // No bg
                )}
              >
                {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              </button>
              <button
                onClick={openTerminal}
                className={cn(
                  "p-2 rounded-full transition-colors duration-300 ease-out",
                  "text-neutral-600 dark:text-neutral-400",
                  "hover:text-indigo-600 dark:hover:text-indigo-300", // Pearl Accent
                  "bg-transparent hover:bg-transparent" // No bg
                )}
              >
                <Terminal className="h-4 w-4" />
              </button>
            </div>

            {/* Secure Contact Button - The "Jewel" of the navbar */}
            <button
              onClick={openVault}
              className={cn(
                "border text-sm font-medium relative border-neutral-200 dark:border-white/[0.2] text-black dark:text-white px-3 md:px-4 py-2 rounded-full",
                "transition-all duration-300 ease-out",
                "hover:bg-gradient-to-r hover:from-slate-100 hover:via-blue-50 hover:to-slate-100", // Light: Pearlescent
                "dark:hover:bg-gradient-to-r dark:hover:from-slate-900 dark:hover:via-indigo-950 dark:hover:to-slate-900", // Dark: Cool Silver/Blue
                "hover:border-blue-200 dark:hover:border-indigo-400/50", // Glowy border trigger
                "hover:shadow-[0_0_15px_rgba(200,200,255,0.3)] dark:hover:shadow-[0_0_15px_rgba(100,100,255,0.3)]" // Static subtle glow
              )}
            >
              <span className="hidden sm:block">Secure Contact</span>
              <span className="block sm:hidden"><Lock className="h-4 w-4" /></span>
              <span className="absolute inset-x-0 -bottom-px mx-auto h-px w-1/2 bg-gradient-to-r from-transparent via-blue-500 to-transparent  opacity-0 transition-opacity duration-500 group-hover:opacity-100 dark:via-indigo-400" />
            </button>
          </div>
        </BackgroundGradient>
      </motion.div>
    </AnimatePresence>
  );
};

export default Navbar;