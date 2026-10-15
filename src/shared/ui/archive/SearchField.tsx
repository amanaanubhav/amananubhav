'use client';

import { Search } from 'lucide-react';
import { useTheme } from '@/shared/lib/theme';

export interface SearchFieldProps {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  /** Width classes for the input, e.g. "w-32" or "w-40 md:w-64". */
  className: string;
}

export function SearchField({ value, onChange, placeholder, className }: SearchFieldProps) {
  const { isDark } = useTheme();
  return (
    <div className={`flex items-center gap-2 px-3 py-2 border rounded-sm ${isDark ? 'border-zinc-800 bg-zinc-900/50' : 'border-zinc-300 bg-white'}`}>
      <Search className="w-4 h-4 opacity-50" />
      <input
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`bg-transparent text-sm outline-none ${className} placeholder-opacity-50`}
      />
    </div>
  );
}
