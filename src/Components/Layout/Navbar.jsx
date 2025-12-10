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
import { Button as MovingBorderContainer } from "../UI/MovingBorder";

const Navbar = ({ activeSection, setActiveSection, isDark, toggleTheme, openTerminal, openVault }) => {
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

  const handleNavigation = (id) => {
    if (id === 'home') {
      if (location.pathname !== '/') {
        navigate('/', { state: { scrollTo: 'top' } });
      } else {
        window.scrollTo({ top: 0, behavior: 'smooth' });
        setActiveSection('home');
      }
    } else if (id === 'blogs') {
      navigate('/stories');
    } else {
      if (location.pathname !== '/') {
        navigate('/', { state: { scrollTo: id } });
      } else {
        const section = document.getElementById(id);
        if (section) {
          section.scrollIntoView({ behavior: 'smooth' });
          setActiveSection(id);
        }
      }
    }
  };

  const navItems = [
    {
      name: "Home",
      link: "home",
      icon: <Home className="h-4 w-4" />,
    },
    {
      name: "Experience",
      link: "experience",
      icon: <Briefcase className="h-4 w-4" />,
    },
    {
      name: "Projects",
      link: "projects",
      icon: <FolderGit2 className="h-4 w-4" />,
    },
    {
      name: "Blogs",
      link: "blogs",
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
        {/* Moving Border Container */}
        <MovingBorderContainer
          borderRadius="1.75rem"
          className="dark:bg-black bg-white dark:text-white text-black border-neutral-200 dark:border-slate-800"
          containerClassName="h-auto w-auto"
          as="div"
        >
          {/* Content Container */}
          <div className={cn(
            "flex items-center justify-center space-x-2 md:space-x-4 pr-2 pl-4 md:pl-8 py-2",
          )}>
            {navItems.map((navItem, idx) => (
              <button
                key={`link=${idx}`}
                onClick={() => handleNavigation(navItem.link)}
                className={cn(
                  "relative items-center flex space-x-1 transition-all duration-300 px-3 py-1.5 rounded-full",
                  "text-neutral-600 dark:text-neutral-400", // Default text: Steel Gray
                  "hover:text-black dark:hover:text-white", // Hover text: Frost White / Black
                  "hover:bg-zinc-200/50 dark:hover:bg-zinc-800", // Hover bg: Silver / Dark Steel
                  "group"
                )}
              >
                <span className="block sm:hidden">{navItem.icon}</span>
                <span className="hidden sm:block text-xs uppercase tracking-widest font-medium">{navItem.name}</span>
              </button>
            ))}

            {/* Extra Actions (Theme & Terminal) integrated cleanly */}
            <div className="flex items-center gap-1 md:gap-2 pl-2">
              <button
                onClick={toggleTheme}
                className="p-1 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors text-neutral-600 dark:text-neutral-300"
              >
                {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              </button>
              <button
                onClick={openTerminal}
                className="p-1 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors text-neutral-600 dark:text-neutral-300"
              >
                <Terminal className="h-4 w-4" />
              </button>
            </div>

            {/* Secure Contact Button - Authentically styled as requested */}
            <button
              onClick={openVault}
              className="border text-sm font-medium relative border-neutral-200 dark:border-white/[0.2] text-black dark:text-white px-3 md:px-4 py-2 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
            >
              <span className="hidden sm:block">Secure Contact</span>
              <span className="block sm:hidden"><Lock className="h-4 w-4" /></span>
              <span
                className="absolute inset-x-0 w-1/2 mx-auto -bottom-px bg-gradient-to-r from-transparent via-blue-500 to-transparent h-px"
              />
            </button>
          </div>
        </MovingBorderContainer>
      </motion.div>
    </AnimatePresence>
  );
};

export default Navbar;