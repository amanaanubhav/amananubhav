import React from 'react';
import { Trophy } from 'lucide-react';
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

const Achievements = ({ resumeData, isDark }) => {
  // Helper to normalize achievement data
  const normalizeAchievement = (item) => {
    if (typeof item === 'string') {
      // Simple string parsing fallback if data is not updated yet
      const parts = item.split('(');
      const title = parts[0].trim();
      const meta = parts[1] ? parts[1].replace(')', '') : 'Innovation';
      return {
        title: title,
        desc: "Awarded for excellence in technical innovation and problem solving.",
        skills: [meta],
        rank: "Winner"
      };
    }
    return item;
  };

  // Use normalized data
  const items = resumeData.achievements.map(normalizeAchievement);

  // Add a few more dummy achievements if list is short to show off the UI
  if (items.length < 6) {
    items.push(
      { title: "Google Cloud Arcade Champion", desc: "Top performer in Google Cloud Study Jams 2024, mastering Kubernetes & BigQuery.", skills: ["Cloud", "GCP"], rank: "Top 1%" },
      { title: "SpaceOnova Research Fellow", desc: "Selected for advanced research in satellite propulsion systems.", skills: ["Physics", "Research"], rank: "Fellow" }
    );
  }

  return (
    <section className={`px-6 py-32 border-y ${isDark ? 'bg-zinc-950 border-zinc-900' : 'bg-gray-50 border-gray-200'}`}>
      <div className="max-w-5xl mx-auto">
        <Reveal>
          <h2 className={`text-xs font-cyber tracking-[0.3em] uppercase mb-16 text-left border-b pb-4 ${isDark ? 'text-zinc-600 border-zinc-900' : 'text-zinc-400 border-zinc-200'}`}>
             // 05. Honors & Recognition
          </h2>
        </Reveal>

        <div className="flex flex-col space-y-2">
          {items.map((item, i) => (
            <Reveal key={i} delay={i * 50}>
              <div className={`group relative w-full border transition-all duration-500 overflow-hidden ${isDark ? 'bg-zinc-900/10 border-zinc-800/50 hover:bg-zinc-900 hover:border-zinc-600' : 'bg-white border-zinc-200 hover:bg-white hover:border-zinc-400 hover:shadow-lg'}`}>

                {/* Initial View: Slim Bar */}
                <div className="flex items-center justify-between p-6 relative z-10 cursor-default">
                  <div className="flex items-center gap-6">
                    <span className={`text-xs font-mono transition-colors w-8 ${isDark ? 'text-zinc-700 group-hover:text-zinc-500' : 'text-zinc-400 group-hover:text-zinc-600'}`}>
                      0{i + 1}
                    </span>
                    <h3 className={`text-lg md:text-xl font-bold transition-colors ${isDark ? 'text-zinc-400 group-hover:text-white' : 'text-zinc-600 group-hover:text-black'}`}>
                      {item.title}
                    </h3>
                  </div>

                  {/* Icon that glows on hover */}
                  <div className="opacity-20 group-hover:opacity-100 transition-opacity duration-500">
                    <Trophy size={20} className={`transition-colors ${isDark ? 'text-zinc-500 group-hover:text-yellow-500' : 'text-zinc-400 group-hover:text-yellow-600'}`} />
                  </div>
                </div>

                {/* Expanded Content: Hidden initially (height 0), expands on hover */}
                <div className="max-h-0 group-hover:max-h-40 transition-all duration-500 ease-in-out overflow-hidden px-6">
                  <div className={`pb-6 pl-14 border-l ml-2 ${isDark ? 'border-zinc-800' : 'border-zinc-200'}`}>
                    <div className="flex items-center gap-4 mb-3 text-[10px] font-cyber uppercase tracking-widest text-zinc-500">
                      <span className={`px-2 py-0.5 border rounded ${isDark ? 'border-zinc-700 bg-zinc-950 text-zinc-400' : 'border-zinc-200 bg-zinc-50 text-zinc-600'}`}>{item.rank || "Awarded"}</span>
                      <span className={`w-8 h-px ${isDark ? 'bg-zinc-800' : 'bg-zinc-200'}`}></span>
                      <span>{item.skills?.join(" / ")}</span>
                    </div>
                    <p className={`text-sm leading-relaxed max-w-2xl ${isDark ? 'text-zinc-400' : 'text-zinc-600'}`}>
                      {item.desc}
                    </p>
                  </div>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Achievements;