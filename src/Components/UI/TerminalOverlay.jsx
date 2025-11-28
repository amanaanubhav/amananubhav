import React, { useState, useEffect, useRef } from 'react';
import { Terminal, X, Send, Wifi, WifiOff, Cpu } from 'lucide-react';
import { RESUME } from '../../data/resume';

// Use Environment variable, fallback to the hardcoded key if missing
const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

// --- LOCAL KNOWLEDGE BASE (Offline Fallback) ---
const SYSTEM_COMMANDS = {
  help: "List all available system commands",
  clear: "Clear the terminal screen",
  bio: "Show detailed biography",
  skills: "List technical skill stack",
  projects: "List all major projects",
  contact: "Show contact information",
  socials: "List social media handles",
  philosophy: "Show core learning philosophy"
};

const OFFLINE_RESPONSES = {
  "who": "Aman Anubhav is a Genetically Engineered Learner, AI Researcher & Engineer. He didn't inherit talent—he built it.",
  "aman": "That's me. I'm a Genetically Engineered Learner focused on AI, MLOps, and Climate Tech.",
  "yvoo": "YVOO is an AI-driven credit intelligence platform I built. It automates credit scoring with 90%+ accuracy using XGBoost and synthetic data.",
  "pavana": "PAVANA is a solar-powered carbon capture system design utilizing novel gradient composite metal chambers to remove 90% atmospheric CO2.",
  "rakshak": "RAKSHAK is a wildlife-friendly river-flow energy harvester I designed, winning the 3M-CII Young Innovators Challenge.",
  "vyomagami": "VYOMAGAMI is a hybrid balloon-rocket satellite launch system concept reducing deployment costs by 60-70%.",
  "liquid": "I am researching Liquid Neural Networks (LNNs) for adaptive, continuous-time AI systems that learn post-deployment without retraining.",
  "nasa": "I partnered with NASA's IASC for asteroid search campaigns, helping discover asteroids currently under deep review.",
  "contact": "Email: amannbhv.cswork@gmail.com",
  "philosophy": "I didn't inherit talent—I built it. I refuse to learn for grades. I learn to solve real-world problems like climate change and financial exclusion.",
  "default": "Neural Link unstable. API unavailable. Query not found in local cache. Try 'help' for available commands."
};

