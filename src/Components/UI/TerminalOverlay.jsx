import React, { useState, useEffect, useRef } from 'react';
import { Terminal, X, Send, Wifi, WifiOff, Cpu } from 'lucide-react';
import { RESUME } from '../../Data/resume';
import { ADVENTURES } from '../../Data/adventures'; // Importing Adventures for more context

const VITE_GEMINI_API = import.meta.env.VITE_VITE_GEMINI_API;

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
  "who": "Aman Anubhav is a Genetically Engineered Learner, AI Researcher & Engineer.",
  "aman": "That's me. I'm a Genetically Engineered Learner focused on AI, MLOps, and Climate Tech.",
  "yvoo": "YVOO is an AI-driven credit intelligence platform I built. It automates credit scoring with 90%+ accuracy.",
  "pavana": "PAVANA is a solar-powered carbon capture system design utilizing novel gradient composite metal chambers.",
  "rakshak": "RAKSHAK is a wildlife-friendly river-flow energy harvester I designed.",
  "liquid": "I am researching Liquid Neural Networks (LNNs) for adaptive, continuous-time AI systems.",

  "contact": "Email: amannbhv.cswork@gmail.com",
  "default": "Connection to Mainframe unstable. API unavailable. Try 'help' for local commands."
};

const TerminalOverlay = ({ isOpen, onClose }) => {
  const [input, setInput] = useState('');
  const [logs, setLogs] = useState([
    { src: 'SYS', msg: 'Initializing Terminal v5.0...' },
    { src: 'SYS', msg: 'Loading Knowledge Core... OK' },
    { src: 'SYS', msg: 'Establishing Secure Uplink... ' + (VITE_GEMINI_API ? 'CONNECTED' : 'OFFLINE MODE') },
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

  const processLocalCommand = (cmd) => {
    const lowerCmd = cmd.toLowerCase().trim();
    if (lowerCmd === 'clear') { setLogs([]); return true; }
    if (lowerCmd === 'help') {
      const helpText = Object.entries(SYSTEM_COMMANDS).map(([k, v]) => `${k.padEnd(10)} - ${v}`).join('\n');
      setLogs(prev => [...prev, { src: 'SYS', msg: helpText }]);
      return true;
    }
    if (lowerCmd === 'bio' || lowerCmd === 'about') { setLogs(prev => [...prev, { src: 'SYS', msg: RESUME.about }]); return true; }
    if (lowerCmd === 'projects') {
      const projectList = RESUME.projects.map(p => `• ${p.title}: ${p.desc}`).join('\n');
      setLogs(prev => [...prev, { src: 'SYS', msg: projectList }]);
      return true;
    }
    if (lowerCmd === 'contact') {
      setLogs(prev => [...prev, { src: 'SYS', msg: `Email: ${RESUME.links.email}\nLinkedIn: ${RESUME.links.linkedin}` }]);
      return true;
    }
    return false;
  };

  const handleCommand = async (e) => {
    e.preventDefault();
    if (!input.trim() || isProcessing) return;

    const userQuery = input;
    setLogs(prev => [...prev, { src: 'USR', msg: userQuery }]);
    setInput('');
    setIsProcessing(true);

    // Prioritize Gemini for EVERYTHING unless it's a specific system command like 'clear'
    if (userQuery.toLowerCase() === 'clear') {
      setLogs([]);
      setIsProcessing(false);
      return;
    }

    try {
      if (!VITE_GEMINI_API) throw new Error("No API Key");

      // Construct a rich context object
      const fullContext = {
        resume: RESUME,
        adventures: ADVENTURES,
        instructions: "You are the AI interface for Aman Anubhav. Speak in the first person as if you are a digital extension of him, or an advanced AI assistant representing him. Be professional, highly technical, and detailed. Use a cool, slightly blue-hued cyberpunk tone but remain readable. You have access to his entire portfolio, resume, and blog stories. Answer widely and comprehensively about his work, life, and philosophy."
      };

      const systemPrompt = `
        You are the >_ TERMINAL AI for Aman Anubhav.
        
        CONTEXT DATA:
        ${JSON.stringify(fullContext)}

        GUIDELINES:
        1. Answer strictly based on the provided context.
        2. If the user asks about Aman, answer as if you know everything about his professional and academic life.
        3. Keep responses concise but information-dense (under 100 words unless asked for more).
        4. Tone: Technical, Blue-Cyberpunk, Efficient, Helpful.
        5. If asked about something not in the context, politely state you only have access to Aman's public archives.
      `;

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${VITE_GEMINI_API}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{
              parts: [{ text: `System Instructions: ${systemPrompt}\n\nUser Query: ${userQuery}` }]
            }]
          })
        }
      );

      if (!response.ok) throw new Error(response.statusText);
      const data = await response.json();
      const reply = data.candidates?.[0]?.content?.parts?.[0]?.text;

      if (reply) {
        setLogs(prev => [...prev, { src: 'AI', msg: reply }]);
      } else {
        throw new Error("Empty response");
      }

    } catch (err) {
      console.warn("API Failed:", err);
      // Fallback to local if API fails
      if (!processLocalCommand(userQuery)) {
        let offlineReply = OFFLINE_RESPONSES.default;
        for (const [key, response] of Object.entries(OFFLINE_RESPONSES)) {
          if (userQuery.toLowerCase().includes(key)) offlineReply = response;
        }
        setLogs(prev => [...prev, {
          src: 'SYS',
          msg: `[!] Connection Lost. Switching to Offline Cache.\n> ${offlineReply}`
        }]);
      }
    } finally {
      setIsProcessing(false);
      // Keep focus
      setTimeout(() => inputRef.current?.focus(), 10);
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
            <span className="text-blue-100 font-bold">{">_ TERMINAL"}</span>
            <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] uppercase font-bold tracking-wider ${VITE_GEMINI_API ? 'bg-blue-900/20 text-blue-400 border border-blue-800/50' : 'bg-red-900/20 text-red-500 border border-red-800/50'}`}>
              {VITE_GEMINI_API ? <Wifi size={12} /> : <WifiOff size={12} />}
              <span>{VITE_GEMINI_API ? 'Mainframe Active' : 'Offline'}</span>
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