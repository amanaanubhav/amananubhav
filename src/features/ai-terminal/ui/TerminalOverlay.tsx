'use client';

import { Terminal, X, Send, Wifi, WifiOff, Cpu } from 'lucide-react';
import { useTerminalSession } from '../model/use-terminal-session';

export interface TerminalOverlayProps {
  isOpen: boolean;
  onClose: () => void;
}

export function TerminalOverlay({ isOpen, onClose }: TerminalOverlayProps) {
  const { input, setInput, logs, isProcessing, isOffline, endRef, inputRef, handleCommand } =
    useTerminalSession(isOpen);

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
}
