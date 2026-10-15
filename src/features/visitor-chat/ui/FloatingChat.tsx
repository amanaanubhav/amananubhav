'use client';

import { useCallback, useState } from 'react';
import { Send, X } from 'lucide-react';
import { motion } from 'motion/react';

import { useTheme } from '@/shared/lib/theme';

import { useVisitorChat } from '../model/use-visitor-chat';
import { ChatWindow } from './ChatWindow';

export interface FloatingChatProps {
  onOpenTerminal: () => void;
  onOpenVault: () => void;
}

export function FloatingChat({ onOpenTerminal, onOpenVault }: FloatingChatProps) {
  const { isDark } = useTheme();
  const chat = useVisitorChat();
  const [isOpen, setIsOpen] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const close = useCallback(() => setIsOpen(false), []);

  return (
    <motion.div
      drag
      dragMomentum={false}
      onDragStart={() => setIsDragging(true)}
      onDragEnd={() => {
        setTimeout(() => setIsDragging(false), 150);
      }}
      className="fixed bottom-6 right-6 z-[100] flex flex-col items-end"
    >
      {/* Chat Window */}
      {isOpen && (
        <ChatWindow
          chat={chat}
          onClose={close}
          onOpenTerminal={onOpenTerminal}
          onOpenVault={onOpenVault}
        />
      )}

      {/* Floating Toggle Button */}
      <motion.button
        onClick={(e) => {
          if (isDragging) {
            e.preventDefault();
            return;
          }
          setIsOpen(!isOpen);
        }}
        animate={{ y: [0, -4, 0] }}
        transition={{ repeat: Infinity, duration: 5, ease: "easeInOut" }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className={`w-14 h-14 rounded-2xl shadow-[0_15px_30px_-5px_rgba(0,0,0,0.3)] flex items-center justify-center border transition-colors ${isDark ? 'bg-zinc-100 text-black border-white/20 hover:bg-white hover:shadow-[0_20px_40px_-5px_rgba(255,255,255,0.3)]' : 'bg-zinc-900 text-white border-black/10 hover:bg-black hover:shadow-[0_20px_40px_-5px_rgba(0,0,0,0.4)]'}`}
      >
        {isOpen ? <X size={24} /> : <Send size={24} className="-ml-1 mt-1" />}
      </motion.button>
    </motion.div>
  );
}
