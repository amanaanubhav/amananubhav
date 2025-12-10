import React from 'react';
import { ArrowUpRight } from 'lucide-react';
import useScrollReveal from '../Hooks/useScrollReveal';

const Reveal = ({ children, delay = 0 }) => {
  const [ref, isVisible] = useScrollReveal();
  return (
    <div
      ref={ref}
      style={{ transitionDelay: `${delay}ms` }}
      className={`transition-all duration-700 transform ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}
    >
      {children}
    </div>
  );
};

const Projects = ({ resumeData, isDark }) => {
  return (
    <section id="projects" className={`px-10 py-40 max-w-7xl mx-auto ${isDark ? 'bg-zinc-950 text-zinc-400' : 'bg-gray-50 text-zinc-600'}`}>
      <Reveal>
        <h2 className={`text-xs font-cyber tracking-[0.3em] uppercase mb-20 border-b pb-4 ${isDark ? 'text-zinc-600 border-zinc-900' : 'text-zinc-400 border-zinc-200'}`}>
          // 03. Selected Works
        </h2>
      </Reveal>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {resumeData.projects.map((p, i) => (
          <Reveal key={i} delay={i * 100}>
            <a
              href={p.link}
              target="_blank"
              rel="noopener noreferrer"
              className={`group block h-full p-8 transition-all duration-500 hover:-translate-y-1 relative overflow-hidden flex flex-col border ${isDark ? 'bg-zinc-900/20 border-zinc-900 hover:border-zinc-700' : 'bg-white border-zinc-200 hover:border-zinc-400 hover:shadow-lg'}`}
            >
              {/* Background Glow */}
              <div className={`absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none`}></div>

              <div className="flex justify-between items-start mb-8 relative z-10">
                <span className={`font-cyber text-xs transition-colors ${isDark ? 'text-zinc-600 group-hover:text-zinc-400' : 'text-zinc-400 group-hover:text-zinc-600'}`}>
                  {p.year}
                </span>
                <ArrowUpRight className={`w-5 h-5 transition-colors transform group-hover:rotate-45 duration-300 ${isDark ? 'text-zinc-700 group-hover:text-white' : 'text-zinc-400 group-hover:text-black'}`} />
              </div>

              <h3 className={`text-2xl font-bold mb-3 transition-colors font-sans relative z-10 ${isDark ? 'text-zinc-200 group-hover:text-white' : 'text-zinc-800 group-hover:text-black'}`}>
                {p.title}
              </h3>

              <p className={`text-sm mb-8 leading-relaxed line-clamp-3 transition-colors font-sans relative z-10 flex-grow ${isDark ? 'text-zinc-500 group-hover:text-zinc-400' : 'text-zinc-600 group-hover:text-zinc-800'}`}>
                {p.desc}
              </p>

              <div className="flex flex-wrap gap-2 mt-auto relative z-10">
                {p.tech.map((t) => (
                  <span key={t} className={`text-[10px] font-cyber uppercase tracking-wider px-2 py-1 border rounded transition-colors ${isDark ? 'border-zinc-800 bg-zinc-900/50 text-zinc-500 group-hover:border-zinc-700 group-hover:text-zinc-300' : 'border-zinc-200 bg-zinc-50 text-zinc-500 group-hover:border-zinc-300 group-hover:text-zinc-700'}`}>
                    {t}
                  </span>
                ))}
              </div>
            </a>
          </Reveal>
        ))}
      </div>
    </section>
  );
};

export default Projects;