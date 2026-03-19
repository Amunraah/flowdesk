"use client";

// Global tangentbordsgenvägar — monteras en gång i layout.tsx
// Håller state för vilka popups som är öppna och laddar prompts för CommandPalette

import { useState, useEffect, useCallback } from "react";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import CommandPalette from "@/components/prompts/CommandPalette";
import QuickEnhance from "@/components/prompts/QuickEnhance";
import type { Prompt } from "@/types/prompt";

export default function KeyboardShortcuts() {
  const [showPalette, setShowPalette]   = useState(false);
  const [showEnhance, setShowEnhance]   = useState(false);
  const [prompts, setPrompts]           = useState<Prompt[]>([]);

  // Ladda prompts när Command Palette öppnas
  useEffect(() => {
    if (showPalette && prompts.length === 0) {
      fetch("/api/prompts")
        .then((r) => r.json())
        .then((d) => setPrompts(Array.isArray(d) ? (d as Prompt[]) : []))
        .catch(console.error);
    }
  }, [showPalette, prompts.length]);

  const openPalette  = useCallback(() => { setShowEnhance(false); setShowPalette(true);  }, []);
  const openEnhance  = useCallback(() => { setShowPalette(false); setShowEnhance(true);  }, []);
  const closePalette = useCallback(() => setShowPalette(false), []);
  const closeEnhance = useCallback(() => setShowEnhance(false), []);

  // Registrera globala shortcuts
  useKeyboardShortcuts({
    onCommandPalette: openPalette,
    onQuickEnhance:   openEnhance,
  });

  return (
    <>
      {showPalette && (
        <CommandPalette prompts={prompts} onClose={closePalette} />
      )}
      {showEnhance && (
        <QuickEnhance onClose={closeEnhance} />
      )}
    </>
  );
}