const TerminalOverlay = ({ isOpen, onClose }) => {
  const [input, setInput] = useState('');
  const [logs, setLogs] = useState([
    { src: 'SYS', msg: 'Initializing Neural Link v3.7...' },
    { src: 'SYS', msg: 'Loading Local Knowledge Base... OK' },
    { src: 'SYS', msg: 'Checking Uplink... ' + (GEMINI_API_KEY ? 'CONNECTED' : 'OFFLINE MODE') },
    { src: 'AI', msg: "System Ready. Type 'help' for commands or ask me anything." }
  ]);
  const [isProcessing, setIsProcessing] = useState(false);
  const endRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
        endRef.current?.scrollIntoView({ behavior: 'smooth' });
        inputRef.current?.focus();
    }
  }, [logs, isOpen]);

  const processLocalCommand = (cmd) => {
    const lowerCmd = cmd.toLowerCase().trim();
    
    if (lowerCmd === 'clear') {
      setLogs([]);
      return true;
    }

    if (lowerCmd === 'help') {
      const helpText = Object.entries(SYSTEM_COMMANDS).map(([k, v]) => `${k.padEnd(10)} - ${v}`).join('\n');
      setLogs(prev => [...prev, { src: 'SYS', msg: helpText }]);
      return true;
    }

    if (lowerCmd === 'bio' || lowerCmd === 'about') {
      setLogs(prev => [...prev, { src: 'SYS', msg: RESUME.about + "\n\n" + RESUME.philosophy }]);
      return true;
    }

    if (lowerCmd === 'philosophy') {
        setLogs(prev => [...prev, { src: 'SYS', msg: RESUME.philosophy }]);
        return true;
    }

    if (lowerCmd === 'projects') {
      const projectList = RESUME.projects.map(p => `• ${p.title}: ${p.desc}`).join('\n');
      setLogs(prev => [...prev, { src: 'SYS', msg: projectList }]);
      return true;
    }
    
    if (lowerCmd === 'skills') {
      const skills = `Languages: ${RESUME.skills.languages.join(', ')}\nAI/ML: ${RESUME.skills.ai_ml.join(', ')}\nCloud: ${RESUME.skills.cloud_devops.join(', ')}`;
      setLogs(prev => [...prev, { src: 'SYS', msg: skills }]);
      return true;
    }

    if (lowerCmd === 'contact') {
      setLogs(prev => [...prev, { src: 'SYS', msg: `Email: ${RESUME.links.email}\nLinkedIn: ${RESUME.links.linkedin}\nGitHub: ${RESUME.links.github}` }]);
      return true;
    }

    if (lowerCmd === 'socials') {
        setLogs(prev => [...prev, { src: 'SYS', msg: `LinkedIn: ${RESUME.links.linkedin}\nGitHub: ${RESUME.links.github}\nNews Feature: ${RESUME.links.news}` }]);
        return true;
    }

    return false;
  };

  const getOfflineResponse = (query) => {
    const lowerQuery = query.toLowerCase();
    for (const [key, response] of Object.entries(OFFLINE_RESPONSES)) {
      if (lowerQuery.includes(key)) return response;
    }
    return OFFLINE_RESPONSES.default;
  };

  const handleCommand = async (e) => {
    e.preventDefault();
    if (!input.trim() || isProcessing) return;
    
    const userQuery = input;
    setLogs(prev => [...prev, { src: 'USR', msg: userQuery }]);
    setInput('');
    setIsProcessing(true);

    if (processLocalCommand(userQuery)) {
      setIsProcessing(false);
      return;
    }

    let apiFailed = false;

    // 1. Try Gemini AI
    try {
      if (!GEMINI_API_KEY) throw new Error("API Key Missing. Forced Offline Mode.");

      const systemPrompt = `
        You are the AI interface for Aman Anubhav's portfolio. 
        Identity: You are a sophisticated, slightly cyberpunk AI assistant.
        Tone: Professional but technical, concise, and helpful.
        Context: ${JSON.stringify(RESUME)}

        Instruction: Answer the user's query based ONLY on the context provided above. 
        - Provide specific details on projects like YVOO, PAVANA, and OceanBot when asked.
        - If the answer is not in the context, state you lack data access. 
        - Keep answers under 60 words.
      `;

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: userQuery }] }],
            systemInstruction: { parts: [{ text: systemPrompt }] }
          })
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`API Error: ${response.status} - ${errorText.substring(0, 100)}`);
      }

      const data = await response.json();
      
      if (data.error) {
        throw new Error(`Gemini Error: ${data.error.message}`);
      }

      const reply = data.candidates?.[0]?.content?.parts?.[0]?.text;
      
      if (reply) {
        setLogs(prev => [...prev, { src: 'AI', msg: reply }]);
      } else {
        throw new Error("Empty or invalid response from AI.");
      }

    } catch (err) {
      apiFailed = true;
      // Show the actual error in the terminal for debugging
      setLogs(prev => [...prev, { 
        src: 'ERR', 
        msg: `[!] Gemini Link Failure: ${err.message}` 
      }]);
    } finally {
      // 2. Fallback to Local Keyword Bot if API failed
      if (apiFailed) {
        const offlineReply = getOfflineResponse(userQuery);
        setLogs(prev => [...prev, { 
          src: 'SYS', 
          msg: `> Switching to Local Cache for query.\n> ${offlineReply}` 
        }]);
      }
      setIsProcessing(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 font-mono animate-in zoom-in duration-200">
      <div className="w-full max-w-3xl h-[600px] bg-zinc-950 border border-zinc-800 rounded-lg shadow-2xl flex flex-col overflow-hidden relative">
        
        <div className="h-10 border-b border-zinc-800 flex items-center justify-between px-4 bg-zinc-900/50">
          <div className="flex items-center gap-3 text-xs">
            <Terminal size={14} className="text-green-500" />
            <span className="text-zinc-400">NEURAL_LINK_V3.7</span>
            <div className={`flex items-center gap-1 px-2 py-0.5 rounded ${GEMINI_API_KEY ? 'bg-green-900/30 text-green-500' : 'bg-yellow-900/30 text-yellow-500'}`}>
               {GEMINI_API_KEY ? <Wifi size={10} /> : <WifiOff size={10} />}
               <span>{GEMINI_API_KEY ? 'ONLINE' : 'LOCAL'}</span>
            </div>
          </div>
          <button onClick={onClose} className="hover:text-red-500 text-zinc-500 transition-colors"><X size={16} /></button>
        </div>

        <div className="flex-1 p-6 overflow-y-auto space-y-3 text-sm z-10 font-cyber" onClick={() => inputRef.current?.focus()}>
          {logs.map((l, i) => (
            <div key={i} className="flex gap-4 items-start">
              <span className={`w-10 font-bold mt-1 shrink-0 ${l.src === 'USR' ? 'text-blue-400' : l.src === 'AI' ? 'text-green-500' : l.src === 'ERR' ? 'text-red-500' : 'text-purple-500'}`}>
                {l.src}
              </span>
              <span className={`text-zinc-300 whitespace-pre-wrap leading-relaxed ${l.src === 'AI' ? 'typewriter' : ''}`}>
                {l.msg}
              </span>
            </div>
          ))}
          {isProcessing && (
            <div className="flex gap-4 items-center text-zinc-500 mt-2">
               <Cpu size={14} className="animate-spin" />
               <span className="text-xs animate-pulse">Processing query...</span>
            </div>
          )}
          <div ref={endRef} />
        </div>

        <div className="p-4 border-t border-zinc-800 bg-black z-10">
          <form onSubmit={handleCommand} className="flex gap-3 items-center">
            <span className="text-green-500 animate-pulse">➜</span>
            <input 
              ref={inputRef}
              autoFocus
              type="text" 
              value={input}
              onChange={e => setInput(e.target.value)}
              className="flex-1 bg-transparent outline-none text-white font-mono placeholder-zinc-700"
              placeholder="Enter command or query..."
              autoComplete="off"
            />
            <button type="submit" className="text-zinc-500 hover:text-green-500 disabled:opacity-30 transition-colors" disabled={isProcessing}>
              <Send size={16}/>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default TerminalOverlay;