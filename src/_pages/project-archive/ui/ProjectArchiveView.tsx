'use client';

import { useMemo, useState } from 'react';
import { ArrowUpRight, ChevronDown, Calendar } from 'lucide-react';

import { PROJECTS, formatProjectYearShort } from '@/entities/project';
import { useScrollToTopOnMount } from '@/shared/lib/dom';
import { useTheme } from '@/shared/lib/theme';
import { ArchiveTag, BackButton, SearchField } from '@/shared/ui/archive';
import { Reveal } from '@/shared/ui/reveal';

import {
  filterProjects,
  getProjectTypes,
  groupProjectsByType,
  type ProjectSortOrder,
} from '../lib/filter-projects';

// Extract unique domains/types for filter
const ALL_TYPES = getProjectTypes(PROJECTS);

export function ProjectArchiveView() {
  const { isDark } = useTheme();
  const [sortBy, setSortBy] = useState<ProjectSortOrder>('newest');
  const [filterType, setFilterType] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  useScrollToTopOnMount();

  const filteredProjects = useMemo(
    () => filterProjects(PROJECTS, { filterType, searchQuery, sortBy }),
    [filterType, sortBy, searchQuery],
  );

  // Grouping Logic
  const groupedProjects = useMemo(() => groupProjectsByType(filteredProjects), [filteredProjects]);

  return (
    <Reveal preset="archive">
      <div className="max-w-7xl mx-auto mb-16">
        <BackButton />

        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 border-b pb-8 mb-12 border-zinc-800/50">
          <div>
            <h1 className={`text-4xl md:text-5xl font-bold font-sans mb-4 ${isDark ? 'text-zinc-100' : 'text-zinc-900'}`}>
              Project Archive
            </h1>
            <p className="font-mono text-sm opacity-60">
              Complete engineering database // {filteredProjects.length} items
            </p>
          </div>

          {/* Controls */}
          <div className="flex flex-wrap gap-4 items-center">
            {/* Search */}
            <SearchField value={searchQuery} onChange={setSearchQuery} placeholder="Search..." className="w-32" />

            {/* Filter */}
            <div className="relative group">
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className={`appearance-none pl-3 pr-8 py-2 border rounded-sm text-sm font-mono cursor-pointer outline-none focus:ring-1 focus:ring-zinc-500 ${isDark ? 'bg-zinc-900 border-zinc-800 text-zinc-300' : 'bg-white border-zinc-300 text-zinc-700'}`}
              >
                {ALL_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-4 h-4 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none opacity-50" />
            </div>

            {/* Sort */}
            <button
              onClick={() => setSortBy((prev) => (prev === 'newest' ? 'oldest' : 'newest'))}
              className={`flex items-center gap-2 px-4 py-2 border rounded-sm text-sm font-mono transition-colors ${isDark ? 'border-zinc-800 hover:bg-zinc-900 text-zinc-400' : 'border-zinc-300 hover:bg-zinc-100 text-zinc-600'}`}
            >
              <Calendar className="w-4 h-4" />
              {sortBy === 'newest' ? 'Newest' : 'Oldest'}
            </button>
          </div>
        </div>

        {/* GROUPS */}
        <div className="grid grid-cols-1 gap-12">
          {Array.from(groupedProjects, ([type, projects]) => (
            <div key={type}>
              {/* Group Header */}
              <div className="flex items-center gap-4 mb-6">
                <h2 className={`font-cyber text-xs tracking-[0.2em] uppercase ${isDark ? 'text-zinc-500' : 'text-zinc-400'}`}>
                  {type}
                </h2>
                <div className={`h-px flex-grow ${isDark ? 'bg-zinc-800' : 'bg-zinc-200'}`}></div>
              </div>

              {/* Projects Grid */}
              <div className="grid grid-cols-1 gap-3">
                {projects.map((p, i) => (
                  <Reveal key={p.id || i} preset="archive" delay={i * 30}>
                    <a
                      href={p.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`group md:grid md:grid-cols-12 md:gap-4 md:items-center p-6 md:py-5 md:px-6 border rounded-sm transition-colors duration-200 ${
                        isDark
                          ? 'bg-zinc-900/5 border-zinc-800/40 hover:bg-zinc-900/30 hover:border-zinc-700 text-zinc-400'
                          : 'bg-white/50 border-zinc-200 hover:border-zinc-300 hover:shadow-sm text-zinc-600'
                      }`}
                    >
                      {/* Mobile: Top Row */}
                      <div className="flex justify-between md:hidden mb-2">
                        <span className="font-mono text-xs opacity-60">{p.year}</span>
                      </div>

                      {/* Year (Desktop) */}
                      <div className="hidden md:block col-span-1 font-mono text-xs opacity-50 group-hover:opacity-100 transition-opacity">
                        {formatProjectYearShort(p.year)}
                      </div>

                      {/* Title & Desc */}
                      <div className="col-span-5 mb-3 md:mb-0">
                        <div className="flex items-baseline gap-3">
                          <h3 className={`text-base font-bold font-sans ${isDark ? 'text-zinc-300 group-hover:text-zinc-100' : 'text-zinc-700 group-hover:text-black'}`}>
                            {p.title}
                          </h3>
                        </div>
                        {/* Short descriptor only */}
                        <p className="text-xs opacity-50 line-clamp-1 mt-0.5 font-sans group-hover:opacity-70 transition-opacity">
                          {p.desc}
                        </p>
                      </div>

                      {/* Tech (Desktop & Mobile) */}
                      <div className="col-span-5 flex flex-wrap gap-2 mt-2 md:mt-0 justify-end md:justify-start">
                        {p.tech.slice(0, 4).map((t) => (
                          <ArchiveTag key={t} className={isDark ? 'border-zinc-800' : 'border-zinc-200'}>
                            {t}
                          </ArchiveTag>
                        ))}
                      </div>

                      {/* Link Icon */}
                      <div className="col-span-1 hidden md:flex justify-end">
                        <ArrowUpRight className={`w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300 ${isDark ? 'text-white' : 'text-black'}`} />
                      </div>
                    </a>
                  </Reveal>
                ))}
              </div>
            </div>
          ))}

          {filteredProjects.length === 0 && (
            <div className="text-center py-20 opacity-40 font-mono text-sm">
              No signals found.
            </div>
          )}
        </div>
      </div>
    </Reveal>
  );
}
