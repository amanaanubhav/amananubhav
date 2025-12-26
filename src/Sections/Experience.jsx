import React from 'react';
import useScrollReveal from '../Hooks/useScrollReveal';

const Reveal = ({ children, delay = 0 }) => {
  const [ref, isVisible] = useScrollReveal();
  return (
    <div
      ref={ref}
      style={{ transitionDelay: `${delay}ms` }}
      className={`transition-all duration-700 transform ${isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-10'}`}
    >
      {children}
    </div>
  );
};

const Experience = ({ resumeData, isDark }) => {
  // Brighter, sharper colors for "HD" feel
  const lineColor = isDark ? 'bg-zinc-800' : 'bg-zinc-200';
  const dotColor = isDark ? 'bg-zinc-950 border-zinc-400 group-hover:border-white group-hover:bg-white' : 'bg-white border-zinc-400 group-hover:border-black group-hover:bg-black';

  return (
    <section id="experience" className={`px-6 py-40 antialiased ${isDark ? 'bg-zinc-950' : 'bg-gray-50'}`}>
      <div className="max-w-4xl mx-auto">
        <Reveal>
          <h2 className={`text-xs font-cyber tracking-[0.3em] uppercase mb-16 border-b pb-4 ${isDark ? 'text-zinc-500 border-zinc-900' : 'text-zinc-400 border-zinc-200'}`}>
             // 02. Experience Log
          </h2>
        </Reveal>

        <div className="relative ml-3 md:ml-0">
          {/* Continuous Vertical Line - Custom positioned to start at the first dot */}
          <div
            className={`absolute left-0 top-[0.6rem] bottom-0 w-[1px] ${lineColor}`}
            aria-hidden="true"
          ></div>

          <div className="space-y-12">
            {resumeData.experience.map((exp, i) => (
              <Reveal key={i} delay={i * 120}>
                <div className="relative pl-8 md:pl-12 group">

                  {/* Timeline Dot - Smaller (6px), Brighter Glow */}
                  <div
                    className={`absolute -left-[2.5px] top-[0.6rem] w-[6px] h-[6px] rounded-full border transition-all duration-300 z-10 group-hover:scale-125 group-hover:shadow-[0_0_15px_rgba(255,255,255,0.9)] ${dotColor}`}
                  ></div>

                  {/* Content */}
                  <div className="relative">
                    <div className="flex flex-col md:flex-row md:items-baseline gap-2 md:gap-3 mb-2">
                      <h3 className={`text-lg font-bold tracking-tight ${isDark ? 'text-zinc-50' : 'text-zinc-900'}`}>
                        {exp.role}
                      </h3>

                      <span className={`hidden md:inline ${isDark ? 'text-zinc-600' : 'text-zinc-400'}`}>@</span>

                      <span className={`text-sm font-medium tracking-wide ${isDark ? 'text-zinc-300' : 'text-zinc-700'}`}>
                        {exp.org}
                      </span>

                      <span className={`text-xs font-cyber md:ml-auto ${isDark ? 'text-zinc-500' : 'text-zinc-400'}`}>
                        {exp.time}
                      </span>
                    </div>

                    <p className={`text-sm leading-relaxed max-w-2xl font-sans ${isDark ? 'text-zinc-400 group-hover:text-zinc-300' : 'text-zinc-600 group-hover:text-zinc-800'} transition-colors duration-300`}>
                      {exp.detail}
                    </p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default Experience;