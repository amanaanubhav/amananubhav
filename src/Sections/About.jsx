import React from 'react';
import useScrollReveal from '../Hooks/useScrollReveal';

const Reveal = ({ children }) => {
  const [ref, isVisible] = useScrollReveal();
  return (
    <div 
      ref={ref} 
      className={`transition-all duration-1000 transform ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}
    >
      {children}
    </div>
  );
};

const About = ({ resumeData }) => {
  return (
    <section id="about" className="px-6 py-32 max-w-4xl mx-auto bg-zinc-950 text-zinc-400 font-cyber">
      <Reveal>
        <h2 className="text-xs tracking-[0.3em] uppercase text-zinc-600 mb-12 border-b border-zinc-900 pb-4">
          // 01. Identity Core
        </h2>
        
        <div className="grid md:grid-cols-[1fr_2fr] gap-12">
          <div className="space-y-4">
             <div className="w-full aspect-square bg-zinc-900 border border-zinc-800 flex items-center justify-center relative overflow-hidden group">
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay"></div>
                <span className="text-6xl font-black text-zinc-800 group-hover:text-zinc-700 transition-colors select-none">AA</span>
             </div>
          </div>

          <div className="space-y-8">
            <h3 className="text-2xl text-white font-bold leading-tight">
              "I didn't inherit talent—<br/>
              <span className="text-zinc-500">I built it."</span>
            </h3>
            
            <p className="text-sm leading-relaxed text-zinc-400">
              The gap between what we know and what we could solve drives everything I do. 
              Climate change, financial exclusion, accessibility—these aren't abstract concepts. 
              They're problems waiting for someone willing to learn deeply enough to fix them.
            </p>

            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-zinc-900">
              <div>
                <h4 className="text-xs text-zinc-600 mb-2 uppercase tracking-widest">Focus</h4>
                <ul className="text-sm space-y-1">
                  <li>AI / ML Engineering</li>
                  <li>Liquid Neural Networks</li>
                  <li>Climate Tech</li>
                </ul>
              </div>
              <div>
                <h4 className="text-xs text-zinc-600 mb-2 uppercase tracking-widest">Stack</h4>
                <ul className="text-sm space-y-1">
                  <li>Python, C++</li>
                  <li>TensorFlow, PyTorch</li>
                  <li>React, Flask</li>
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