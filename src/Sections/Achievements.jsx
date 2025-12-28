import React from 'react';
import { Trophy, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import useScrollReveal from '../Hooks/useScrollReveal';
import { CometCard } from '../Components/UI/CometCard';
import { normalizeAchievement } from '../lib/utils';

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
  const navigate = useNavigate();

  // Use normalized data
  let items = resumeData.achievements.map(normalizeAchievement);

  // Add dummy data if needed for UI fullness on landing page
  if (items.length < 6) {
    items.push(
      { title: "Google Cloud Arcade Champion", desc: "Top performer in Google Cloud Study Jams 2024, mastering Kubernetes & BigQuery.", skills: ["Cloud", "GCP"], rank: "Top 1%" },
      { title: "SpaceOnova Research Fellow", desc: "Selected for advanced research in satellite propulsion systems.", skills: ["Physics", "Research"], rank: "Fellow" }
    );
  }

  // Display only Top 6
  const displayedItems = items.slice(0, 6);

  return (
    <section className={`px-6 py-32 border-y ${isDark ? 'bg-zinc-950 border-zinc-950' : 'bg-gray-50 border-gray-50'}`}>
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-end mb-16">
          <Reveal>
            <h2 className={`text-xs font-cyber tracking-[0.3em] uppercase text-left ${isDark ? 'text-zinc-600' : 'text-zinc-400'}`}>
                // 05. Honors & Recognition
            </h2>
          </Reveal>

          <Reveal delay={200}>
            <button
              onClick={() => navigate('/achievements')}
              className={`group flex items-center gap-2 text-xs font-cyber tracking-widest uppercase transition-colors ${isDark ? 'text-zinc-500 hover:text-white' : 'text-zinc-500 hover:text-black'
                }`}
            >
              View All
              <ArrowRight className="w-3 h-3 transition-transform group-hover:translate-x-1" />
            </button>
          </Reveal>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {displayedItems.map((item, i) => (
            <Reveal key={i} delay={i * 100}>
              <CometCard className="w-full h-full">
                <div
                  className={`relative flex flex-col justify-between p-5 h-full rounded-xl border transition-all duration-300 ${isDark
                    ? 'bg-[#1F2121] border-zinc-800 text-white'
                    : 'bg-white border-zinc-200 text-zinc-800 shadow-sm'
                    }`}
                  style={{ transformStyle: 'preserve-3d' }}
                >
                  {/* Top Section */}
                  <div>
                    <div className="flex justify-between items-start mb-3">
                      <span className={`text-[10px] font-mono ${isDark ? 'text-zinc-500' : 'text-zinc-400'}`}>0{i + 1}</span>
                      <div className={`p-1.5 rounded-full ${isDark ? 'bg-zinc-900/50' : 'bg-zinc-100'}`}>
                        <Trophy size={12} className={isDark ? 'text-yellow-500' : 'text-yellow-600'} />
                      </div>
                    </div>

                    <h3 className="text-sm font-bold mb-1 leading-tight">
                      {item.title}
                    </h3>

                    <div className={`text-[9px] font-cyber uppercase tracking-widest mb-2 opacity-70 ${isDark ? 'text-zinc-500' : 'text-zinc-400'}`}>
                      {item.rank}
                    </div>
                  </div>

                  {/* Bottom Section */}
                  <div>
                    <p className={`text-xs mb-3 leading-relaxed ${isDark ? 'text-zinc-400' : 'text-zinc-600'}`}>
                      {item.desc}
                    </p>

                    <div className="flex flex-wrap gap-1.5 overflow-hidden h-6">
                      {item.skills?.slice(0, 2).map((skill, idx) => (
                        <span
                          key={idx}
                          className={`text-[9px] font-cyber px-1.5 py-0.5 rounded border ${isDark
                            ? 'border-zinc-700 bg-zinc-900/50 text-zinc-300'
                            : 'border-zinc-200 bg-zinc-50 text-zinc-600'
                            }`}
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </CometCard>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Achievements;