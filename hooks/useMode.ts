'use client';

import { useState, useEffect } from 'react';

export type Mode = 'youtube' | 'dropship';

// Custom event so multiple useMode()-instanser synkar inom samma tab
const MODE_EVENT = 'flowdesk:modechange';

export function useMode(): { mode: Mode; setMode: (m: Mode) => void } {
  const [mode, setMode] = useState<Mode>('youtube');

  useEffect(() => {
    const savedMode = localStorage.getItem('selectedMode') as Mode | null;
    if (savedMode && ['youtube', 'dropship'].includes(savedMode)) {
      setMode(savedMode);
    }

    const handler = (e: Event) => {
      setMode((e as CustomEvent<Mode>).detail);
    };
    window.addEventListener(MODE_EVENT, handler);
    return () => window.removeEventListener(MODE_EVENT, handler);
  }, []);

  const setModeWithStorage = (newMode: Mode) => {
    setMode(newMode);
    localStorage.setItem('selectedMode', newMode);
    window.dispatchEvent(new CustomEvent<Mode>(MODE_EVENT, { detail: newMode }));
  };

  return { mode, setMode: setModeWithStorage };
}
