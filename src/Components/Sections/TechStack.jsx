import React from 'react';
import useScrollReveal from '../../Hooks/useScrollReveal';
import {
  Brain,
  Database,
  Terminal,
  Cloud,
  Code2,
  Wrench,
  Bot,
  Cpu,
  Layers,
  Network
} from 'lucide-react';

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

const SkillTag = ({ name, icon: Icon, isDark }) => (
  <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-sm font-medium transition-all duration-300 hover:-translate-y-1 hover:shadow-lg ${isDark
      ? 'bg-zinc-900/50 border-zinc-800 text-zinc-400 hover:border-zinc-600 hover:bg-zinc-800 hover:text-white hover:shadow-zinc-500/10'
      : 'bg-white border-zinc-200 text-zinc-600 hover:border-zinc-400 hover:bg-zinc-50 hover:text-black hover:shadow-zinc-500/5'
    }`}>
    {Icon && <Icon className="w-4 h-4" />}
    <span>{name}</span>
  </div>
);

const CategoryCard = ({ title, icon: Icon, skills, isDark, delay }) => (
  <Reveal delay={delay}>
    <div className={`relative h-full p-6 rounded-2xl border backdrop-blur-sm transition-all duration-500 hover:shadow-xl ${isDark
        ? 'bg-zinc-900/40 border-zinc-800/50 hover:bg-zinc-900/80 hover:border-zinc-700'
        : 'bg-white/60 border-zinc-200/50 hover:bg-white hover:border-zinc-300'
      }`}>
      {/* Decorative gradient blob */}
      <div className={`absolute -top-4 -right-4 w-24 h-24 rounded-full blur-2xl pointer-events-none ${isDark ? 'bg-zinc-500/10' : 'bg-zinc-400/20'}`}></div>

      <div className="flex items-center gap-3 mb-6 relative z-10">
        <div className={`p-2 rounded-xl ${isDark ? 'bg-zinc-800 text-zinc-300' : 'bg-zinc-100 text-zinc-600'}`}>
          <Icon className="w-6 h-6" />
        </div>
        <h3 className={`text-xl font-bold ${isDark ? 'text-zinc-100' : 'text-zinc-900'}`}>{title}</h3>
      </div>

      <div className="flex flex-wrap gap-2 relative z-10">
        {skills.map((skill, idx) => (
          <SkillTag key={idx} name={skill.name} icon={skill.icon} isDark={isDark} />
        ))}
      </div>
    </div>
  </Reveal>
);

const TechStack = ({ resumeData, isDark }) => {
  // Mapping the resume skills to include suitable Lucide icons
  const mappedSkills = {
    ai_ml: resumeData.skills.ai_ml.map(name => ({
      name,
      icon: name.includes('Neural') || name.includes('RL') || name.includes('Q') ? Brain : Bot
    })),
    languages: resumeData.skills.languages.map(name => ({
      name,
      icon: Code2
    })),
    full_stack: resumeData.skills.full_stack.map(name => ({
      name,
      icon: name.includes('SQL') || name.includes('Mongo') || name.includes('Base') || name.includes('Redis') ? Database : Layers
    })),
    cloud_devops: resumeData.skills.cloud_devops.map(name => ({
      name,
      icon: name.includes('Docker') || name.includes('Kuber') || name.includes('Cloud') || name.includes('AWS') || name.includes('GCP') || name.includes('Azure') ? Cloud : Network
    })),
    tools: resumeData.skills.tools.map(name => ({
      name,
      icon: name.includes('Git') ? Terminal : Wrench
    }))
  };

  return (
    <section id="techstack" className={`px-6 py-24 md:py-32 antialiased relative overflow-hidden ${isDark ? 'bg-black' : 'bg-white'}`}>

      {/* Background decoration */}
      <div className="absolute top-1/4 -left-64 w-96 h-96 bg-zinc-500/5 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-1/4 -right-64 w-96 h-96 bg-zinc-500/5 rounded-full blur-3xl pointer-events-none"></div>

      <div className="max-w-6xl mx-auto relative z-10">
        <Reveal>
          <div className="mb-16">
            <h2 className={`text-xs font-cyber tracking-[0.3em] uppercase mb-4 border-b pb-4 ${isDark ? 'text-zinc-500 border-zinc-900' : 'text-zinc-400 border-zinc-200'}`}>
               // Technology Stack
            </h2>
            <p className={`text-sm md:text-base max-w-2xl ${isDark ? 'text-zinc-400' : 'text-zinc-600'}`}>
              {/* description here */}
            </p>
          </div>
        </Reveal>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* AI / ML - Span 2 columns on larger screens for emphasis */}
          <div className="md:col-span-2 lg:col-span-2">
            <CategoryCard
              title="AI & Machine Learning"
              icon={Cpu}
              skills={mappedSkills.ai_ml}
              isDark={isDark}
              delay={100}
            />
          </div>

          <div className="md:col-span-1 lg:col-span-1">
            <CategoryCard
              title="Languages"
              icon={Terminal}
              skills={mappedSkills.languages}
              isDark={isDark}
              delay={200}
            />
          </div>

          <div className="md:col-span-1 lg:col-span-1">
            <CategoryCard
              title="Cloud & DevOps"
              icon={Cloud}
              skills={mappedSkills.cloud_devops}
              isDark={isDark}
              delay={300}
            />
          </div>

          <div className="md:col-span-1 lg:col-span-1">
            <CategoryCard
              title="Full Stack & Databases"
              icon={Database}
              skills={mappedSkills.full_stack}
              isDark={isDark}
              delay={400}
            />
          </div>

          <div className="md:col-span-1 lg:col-span-1">
            <CategoryCard
              title="Tools & Platforms"
              icon={Wrench}
              skills={mappedSkills.tools}
              isDark={isDark}
              delay={500}
            />
          </div>
        </div>
      </div>
    </section>
  );
};

export default TechStack;
