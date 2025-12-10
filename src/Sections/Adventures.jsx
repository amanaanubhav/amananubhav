import React, { useRef } from 'react';
import { ArrowUpRight, Sparkles } from 'lucide-react';
import { motion, useInView } from 'framer-motion'; // Using framer-motion fully
import { ADVENTURES } from '../Data/adventures';

const BlogCard = ({ story, index, isDark, onOpenStory }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      whileHover={{ y: -10 }}
      className={`group relative cursor-pointer rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-shadow duration-300 h-[500px] w-full`}
      onClick={() => onOpenStory(story)}
    >
      {/* Background Image */}
      <div className="absolute inset-0 w-full h-full">
        <img
          src={story.coverImage}
          alt={story.title}
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
        />
      </div>

      {/* Gradient Overlay - Colorful & Cinematic */}
      <div className={`absolute inset-0 bg-gradient-to-t ${isDark
        ? 'from-black/90 via-black/50 to-transparent'
        : 'from-zinc-900/90 via-zinc-900/40 to-transparent'
        } group-hover:from-black/95 group-hover:via-black/70 transition-all duration-300`}
      />

      {/* Content Container */}
      <div className="absolute inset-0 p-8 flex flex-col justify-end">
        {/* Category Tag */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          whileInView={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 + index * 0.1 }}
          className="absolute top-8 left-8"
        >
          <span className={`px-3 py-1 text-[10px] font-bold tracking-widest uppercase rounded-full backdrop-blur-md border ${isDark
            ? 'bg-white/10 text-white border-white/20'
            : 'bg-black/10 text-white border-white/20'
            }`}>
            {story.category}
          </span>
        </motion.div>

        {/* Main Text Content */}
        <div className="transform transition-transform duration-500 group-hover:-translate-y-2">
          <span className="text-xs font-mono text-zinc-300 mb-2 block border-l-2 border-green-400 pl-3">
            {story.date}
          </span>
          <h3 className="text-2xl md:text-3xl font-bold text-white leading-tight mb-3 drop-shadow-lg">
            {story.title}
          </h3>
          <p className="text-sm text-zinc-300 line-clamp-2 md:line-clamp-3 leading-relaxed mb-6 opacity-80 group-hover:opacity-100 transition-opacity">
            {story.subtitle}
          </p>

          {/* Action Button */}
          <div className="flex items-center gap-3">
            <span className="text-xs font-bold font-cyber text-green-400 tracking-wider group-hover:text-green-300 transition-colors">
              READ STORY
            </span>
            <motion.div
              whileHover={{ x: 5, rotate: -45 }}
              className="p-2 bg-white/10 rounded-full text-white backdrop-blur-sm"
            >
              <ArrowUpRight size={14} />
            </motion.div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

const Adventures = ({ onOpenStory, isDark }) => {
  return (
    <section id="adventures" className={`px-6 py-20 min-h-screen ${isDark ? 'bg-zinc-950' : 'bg-white'}`}>
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="flex flex-col md:flex-row justify-between items-end mb-16 border-b border-zinc-800/50 pb-8"
        >
          <div>
            <h2 className="text-xs font-cyber tracking-[0.3em] uppercase text-green-500 mb-3 flex items-center gap-2">
              <Sparkles size={14} />
                            // 04. ARCHIVES
            </h2>
            <h3 className={`text-4xl md:text-5xl font-bold tracking-tight ${isDark ? 'text-white' : 'text-zinc-900'}`}>
              BLOGS & STORIES
            </h3>
          </div>
          <p className={`text-sm max-w-md mt-6 md:mt-0 text-right font-mono tracking-wide ${isDark ? 'text-zinc-500' : 'text-zinc-500'}`}>
            [ LOGS: EXPERIMENTAL_PROJECTS // THOUGHTS ]
          </p>
        </motion.div>

        {/* Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {ADVENTURES.map((story, index) => (
            <BlogCard
              key={story.id}
              story={story}
              index={index}
              isDark={isDark}
              onOpenStory={onOpenStory}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default Adventures;