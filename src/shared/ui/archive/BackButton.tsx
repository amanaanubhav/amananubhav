'use client';

import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { useTheme } from '@/shared/lib/theme';

export interface BackButtonProps {
  className?: string;
}

export function BackButton({ className }: BackButtonProps) {
  const router = useRouter();
  const { isDark } = useTheme();
  return (
    <button
      onClick={() => router.back()}
      className={`group flex items-center gap-2 mb-8 text-xs font-cyber tracking-widest uppercase transition-colors ${isDark ? 'text-zinc-500 hover:text-white' : 'text-zinc-500 hover:text-black'}${className ? ` ${className}` : ''}`}
    >
      <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
      Return to Signal
    </button>
  );
}
