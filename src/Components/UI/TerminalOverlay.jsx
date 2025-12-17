import React, { useState, useEffect, useRef } from 'react';
import { Terminal, X, Send, Wifi, WifiOff, Cpu } from 'lucide-react';
import { RESUME } from '../../Data/resume';
import { ADVENTURES } from '../../Data/adventures'; // Importing Adventures for more context



// --- LOCAL KNOWLEDGE BASE ---
const SYSTEM_COMMANDS = {
  help: "List all available system commands",
  clear: "Clear the terminal screen",
  bio: "Show detailed biography",
  skills: "List technical skill stack",
  projects: "List all major projects",
  contact: "Show contact information",
  socials: "List social media handles"
};

const OFFLINE_RESPONSES = {
  "who": "Aman Anubhav is a Genetically Engineered Learner, AI Researcher & Engineer. He builds advanced AI systems and sustainable tech.",
  "about": "Aman is an explorer of the digital and physical frontiers, specializing in MLOps, Liquid Neural Networks, and decentralized systems.",
  "aman": "That's me. I'm a Genetically Engineered Learner focused on AI, MLOps, and Climate Tech.",

  // Projects
  "projects": "Major Projects:\n\n1. YVOO: AI-driven credit intelligence platform (90%+ accuracy).\n2. PAVANA: Solar-powered carbon capture with gradient composite metals.\n3. RAKSHAK: Wildlife-friendly river-flow energy harvester.\n4. Liquid Neural Networks: Adaptive continuous-time AI research.",
  "yvoo": "YVOO is an AI-driven credit intelligence platform I built. It automates credit scoring with 90%+ accuracy using advanced ML algorithms.",
  "pavana": "PAVANA is a solar-powered carbon capture system design I created, utilizing novel gradient composite metal chambers for efficiency.",
  "rakshak": "RAKSHAK is a wildlife-friendly river-flow energy harvester. It generates clean energy without disrupting aquatic ecosystems.",
  "liquid": "I am researching Liquid Neural Networks (LNNs) for adaptive, continuous-time AI systems that perform better in dynamic environments.",

  // Contact & Socials
  "contact": "You can reach the mainframe via Email: amannbhv.cswork@gmail.com",
  "email": "amannbhv.cswork@gmail.com",
  "linkedin": "Signal detected on LinkedIn: linkedin.com/in/aman-anubhav",
  "github": "Code repository located: github.com/aman-anubhav",

  // Skills
  "skills": "Core Capabilities: Python, PyTorch, TensorFlow, React, Node.js, Next.js, Docker, Kubernetes, AWS, Google Cloud.",
  "stack": "Tech Stack: Full-Stack Web Dev (MERN), Deep Learning (Vision/NLP), DevOps (CI/CD pipelines).",

  // Misc
  "help": "Available Commands: 'about', 'projects', 'skills', 'contact', 'clear'. Or just ask me anything.",
  "status": "All systems nominal. Mainframe online. Neural Link active.",
  "default": "Connection to Mainframe unstable. API unavailable. Switching to local cache: I couldn't process that query specifically, but I can tell you about my 'projects', 'skills', or 'contact' info."
};

