"use client";

// Command Palette — öppnas med Ctrl+K
// Sök bland prompts, välj för att kopiera till urklipp

import { useEffect, useRef, useState } from "react";
import { Search, Copy, Check, X } from "lucide-react";
import type { Prompt } from "@/types/prompt";
import { CATEGORY_LABELS } from "@/types/prompt";
import { cn } from "@/lib/utils";

interface Props {
  prompts:  Prompt[];
  onClose:  () => void;
}

export default function CommandPalette({ prompts, onClose }: Props) {
  const [query, setQuery]         = useState("");
  const [activeIdx, setActiveIdx] = useState(0);
  const [copiedId, setCopiedId]   = useState<string | null>(null);
  const inputRef                  = useRef<HTMLInputElement>(null);

  // Fokusera input när paletten öppnas
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Filtrera prompts efter sökning
  const filtered = prompts.filter((p) => {
    const q = query.toLowerCase();
    return (
      p.title.toLowerCase().includes(q) ||
      p.description.toLowerCase().includes(q) ||
      p.tags.some((t) => t.toLowerCase().includes(q)) ||
      p.category.toLowerCase().includes(q)
    );
  });

  // Återställ index när filtreringen ändras
  useEffect(() => setActiveIdx(0), [query]);

  // Piltangenter + Enter för navigering
  useEffect(() => {
    function handler(e: KeyboardEvent) {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setActiveIdx((i) => Math.min(i + 1, filtered.length - 1));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setActiveIdx((i) => Math.max(i - 1, 0));
      } else if (e.key === "Enter" && filtered[activeIdx]) {
        e.preventDefault();
        handleSelect(filtered[activeIdx]);
      } else if (e.key === "Escape") {
        onClose();
      }
    }
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtered, activeIdx]);

  async function handleSelect(p: Prompt) {
    await navigator.clipboard.writeText(p.promptText);
    setCopiedId(p.id);
    setTimeout(() => {
      setCopiedId(null);
      onClose();
    }, 1200);
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/70 pt-24 px-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="w-full max-w-xl rounded-2xl border border-zinc-700 bg-zinc-900 shadow-2xl overflow-hidden">

        {/* Sök-input */}
        <div className="flex items-center gap-3 border-b border-zinc-800 px-4 py-4">
          <Search size={20} className="text-zinc-500 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Sök bland prompts..."
            className="flex-1 bg-transparent text-lg text-white placeholder-zinc-600 focus:outline-none"
          />
          <button onClick={onClose} className="text-zinc-600 hover:text-zinc-300">
            <X size={18} />
          </button>
        </div>

        {/* Resultatlista */}
        <div className="max-h-[400px] overflow-y-auto">
          {filtered.length === 0 ? (
            <p className="px-5 py-8 text-center text-zinc-600">
              Inga prompts hittades för &ldquo;{query}&rdquo;
            </p>
          ) : (
            filtered.map((p, i) => (
              <button
                key={p.id}
                onClick={() => handleSelect(p)}
                className={cn(
                  "w-full flex items-center justify-between gap-3 px-5 py-4 text-left transition-colors",
                  i === activeIdx ? "bg-cyan-600/15" : "hover:bg-zinc-800"
                )}
              >
                <div className="flex-1 min-w-0">
                  <p className="text-base font-semibold text-white truncate">{p.title}</p>
                  <p className="text-sm text-zinc-500 truncate">{p.description}</p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span className="rounded-full bg-zinc-800 px-2 py-0.5 text-xs text-zinc-500">
                    {CATEGORY_LABELS[p.category]}
                  </span>
                  {copiedId === p.id ? (
                    <Check size={16} className="text-green-400" />
                  ) : (
                    <Copy size={16} className="text-zinc-600" />
                  )}
                </div>
              </button>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-zinc-800 px-5 py-3 flex gap-4">
          <span className="text-xs text-zinc-600">↑↓ Navigera</span>
          <span className="text-xs text-zinc-600">Enter Kopiera</span>
          <span className="text-xs text-zinc-600">Esc Stäng</span>
        </div>

      </div>
    </div>
  );
}
