import React from 'react';
import useScrollReveal from '../../Hooks/useScrollReveal';

const Reveal = ({ children, delay = 0, className = "" }) => {
    const [ref, isVisible] = useScrollReveal();
    return (
        <div
            ref={ref}
            style={{ transitionDelay: `${delay}ms` }}
            className={`transition-all duration-1000 transform ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'} ${className}`}
        >
            {children}
        </div>
    );
};

const ProfessionalHero = ({ isDark }) => {
    return (
        <section className="min-h-[calc(100vh-5rem)] flex flex-col justify-center px-6 md:px-12 relative overflow-hidden">
            {/* Ambient Background glow centered */}
            <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full blur-[130px] opacity-[0.07] pointer-events-none ${isDark ? 'bg-zinc-400' : 'bg-zinc-600'}`}></div>
            
            <div className="max-w-7xl mx-auto w-full z-10 grid lg:grid-cols-12 gap-12 lg:gap-16 items-center">
                
                {/* Left side: Heading */}
                <div className="lg:col-span-6 space-y-6">
                    <Reveal delay={100}>
                        <div className="flex items-center gap-4">
                            <div className={`w-12 h-[1px] ${isDark ? 'bg-zinc-500' : 'bg-zinc-400'}`}></div>
                            <span className={`text-xs font-cyber tracking-[0.3em] uppercase ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>
                                Career Overview
                            </span>
                        </div>
                    </Reveal>

                    <Reveal delay={200}>
                        <h1 className={`text-5xl md:text-7xl lg:text-[5.5rem] font-black tracking-tighter leading-[0.95] ${isDark ? 'text-white' : 'text-black'}`}>
                            PROFESSIONAL <br />
                            <span className={`text-transparent bg-clip-text bg-gradient-to-r ${isDark ? 'from-zinc-400 to-zinc-700' : 'from-zinc-500 to-zinc-300'}`}>
                                TRAJECTORY
                            </span>
                        </h1>
                    </Reveal>
                </div>

                {/* Right side: Summary and Content */}
                <div className="lg:col-span-6 flex flex-col gap-8 lg:pl-8">
                    <Reveal delay={300}>
                        <p className={`text-lg md:text-xl font-sans leading-relaxed ${isDark ? 'text-zinc-300' : 'text-zinc-700'}`}>
                            A curated overview of my engineering journey, technical expertise, and career milestones. 
                            This space highlights how I transform complex theoretical concepts into practical solutions. 
                            My core focus lies in Artificial Intelligence, advanced algorithms, and scalable system design.
                        </p>
                    </Reveal>

                    <Reveal delay={400}>
                        <div className={`p-6 md:p-8 border-l-2 backdrop-blur-sm shadow-sm ${isDark ? 'border-zinc-700 bg-zinc-900/40 shadow-black/20' : 'border-zinc-300 bg-zinc-100/50 shadow-black/5'}`}>
                            <strong className={`block mb-3 font-semibold tracking-wider uppercase text-xs ${isDark ? 'text-zinc-200' : 'text-zinc-800'}`}>
                                Professional Summary
                            </strong> 
                            <p className={`text-sm md:text-base font-sans leading-relaxed ${isDark ? 'text-zinc-400' : 'text-zinc-600'}`}>
                                I am an AI Researcher and Full Stack Engineer with a passion for building intelligent applications. 
                                My experience ranges from designing sophisticated chatbots to developing accurate predictive models and scalable cloud infrastructure. 
                                I thrive on leading technical projects and creating robust systems that deliver genuine impact.
                            </p>
                        </div>
                    </Reveal>
                </div>

            </div>
        </section>
    );
};

export default ProfessionalHero;
