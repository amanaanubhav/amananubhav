import React, { useState, useEffect } from 'react';
import { Terminal, Lock, Sun, Moon, Menu, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useLocation } from 'react-router-dom';
import NavButton from '../UI/NavButton';

const Navbar = ({ activeSection, setActiveSection, isDark, toggleTheme, openTerminal, openVault }) => {
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      setIsScrolled(currentScrollY > 20);

      // Always show at the top of the page (buffer of 50px)
      if (currentScrollY < 50) {
        setIsVisible(true);
      }
      // Hide when scrolling down, Show when scrolling up
      else if (currentScrollY > lastScrollY) {
        setIsVisible(false);
      } else {
        setIsVisible(true);
      }

      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

  // Lock body scroll when menu is open
  useEffect(() => {
    if (isMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
  }, [isMenuOpen]);

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
    setIsMenuOpen(false);
  };

  const menuVariants = {
    closed: {
      opacity: 0,
      y: "-20px",
      transition: { type: "spring", stiffness: 300, damping: 30 }
    },
    open: {
      opacity: 1,
      y: 0,
      transition: {
        type: "spring", stiffness: 300, damping: 30, staggerChildren: 0.1, delayChildren: 0.1
      }
    }
  };

  const itemVariants = {
    closed: { opacity: 0, x: -20 },
    open: { opacity: 1, x: 0 }
  };

  return (
    <>
      <nav
        className={`fixed top-0 w-full z-50 transition-all duration-500 ease-in-out transform ${isVisible ? 'translate-y-0' : '-translate-y-full'
          } ${isScrolled ? (isDark ? 'md:bg-black/50 md:backdrop-blur-md' : 'md:bg-white/50 md:backdrop-blur-md') : ''} bg-transparent`}
      >
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <span
            className={`text-xl font-bold tracking-tighter cursor-pointer font-cyber ${isDark ? 'text-white' : 'text-black'}`}
            onClick={() => handleNavigation('home')}
          >
            AA.
          </span>

          {/* Desktop Navigation */}
          <div className="hidden md:flex gap-10">
            {['home', 'experience', 'projects', 'blogs'].map(id => (
              <NavButton
                key={id}
                id={id}
                label={id.toUpperCase()}
                onClick={() => handleNavigation(id)}
                active={activeSection === id && location.pathname === '/'}
                isDark={isDark}
              />
            ))}
            <NavButton
              id="footer"
              label="CONTACT"
              onClick={() => {
                if (location.pathname !== '/') {
                  navigate('/', { state: { scrollTo: 'footer' } });
                } else {
                  document.querySelector('footer')?.scrollIntoView({ behavior: 'smooth' });
                }
              }}
              isDark={isDark}
            />
          </div>

          <div className="hidden md:flex items-center gap-4">
            <button onClick={toggleTheme} className={`p-2 rounded-full transition-all ${isDark ? 'hover:bg-white/10 text-zinc-400 hover:text-white' : 'hover:bg-black/5 text-zinc-600 hover:text-black'}`}>
              {isDark ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            <button onClick={openTerminal} className={`p-2 transition-colors ${isDark ? 'hover:text-blue-400' : 'hover:text-blue-600'}`} title="Open Terminal">
              <Terminal size={18} />
            </button>
            <button
              onClick={openVault}
              className={`flex items-center gap-2 px-4 py-2 text-[10px] font-bold tracking-widest rounded-sm transition-colors border font-cyber cursor-pointer hover:scale-105 active:scale-95 ${isDark ? 'bg-red-900/20 text-red-500 border-red-900/50 hover:bg-red-900/40' : 'bg-red-50 text-red-600 border-red-200 hover:bg-red-100'}`}
            >
              <Lock size={12} /> SECURE CONTACT
            </button>
          </div>

          {/* Mobile Menu Button */}
          <div className="flex md:hidden items-center gap-4">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className={`p-2 rounded-md transition-colors ${isDark ? 'text-white hover:bg-white/10' : 'text-black hover:bg-black/5'}`}
            >
              <AnimatePresence mode="wait">
                {isMenuOpen ? (
                  <motion.div
                    key="close"
                    initial={{ rotate: -90, opacity: 0 }}
                    animate={{ rotate: 0, opacity: 1 }}
                    exit={{ rotate: 90, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <X size={24} />
                  </motion.div>
                ) : (
                  <motion.div
                    key="menu"
                    initial={{ rotate: 90, opacity: 0 }}
                    animate={{ rotate: 0, opacity: 1 }}
                    exit={{ rotate: -90, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Menu size={24} />
                  </motion.div>
                )}
              </AnimatePresence>
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            initial="closed"
            animate="open"
            exit="closed"
            variants={menuVariants}
            className={`fixed inset-0 z-40 md:hidden flex flex-col pt-24 px-6 ${isDark ? 'bg-black/95 text-white' : 'bg-white/95 text-black'
              } backdrop-blur-xl`}
          >
            <div className="flex flex-col gap-8 items-start">
              {['home', 'experience', 'projects', 'blogs'].map(id => (
                <motion.div key={id} variants={itemVariants} className="w-full">
                  <button
                    onClick={() => handleNavigation(id)}
                    className={`text-2xl font-bold tracking-tight w-full text-left font-sans ${activeSection === id ? (isDark ? 'text-white' : 'text-black') : (isDark ? 'text-zinc-500' : 'text-zinc-400')}`}
                  >
                    {id.toUpperCase()}
                  </button>
                </motion.div>
              ))}
              <motion.div variants={itemVariants} className="w-full">
                <button
                  onClick={() => {
                    if (location.pathname !== '/') {
                      navigate('/', { state: { scrollTo: 'footer' } });
                    } else {
                      document.querySelector('footer')?.scrollIntoView({ behavior: 'smooth' });
                    }
                    setIsMenuOpen(false);
                  }}
                  className={`text-2xl font-bold tracking-tight w-full text-left font-sans ${isDark ? 'text-zinc-500 hover:text-white' : 'text-zinc-400 hover:text-black'}`}
                >
                  CONTACT
                </button>
              </motion.div>

              <motion.div variants={itemVariants} className="w-full h-px bg-zinc-800/50 my-2" />

              <motion.div variants={itemVariants} className="flex items-center gap-6 w-full">
                <button
                  onClick={toggleTheme}
                  className={`flex items-center gap-3 text-sm font-cyber ${isDark ? 'text-zinc-400' : 'text-zinc-600'}`}
                >
                  {isDark ? <Sun size={20} /> : <Moon size={20} />}
                  {isDark ? 'LIGHT MODE' : 'DARK MODE'}
                </button>
              </motion.div>

              <motion.div variants={itemVariants} className="flex gap-4 mt-4">
                <button onClick={openTerminal} className={`p-4 rounded-xl border ${isDark ? 'border-zinc-800 bg-zinc-900/50 text-blue-400' : 'border-zinc-200 bg-zinc-50 text-blue-600'}`}>
                  <Terminal size={20} />
                </button>
                <button onClick={openVault} className={`px-6 py-4 rounded-xl border flex items-center gap-2 font-cyber text-xs tracking-widest ${isDark ? 'border-red-900/50 bg-red-900/20 text-red-500' : 'border-red-200 bg-red-50 text-red-600'}`}>
                  <Lock size={14} /> SECURE CONTACT
                </button>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default Navbar;