'use client';

import { useEffect } from 'react';

export default function RouteError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-6 px-6 text-center font-cyber">
      <p className="text-xs tracking-[0.3em] uppercase opacity-60">System Fault</p>
      <h1 className="text-2xl font-bold tracking-widest uppercase">Something went wrong</h1>
      <button
        type="button"
        onClick={reset}
        className="px-6 py-2 border rounded-full text-xs tracking-widest uppercase"
      >
        Retry
      </button>
    </div>
  );
}
