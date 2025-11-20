import React from 'react';
import useScrollReveal from '../../Hooks/useScrollReveal';

const Reveal = ({ children }) => {
  const [ref, isVisible] = useScrollReveal();
  return (
    <div ref={ref} style={{ opacity: isVisible ? 1 : 0, transform: isVisible ? 'translateY(0)' : 'translateY(20px)', transition: 'all 0.8s ease' }}>
      {children}
    </div>
  );
};

const Footer = ({ isDark }) => {
  return (
    <footer className={`px-6 py-32 border-t text-center relative overflow-hidden ${isDark ? 'border-white/10' : 'border-black/10'}`}>
       <div className={`absolute inset-0 pointer-events-none ${isDark ? 'bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-zinc-900/20 via-black to-black' : 'bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-zinc-100/50 via-white to-white'}`}></div>
       <Reveal>
         <h2 className={`text-[15vw] font-black leading-none select-none pointer-events-none tracking-tighter font-cyber ${isDark ? 'text-zinc-900' : 'text-zinc-100'}`}>ANUBHAV</h2>
       </Reveal>
       <div className="mt-12 flex flex-col md:flex-row justify-center items-center gap-12 relative z-10">
         <a href="mailto:amannbhv.cswork@gmail.com" className={`text-sm font-bold tracking-widest hover:underline transition-colors font-cyber ${isDark ? 'text-zinc-500 hover:text-white' : 'text-zinc-400 hover:text-black'}`}>EMAIL</a>
         <a href="https://www.linkedin.com/in/amananubhav/" className={`text-sm font-bold tracking-widest hover:underline transition-colors font-cyber ${isDark ? 'text-zinc-500 hover:text-white' : 'text-zinc-400 hover:text-black'}`}>LINKEDIN</a>
         <a href="https://github.com/gitamannbhv" className={`text-sm font-bold tracking-widest hover:underline transition-colors font-cyber ${isDark ? 'text-zinc-500 hover:text-white' : 'text-zinc-400 hover:text-black'}`}>GITHUB</a>
       </div>
       <p className={`mt-16 text-xs font-mono ${isDark ? 'text-zinc-800' : 'text-zinc-300'}`}>&copy; {new Date().getFullYear()} AMAN ANUBHAV. SYSTEMS ONLINE.</p>
    </footer>
  );
};

export default Footer;