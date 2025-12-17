import React, { useState, useEffect, useRef } from 'react';
import { Terminal, X, Send, Wifi, WifiOff, Cpu } from 'lucide-react';
import { RESUME } from '../../Data/resume';
import { ADVENTURES } from '../../Data/adventures';

// --- LOCAL KNOWLEDGE BASE ---
const OFFLINE_RESPONSES = {
  // core
  "who": "Aman Anubhav is a Genetically Engineered Learner, AI Researcher & Engineer. He builds advanced AI systems and sustainable tech.",
  "about": "Aman is an explorer of the digital and physical frontiers, specializing in MLOps, Liquid Neural Networks, and decentralized systems.",
  "aman": "That's me. I'm a Genetically Engineered Learner focused on AI, MLOps, and Climate Tech.",

  // projects
  "projects": "ACCESSING PROJECT ARCHIVES...\n\n1. [YVOO] - AI Credit Intelligence\n2. [PAVANA] - Carbon Capture Tech\n3. [RAKSHAK] - River Energy Harvester\n4. [LIQUID] - Neural Network Research\n\nType a project name (e.g., 'yvoo') for details.",
  "yvoo": ">> YVOO\nStatus: Deployed\nStack: Python, ML, React\n\nAn AI-driven credit intelligence platform achieving 90%+ accuracy in credit scoring using ensemble learning algorithms.",
  "pavana": ">> PAVANA\nStatus: Prototype\nTech: Material Science, Solar\n\nA solar-powered carbon capture system utilizing novel gradient composite metal chambers for maximized efficiency.",
  "rakshak": ">> RAKSHAK\nStatus: Research\nFocus: Clean Energy, Ecology\n\nA wildlife-friendly river-flow energy harvester designed to generate power without disrupting aquatic migration paths.",
  "liquid": ">> LIQUID NEURAL NETWORKS\nStatus: Ongoing Research\nFocus: Adaptive AI\n\nResearching continuous-time recurrent neural networks that adapt to dynamic environments in real-time.",

  // contact
  "contact": "UPLINK CHANNELS:\n\n[EMAIL] amannbhv.cswork@gmail.com\n[LINKEDIN] linkedin.com/in/aman-anubhav\n[GITHUB] github.com/aman-anubhav",
  "email": "amannbhv.cswork@gmail.com",
  "linkedin": "Signal detected: linkedin.com/in/aman-anubhav",
  "github": "Repo located: github.com/aman-anubhav",

  // skills
  "skills": "NEURAL SKILL TREE:\n\n[LANGUAGES] Python, JavaScript, C++, Rust\n[AI/ML] PyTorch, TensorFlow, Scikit-learn, LangChain\n[WEB] React, Next.js, Node.js, Tailwind\n[CLOUD] AWS, Google Cloud, Docker, Kubernetes",

  // system
  "help": "SYSTEM COMMANDS [OFFLINE MODE]:\n\n> who       : Identity verification\n> projects  : List major initiatives\n> skills    : Technical capabilities\n> contact   : Communication channels\n> clear     : Purge terminal logs\n\n[PROJECT SHORTCUTS]\n> yvoo, pavana, rakshak, liquid",
  "status": "SYSTEM REPORT:\n> Uplink: OFFLINE\n> Local Core: ONLINE\n> Integrity: 100%",
  "default": "Command not recognized in Local Cache. Type 'help' for available offline commands."
};

const TerminalOverlay = ({ isOpen, onClose }) => {
  const [input, setInput] = useState('');
  const [logs, setLogs] = useState([
    { src: 'SYS', msg: "If System Offline? : Try 'help','about','clear'" },
    { src: 'AI', msg: "Terminal Ready. Accessing Aman Anubhav's digital consciousness. How can I assist?" }
  ]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isOffline, setIsOffline] = useState(false);
  const endRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => endRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
      inputRef.current?.focus();
    }
  }, [logs, isOpen]);

  const processOfflineResponse = (query) => {
    const lowerQuery = query.toLowerCase();
    let reply = OFFLINE_RESPONSES.default;

    // Check for exact command match first
    if (OFFLINE_RESPONSES[lowerQuery]) {
      reply = OFFLINE_RESPONSES[lowerQuery];
    } else {
      // Fuzzy search in keys
      for (const [key, response] of Object.entries(OFFLINE_RESPONSES)) {
        if (lowerQuery.includes(key)) {
          reply = response;
          break;
        }
      }
    }
    return reply;
  };

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

    // --- OFFLINE MODE HANDLER ---
    if (isOffline) {
      setTimeout(() => {
        const reply = processOfflineResponse(userQuery);
        setLogs(prev => {
          const newLogs = [...prev];
          newLogs[newLogs.length - 1] = { src: 'AI', msg: reply };
          return newLogs;
        });
        setIsProcessing(false);
      }, 400); // Simulated local latency
      return;
    }

    // --- ONLINE MODE HANDLER ---
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
      console.warn("Switching to offline protocol:", err);
      setIsOffline(true); // PERMANENTLY SWITCH TO OFFLINE MODE

      const reply = processOfflineResponse(userQuery);

      setTimeout(() => {
        setLogs(prev => {
          const newLogs = [...prev];
          const lastIndex = newLogs.length - 1;
          newLogs[lastIndex] = {
            src: 'AI',
            msg: `[!] Connection Lost. Switching to Local Database...\n\n${reply}`
          };
          return newLogs;
        });
      }, 600);

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

            <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] uppercase font-bold tracking-wider border transition-colors duration-300 ${isOffline ? 'bg-red-900/20 text-red-400 border-red-800/50' : 'bg-blue-900/20 text-blue-400 border-blue-800/50'}`}>
              {isOffline ? <WifiOff size={12} /> : <Wifi size={12} />}
              <span>{isOffline ? 'OFFLINE MODE' : 'Mainframe Active'}</span>
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
              placeholder={isOffline ? "Enter local command (try 'help')..." : "Enter command..."}
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