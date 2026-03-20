'use client';

import { useMode } from '@/hooks/useMode';

export function ModeSwitcher() {
  const { mode, setMode } = useMode();

  return (
    <div className="px-4 py-3 border-b border-neutral-800">
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setMode('youtube')}
          className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
            mode === 'youtube'
              ? 'bg-cyan-600 text-white'
              : 'bg-neutral-800 text-neutral-400 hover:bg-neutral-700'
          }`}
        >
          YouTube
        </button>
        <button
          type="button"
          onClick={() => setMode('dropship')}
          className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
            mode === 'dropship'
              ? 'bg-cyan-600 text-white'
              : 'bg-neutral-800 text-neutral-400 hover:bg-neutral-700'
          }`}
        >
          Dropship
        </button>
      </div>
    </div>
  );
}
