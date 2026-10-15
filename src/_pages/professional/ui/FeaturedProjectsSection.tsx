'use client';

import { useRouter } from 'next/navigation';
import { ArrowRight, ArrowUpRight } from 'lucide-react';
import { PROJECTS, selectFeaturedProjects, type Project } from '@/entities/project';
import { ROUTES } from '@/shared/config';
import { useTheme } from '@/shared/lib/theme';
import { Reveal } from '@/shared/ui/reveal';
import { useTilt } from '../lib/use-tilt';

interface ProjectCardProps {
  p: Project;
  isDark: boolean;
}

function ProjectCard({ p, isDark }: ProjectCardProps) {
  const tiltRef = useTilt<HTMLAnchorElement>();

  return (
    <a
      ref={tiltRef}
      href={p.link}
      target="_blank"
      rel="noopener noreferrer"
      className={`group block h-full min-h-[360px] p-10 transition-all duration-500 relative overflow-hidden flex flex-col border border-transparent
            ${isDark
          ? 'bg-zinc-950/90 hover:border-zinc-600/50 shadow-2xl shadow-black/60'
          : 'bg-white hover:border-zinc-400 shadow-xl'}`}
      style={{
        transformStyle: 'preserve-3d',
        transition: 'transform 0.1s ease-out', // Fast response
        willChange: 'transform',
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
  );
}

export function FeaturedProjectsSection() {
  const { isDark } = useTheme();
  const router = useRouter();
  // FILTER: Strictly top 4 Featured Projects
  const featuredProjects = selectFeaturedProjects(PROJECTS, 4);

  return (
    <section id="projects" className={`relative px-6 md:px-10 pt-32 pb-10 max-w-7xl mx-auto overflow-hidden ${isDark ? 'bg-black text-zinc-400' : 'bg-white text-zinc-600'}`}>

      {/* Section Header */}
      <div className="flex justify-between items-end mb-16">
        <Reveal preset="tilt">
          <h2 className={`text-xs font-cyber tracking-[0.3em] uppercase text-left ${isDark ? 'text-zinc-600' : 'text-zinc-400'}`}>
            {'// FEATURED PROJECTS'}
          </h2>
        </Reveal>

        <Reveal preset="tilt" delay={200}>
          <button
            onClick={() => router.push(ROUTES.projectArchive)}
            className={`group flex items-center gap-2 px-4 py-2 border rounded-sm text-xs font-cyber tracking-widest uppercase transition-colors duration-300
                        ${isDark ? 'border-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-900' : 'border-zinc-300 text-zinc-600 hover:text-black hover:bg-zinc-100'}`}
          >
            MORE PROJECTS
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
          </button>
        </Reveal>
      </div>

      <br />

      {/* TIER 1: FEATURED PROJECTS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-16 mb-32">
        {featuredProjects.map((p, i) => (
          <Reveal key={i} preset="tilt" delay={i * 150}>
            <ProjectCard p={p} isDark={isDark} />
          </Reveal>
        ))}
      </div>
    </section>
  );
}
