"use client";

// Global tangentbordsgenvägar — monteras en gång i layout.tsx
// Håller state för vilka popups som är öppna och laddar prompts för CommandPalette
// Renderar också den alltid-synliga "✨ Förbättra text"-knappen (FAB)

import { useState, useEffect, useCallback } from "react";
import { Sparkles } from "lucide-react";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import CommandPalette from "@/components/prompts/CommandPalette";
import QuickEnhance from "@/components/prompts/QuickEnhance";
import type { Prompt } from "@/types/prompt";

export default function KeyboardShortcuts() {
  const [showPalette, setShowPalette]   = useState(false);
  const [showEnhance, setShowEnhance]   = useState(false);
  const [prompts, setPrompts]           = useState<Prompt[]>([]);
  // Tooltip-synlighet för FAB-knappen
  const [fabHovered, setFabHovered]     = useState(false);

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
      {/* ── Floating Action Button — alltid synlig på alla sidor ──────── */}
      {/* Döljs när modalen redan är öppen för att inte täcka X-knappen */}
      {!showEnhance && !showPalette && (
        <div className="fixed bottom-6 right-6 z-40 flex flex-col items-end gap-2">

          {/* Tooltip — visas vid hover */}
          {fabHovered && (
            <div className="rounded-lg bg-zinc-800 border border-zinc-700 px-3 py-1.5 text-xs text-zinc-300 shadow-lg whitespace-nowrap">
              Kortkommando: <kbd className="rounded bg-zinc-700 px-1.5 py-0.5 font-mono text-cyan-400">Ctrl+E</kbd>
            </div>
          )}

          {/* Knappen */}
          <button
            onClick={openEnhance}
            onMouseEnter={() => setFabHovered(true)}
            onMouseLeave={() => setFabHovered(false)}
            aria-label="Öppna Quick Enhance (Ctrl+E)"
            title="Förbättra text med AI — Ctrl+E"
            className="
              group flex items-center gap-2.5
              rounded-2xl bg-cyan-600 px-5 py-3.5
              text-base font-bold text-white shadow-xl
              transition-all duration-150
              hover:bg-cyan-500 hover:scale-105 hover:shadow-cyan-500/30
              active:scale-95
            "
          >
            <Sparkles
              size={20}
              className="transition-transform duration-150 group-hover:rotate-12"
            />
            ✨ Förbättra text
          </button>
        </div>
      )}

      {/* ── Modaler ───────────────────────────────────────────────────── */}
      {showPalette && (
        <CommandPalette prompts={prompts} onClose={closePalette} />
      )}
      {showEnhance && (
        <QuickEnhance onClose={closeEnhance} />
      )}
    </>
  );
}