const TerminalOverlay = ({ isOpen, onClose }) => {
  const [input, setInput] = useState('');
  const [logs, setLogs] = useState([
    { src: 'SYS', msg: "Available Commands: 'about', 'projects', 'skills', 'contact', 'clear'" },
    { src: 'AI', msg: "Terminal Ready. Accessing Aman Anubhav's digital consciousness. How can I assist?" }
  ]);
  const [isProcessing, setIsProcessing] = useState(false);
  const endRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => endRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
      inputRef.current?.focus();
    }
  }, [logs, isOpen]);

  const handleCommand = async (e) => {
    e.preventDefault();
    if (!input.trim() || isProcessing) return;

    const userQuery = input;
    setInput('');
    setIsProcessing(true);

    // 1. Add User message to logs
    setLogs(prev => [...prev, { src: 'USR', msg: userQuery }]);

    // 2. Handle 'clear' command locally
    if (userQuery.toLowerCase().trim() === 'clear') {
      setLogs([]);
      setIsProcessing(false);
      return;
    }

    // 3. Add placeholder for AI response
    setLogs(prev => [...prev, { src: 'AI', msg: '' }]);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userQuery,
          resumeData: RESUME,
          adventureData: ADVENTURES
        })
      });

      if (!response.ok) throw new Error("Uplink Failed");

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });

        // Update the LAST log entry with the new chunk
        setLogs(prev => {
          const newLogs = [...prev];
          const lastIndex = newLogs.length - 1;
          newLogs[lastIndex] = {
            ...newLogs[lastIndex],
            msg: newLogs[lastIndex].msg + chunk
          };
          return newLogs;
        });
      }
    } catch (err) {
      // Natural Fallback: Simulate a system shift to local data
      console.warn("Switching to offline protocol:", err);

      let offlineReply = OFFLINE_RESPONSES.default;
      const lowerQuery = userQuery.toLowerCase();

      // Smart keyword matching with priorities
      for (const [key, response] of Object.entries(OFFLINE_RESPONSES)) {
        if (lowerQuery.includes(key)) {
          offlineReply = response;
          break;
        }
      }

      // Simulate "Local Processing" delay for realism
      setTimeout(() => {
        setLogs(prev => {
          const newLogs = [...prev];
          const lastIndex = newLogs.length - 1;
          // Replace the "AI" placeholder with the fallback response
          newLogs[lastIndex] = {
            src: 'AI',
            msg: `[!] External Link Unstable. Retrieved from Local Memory:\n\n${offlineReply}`
          };
          return newLogs;
        });
      }, 600); // 600ms processing delay

    } finally {
      setIsProcessing(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] bg-black/90 backdrop-blur-md flex items-center justify-center p-4 font-mono animate-in zoom-in duration-200">
      <div className="w-full max-w-4xl h-[70vh] bg-[#0a0a12] border border-blue-900/50 rounded-lg shadow-2xl flex flex-col overflow-hidden relative box-border ring-1 ring-blue-500/20">

        {/* Header */}
        <div className="h-12 border-b border-blue-900/30 flex items-center justify-between px-6 bg-[#0f111a]">
          <div className="flex items-center gap-4 text-xs tracking-widest">
            <Terminal size={16} className="text-blue-500" />
            <span className="text-blue-500 font-bold">TERMINAL</span>
            <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] uppercase font-bold tracking-wider bg-blue-900/20 text-blue-400 border border-blue-800/50`}>
              <Wifi size={12} />
              <span>Mainframe Active</span>
            </div>
          </div>
          <button onClick={onClose} className="hover:text-blue-400 text-zinc-600 transition-colors p-2 hover:bg-blue-900/10 rounded-full"><X size={18} /></button>
        </div>

        {/* Terminal Body */}
        <div className="flex-1 p-6 overflow-y-auto space-y-4 text-sm z-10 font-mono scrollbar-thin scrollbar-thumb-blue-900/50 scrollbar-track-transparent" onClick={() => inputRef.current?.focus()}>
          {logs.map((l, i) => (
            <div key={i} className="flex gap-4 items-start group">
              <span className={`w-12 font-bold mt-0.5 shrink-0 text-right select-none ${l.src === 'USR' ? 'text-zinc-500' : l.src === 'AI' ? 'text-blue-400' : 'text-zinc-600'}`}>
                {l.src === 'USR' ? '>>>' : l.src === 'AI' ? 'AI' : '>'}
              </span>
              <span className={`whitespace-pre-wrap leading-relaxed ${l.src === 'USR' ? 'text-zinc-300 italic' : l.src === 'AI' ? 'text-blue-50' : 'text-zinc-500'}`}>
                {l.msg}
              </span>
            </div>
          ))}
          {isProcessing && (
            <div className="flex gap-4 items-center text-blue-400/70 mt-4 pl-16">
              <Cpu size={16} className="animate-spin" />
              <span className="text-xs animate-pulse tracking-widest">PROCESSING QUERY...</span>
            </div>
          )}
          <div ref={endRef} />
        </div>

        {/* Input Area */}
        <div className="p-4 bg-[#0f111a] border-t border-blue-900/30 z-20">
          <form onSubmit={handleCommand} className="flex gap-4 items-center relative">
            <span className="text-blue-500 animate-pulse absolute left-4">{">"}</span>
            <input
              ref={inputRef}
              autoFocus
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              className="w-full bg-black/40 border border-blue-900/30 rounded-md py-3 pl-10 pr-12 text-blue-50 font-mono placeholder-zinc-700 outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20 transition-all"
              placeholder="Enter command..."
              autoComplete="off"
            />
            <button
              type="submit"
              className="absolute right-3 text-zinc-600 hover:text-blue-500 disabled:opacity-30 transition-colors p-2"
              disabled={isProcessing}
            >
              <Send size={16} />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default TerminalOverlay;