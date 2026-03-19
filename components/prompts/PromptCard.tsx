"use client";

// PromptCard — stort, luftigt kort med tydliga knappar (dyslexivänligt)

import { Copy, Pencil, Trash2, Check } from "lucide-react";
import { useState } from "react";
import type { Prompt, PromptCategory } from "@/types/prompt";
import { CATEGORY_LABELS, AGENT_LABELS } from "@/types/prompt";
import { cn } from "@/lib/utils";

// Färg per kategori
const CATEGORY_COLORS: Record<PromptCategory, string> = {
  youtube:   "bg-red-500/15 text-red-300 border-red-500/20",
  business:  "bg-blue-500/15 text-blue-300 border-blue-500/20",
  creative:  "bg-pink-500/15 text-pink-300 border-pink-500/20",
  coding:    "bg-green-500/15 text-green-300 border-green-500/20",
  marketing: "bg-orange-500/15 text-orange-300 border-orange-500/20",
};

interface Props {
  prompt:   Prompt;
  onEdit:   (p: Prompt) => void;
  onDelete: (id: string) => void;
}

export default function PromptCard({ prompt, onEdit, onDelete }: Props) {
  const [copied, setCopied] = useState(false);

  // Kopierar prompt-texten till urklipp
  async function handleUse() {
    await navigator.clipboard.writeText(prompt.promptText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-zinc-800 bg-zinc-900 p-6 transition-all hover:border-zinc-700">

      {/* Titel och kategori-badge */}
      <div className="flex items-start justify-between gap-3">
        <h3 className="text-lg font-bold text-white leading-snug">{prompt.title}</h3>
        <span className={cn(
          "shrink-0 rounded-full border px-3 py-1 text-xs font-semibold",
          CATEGORY_COLORS[prompt.category]
        )}>
          {CATEGORY_LABELS[prompt.category]}
        </span>
      </div>

      {/* Beskrivning */}
      <p className="text-sm text-zinc-400 leading-relaxed">{prompt.description}</p>

      {/* Agent-typ och taggar */}
      <div className="flex flex-wrap gap-2">
        <span className="rounded-full bg-zinc-800 px-3 py-1 text-xs text-zinc-400">
          🤖 {AGENT_LABELS[prompt.agentType]}
        </span>
        {prompt.tags.slice(0, 3).map((tag) => (
          <span key={tag} className="rounded-full bg-zinc-800 px-3 py-1 text-xs text-zinc-500">
            #{tag}
          </span>
        ))}
      </div>

      {/* Förhandsgranskning av prompt-text */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-4">
        <p className="line-clamp-3 font-mono text-xs text-zinc-500 leading-relaxed">
          {prompt.promptText}
        </p>
      </div>

      {/* Knappar — stora och tydliga */}
      <div className="flex gap-3 pt-1">
        {/* Använd = kopiera till urklipp */}
        <button
          onClick={handleUse}
          className={cn(
            "flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-bold transition-all",
            copied
              ? "bg-green-600 text-white"
              : "bg-cyan-600 text-white hover:bg-cyan-500"
          )}
        >
          {copied ? <Check size={16} /> : <Copy size={16} />}
          {copied ? "Kopierad!" : "Använd"}
        </button>

        {/* Redigera */}
        <button
          onClick={() => onEdit(prompt)}
          className="flex items-center justify-center gap-2 rounded-xl border border-zinc-700 bg-zinc-800 px-4 py-3 text-sm font-bold text-zinc-200 transition hover:bg-zinc-700"
        >
          <Pencil size={16} />
          Redigera
        </button>

        {/* Ta bort */}
        <button
          onClick={() => onDelete(prompt.id)}
          className="flex items-center justify-center gap-2 rounded-xl border border-red-800/50 bg-red-900/20 px-4 py-3 text-sm font-bold text-red-400 transition hover:bg-red-900/40"
          title="Ta bort prompt"
        >
          <Trash2 size={16} />
        </button>
      </div>
    </div>
  );
}
