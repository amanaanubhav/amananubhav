'use client';

import { useChat } from 'ai/react';
import ReactMarkdown from 'react-markdown';

export default function ChatComponent() {
  // useChat automatically points to /api/chat by default
  const { messages, input, handleInputChange, handleSubmit, isLoading } = useChat();

  return (
    <div className="flex flex-col w-full max-w-2xl mx-auto h-[600px] border border-zinc-800 bg-zinc-950 rounded-xl overflow-hidden shadow-2xl">
      {/* Messages Window */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {messages.map((m) => (
          <div
            key={m.id}
            className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[85%] rounded-xl px-4 py-2 text-sm ${
                m.role === 'user'
                  ? 'bg-zinc-100 text-zinc-950 font-medium'
                  : 'bg-zinc-900 text-zinc-100 border border-zinc-800'
              }`}
            >
              <div className="text-xs opacity-50 mb-1">
                {m.role === 'user' ? 'You' : 'Assistant'}
              </div>
              <div className="prose prose-invert max-w-none">
                <ReactMarkdown>{m.content}</ReactMarkdown>
              </div>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="text-zinc-500 text-xs animate-pulse">AI is thinking...</div>
        )}
      </div>

      {/* Input Form */}
      <form onSubmit={handleSubmit} className="p-4 border-t border-zinc-800 bg-zinc-900/50 flex gap-2">
        <input
          value={input}
          onChange={handleInputChange}
          placeholder="Ask something..."
          className="flex-1 bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-2 text-sm text-zinc-100 focus:outline-none focus:ring-1 focus:ring-zinc-700"
          disabled={isLoading}
        />
        <button
          type="submit"
          disabled={isLoading || !input.trim()}
          className="bg-zinc-100 hover:bg-zinc-200 text-zinc-950 text-sm font-medium px-4 py-2 rounded-lg transition disabled:opacity-50"
        >
          Send
        </button>
      </form>
    </div>
  );
}
