import React, { useEffect, useRef } from 'react';
import { ArrowUpRight, ArrowRight } from 'lucide-react';
import useScrollReveal from '../Hooks/useScrollReveal';
import { useNavigate } from 'react-router-dom';

const Reveal = ({ children, delay = 0 }) => {
  const [ref, isVisible] = useScrollReveal();
  return (
    <div
      ref={ref}
      style={{ transitionDelay: `${delay}ms` }}
      className={`transition-all duration-1000 ease-out transform perspective-1000 
        ${isVisible
          ? 'opacity-100 translate-y-0 rotate-x-0'
          : 'opacity-0 translate-y-12 rotate-x-6'}`}
    >
      {children}
    </div>
  );
};

// Subtle 3D Tilt Hook for Cards
const useTilt = () => {
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const handleMouseMove = (e) => {
      const rect = el.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      // Calculate center
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;

      // Calculate tilt (increased for "machined object" feel)
      const rotateX = ((y - centerY) / centerY) * -4; // Increased from 2 to 4
      const rotateY = ((x - centerX) / centerX) * 4;

      // Lower perspective = stronger 3D effect. Added translateZ for true depth.
      el.style.transform = `perspective(800px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02, 1.02, 1.02)`;
    };

    const handleMouseLeave = () => {
      el.style.transform = `perspective(800px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)`;
    };

    el.addEventListener('mousemove', handleMouseMove);
    el.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      el.removeEventListener('mousemove', handleMouseMove);
      el.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, []);

  return ref;
};

const ProjectCard = ({ p, isDark }) => {
  const tiltRef = useTilt();

  return (
    <a
      ref={tiltRef}
      href={p.link}
      target="_blank"
      rel="noopener noreferrer"
      className={`group block h-full min-h-[360px] p-10 transition-all duration-500 relative overflow-hidden flex flex-col border border-transparent
            ${isDark
          ? 'bg-zinc-950/90 hover:border-zinc-600/50 shadow-2xl shadow-black/60' // Deepened bg and shadow
          : 'bg-white hover:border-zinc-400 shadow-xl'}`}
      style={{
        transformStyle: 'preserve-3d',
        transition: 'transform 0.1s ease-out', // Fast response
        willChange: 'transform'
      }}
    >
      {/* Metallic Border Gradient (Pseudo) */}
      <div className={`absolute inset-0 rounded-sm border opacity-20 pointer-events-none transition-opacity duration-500 group-hover:opacity-100
                ${isDark ? 'border-zinc-500' : 'border-zinc-300'}`}></div>

      {/* Subtle Gradient Shine */}
      <div className={`absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none`}></div>

      <div className="flex justify-between items-start mb-10 relative z-10" style={{ transform: 'translateZ(20px)' }}>
        <span className={`font-cyber text-xs tracking-[0.2em] uppercase transition-colors ${isDark ? 'text-zinc-500 group-hover:text-zinc-300' : 'text-zinc-400 group-hover:text-zinc-600'}`}>
          {p.type} — {p.year}
        </span>
        <ArrowUpRight className={`w-6 h-6 transition-all transform group-hover:rotate-45 duration-500 ${isDark ? 'text-zinc-600 group-hover:text-white' : 'text-zinc-400 group-hover:text-black'}`} />
      </div>

      <h3 className={`text-3xl font-bold mb-4 transition-colors font-sans relative z-10 ${isDark ? 'text-zinc-100 group-hover:text-white' : 'text-zinc-800 group-hover:text-black'}`} style={{ transform: 'translateZ(30px)' }}>
        {p.title}
      </h3>

      {/* One-line impact description */}
      <p className={`text-base mb-10 leading-relaxed transition-colors font-sans relative z-10 flex-grow ${isDark ? 'text-zinc-400 group-hover:text-zinc-300' : 'text-zinc-600 group-hover:text-zinc-800'}`} style={{ transform: 'translateZ(20px)' }}>
        {p.desc}
      </p>

      {/* Tech Tags - Limit to 3-5 */}
      <div className="flex flex-wrap gap-2 mt-auto relative z-10" style={{ transform: 'translateZ(20px)' }}>
        {p.tech.slice(0, 4).map((t) => (
          <span key={t} className={`text-[10px] font-cyber uppercase tracking-wider px-3 py-1.5 border rounded-sm transition-colors 
                ${isDark
              ? 'border-zinc-800 bg-zinc-900/50 text-zinc-500 group-hover:border-zinc-600 group-hover:text-zinc-300'
              : 'border-zinc-200 bg-zinc-50 text-zinc-500 group-hover:border-zinc-300 group-hover:text-zinc-700'}`}>
            {t}
          </span>
        ))}
      </div>
    </a>
  )
}

const Projects = ({ resumeData, isDark }) => {
  const navigate = useNavigate();
  // FILTER: Strictly top 4 Featured Projects
  const featuredProjects = resumeData.projects.filter(p => p.featured).slice(0, 4);

  return (
    <section id="projects" className={`relative px-6 md:px-10 py-40 max-w-7xl mx-auto overflow-hidden ${isDark ? 'bg-zinc-950 text-zinc-400' : 'bg-gray-50 text-zinc-600'}`}>

      {/* Section Header */}
      <Reveal>
        <div className="flex flex-col mb-24">
          <h2 className={`text-xs font-cyber tracking-[0.3em] uppercase mb-6 border-b pb-4 w-full ${isDark ? 'text-zinc-500 border-zinc-900' : 'text-zinc-400 border-zinc-200'}`}>
            // 03. Selected Works
          </h2>
        </div>
      </Reveal>

      {/* TIER 1: FEATURED PROJECTS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-16 mb-32">
        {featuredProjects.map((p, i) => (
          <Reveal key={i} delay={i * 150}>
            <ProjectCard p={p} isDark={isDark} />
          </Reveal>
        ))}
      </div>

      {/* TIER 2 CTA: ARCHIVE LINK */}
      <Reveal delay={200}>
        <div className="flex justify-center flex-col items-center">
          <button
            onClick={() => navigate('/project-archive')}
            className={`group flex items-center gap-3 px-8 py-4 rounded-full border transition-all duration-300 ease-out 
                    ${isDark
                ? 'bg-zinc-900/30 backdrop-blur-md border-zinc-700/50 text-zinc-300 shadow-[0_8px_16px_rgba(0,0,0,0.3)] hover:shadow-[0_12px_24px_rgba(0,0,0,0.5)] hover:bg-zinc-800/50 hover:border-zinc-500 hover:text-white hover:-translate-y-1'
                : 'bg-white/60 backdrop-blur-md border-zinc-300/80 text-zinc-600 shadow-[0_8px_16px_rgba(0,0,0,0.06)] hover:shadow-[0_12px_24px_rgba(0,0,0,0.12)] hover:bg-white/80 hover:border-zinc-400 hover:text-black hover:-translate-y-1'}`}
          >
            <span className="text-xs font-cyber uppercase tracking-widest">Project Archive</span>
            <div className={`w-6 h-6 rounded-full flex items-center justify-center border transition-all duration-300
                    ${isDark
                ? 'border-zinc-600 group-hover:border-zinc-400 group-hover:bg-zinc-400/20'
                : 'border-zinc-400 group-hover:border-zinc-600 group-hover:bg-zinc-600/10'}`}>
              <ArrowRight size={12} />
            </div>
          </button>
          <p className="mt-8 font-mono text-[10px] opacity-30 uppercase tracking-[0.2em] transition-opacity duration-300 group-hover:opacity-50">
                // Access complete technical database
          </p>
        </div>
      </Reveal>
    </section>
  );
};

export default Projects;