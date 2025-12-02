import React from 'react';
import useScrollReveal from '../Hooks/useScrollReveal';
import { Github, Linkedin, Mail } from 'lucide-react'; // Added icons

const Reveal = ({ children }) => {
  const [ref, isVisible] = useScrollReveal();
  return (
    <div ref={ref} className={`transition-all duration-1000 transform ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
      {children}
    </div>
  );
};

const About = ({ resumeData }) => {
  return (
    <section id="about" className="px-6 py-32 max-w-4xl mx-auto font-cyber">
      <Reveal>
        <h2 className="text-xs tracking-[0.3em] uppercase opacity-50 mb-12 border-b border-current pb-4">
          // 01. Identity Core
        </h2>
        
        <div className="grid md:grid-cols-[1fr_2fr] gap-12">
          
          {/* PROFILE PICTURE COLUMN */}
          <div className="space-y-4">
             <div className="relative w-full aspect-square border-2 border-green-600/50 flex items-center justify-center overflow-hidden bg-zinc-900 shadow-xl">
                {/* Placeholder/Profile Image */}
                <img 
                    src="/profile1.jpg" 
                    alt="Aman Anubhav Profile"
                    className="w-full h-full object-cover opacity-80"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent"></div>
                <div className="absolute bottom-4 left-4 text-white text-xl font-bold font-sans">
                    AMAN
                </div>
             </div>
             
             {/* Social Links */}
             <div className='flex justify-center gap-6 pt-4'>
                 <a href={resumeData.links.linkedin} target="_blank" className='text-zinc-500 hover:text-white transition-colors'><Linkedin size={20} /></a>
                 <a href={resumeData.links.github} target="_blank" className='text-zinc-500 hover:text-white transition-colors'><Github size={20} /></a>
                 <a href={`mailto:${resumeData.links.email}`} target="_blank" className='text-zinc-500 hover:text-white transition-colors'><Mail size={20} /></a>
             </div>
          </div>

          {/* TEXT CONTENT COLUMN */}
          <div className="space-y-8">
            <h3 className="text-2xl font-bold leading-tight">
              "I didn't inherit talent—<br/>
              <span className="opacity-50">I built it."</span>
            </h3>
            
            <p className="text-sm leading-relaxed opacity-70 font-sans">
              {resumeData.about}
            </p>
            
            <p className="text-sm leading-relaxed opacity-60 font-sans border-l-2 border-green-600/50 pl-3">
             {resumeData.philosophy}
            </p>

            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-current opacity-80">
              <div>
                <h4 className="text-xs opacity-50 mb-2 uppercase tracking-widest">Primary Stack</h4>
                <ul className="text-sm space-y-1">
                  {resumeData.skills.ai_ml.slice(0,3).map(s => <li key={s}>{s}</li>)}
                </ul>
              </div>
              <div>
                <h4 className="text-xs opacity-50 mb-2 uppercase tracking-widest">Focus Areas</h4>
                <ul className="text-sm space-y-1">
                  <li>AI Agents</li>
                  <li>MLOps</li>
                  <li>Climate Tech</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </Reveal>
    </section>
  );
};

export default About;