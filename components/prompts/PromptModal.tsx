"use client";

// Modal för att skapa och redigera prompts
// Stängs med Escape, sparas med Ctrl+S eller knapp

import { useEffect, useState } from "react";
import { X, Save } from "lucide-react";
import type { Prompt, PromptCategory, AgentType } from "@/types/prompt";
import { CATEGORY_LABELS, AGENT_LABELS } from "@/types/prompt";

interface Props {
  initial?: Prompt | null;           // null = skapa ny, Prompt = redigera
  onSave:   (p: Partial<Prompt>) => void;
  onClose:  () => void;
}

const CATEGORIES = Object.keys(CATEGORY_LABELS) as PromptCategory[];
const AGENT_TYPES = Object.keys(AGENT_LABELS) as AgentType[];

const EMPTY: Partial<Prompt> = {
  title:       "",
  description: "",
  category:    "youtube",
  agentType:   "general",
  promptText:  "",
  tags:        [],
};

export default function PromptModal({ initial, onSave, onClose }: Props) {
  const [form, setForm] = useState<Partial<Prompt>>(initial ?? EMPTY);
  const [tagsInput, setTagsInput] = useState((initial?.tags ?? []).join(", "));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Stäng med Escape, spara med Ctrl+S
  useEffect(() => {
    function handler(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
      if (e.ctrlKey && e.key === "s") {
        e.preventDefault();
        handleSave();
      }
    }
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form, tagsInput]);

  function set(key: keyof Prompt, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
    setError(null);
  }

  async function handleSave() {
    if (!form.title?.trim()) { setError("Titel krävs"); return; }
    if (!form.promptText?.trim()) { setError("Prompt-text krävs"); return; }

    setSaving(true);
    const tags = tagsInput.split(",").map((t) => t.trim()).filter(Boolean);
    onSave({ ...form, tags });
    setSaving(false);
  }

  return (
    /* Bakgrundsoverlay */
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="w-full max-w-2xl rounded-2xl border border-zinc-700 bg-zinc-900 shadow-2xl flex flex-col max-h-[90vh]">

        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-800 px-6 py-4 shrink-0">
          <h2 className="text-lg font-bold text-white">
            {initial ? "✏️ Redigera prompt" : "➕ Ny prompt"}
          </h2>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-zinc-500 hover:bg-zinc-800 hover:text-zinc-200 transition"
          >
            <X size={18} />
          </button>
        </div>

        {/* Formulär */}
        <div className="overflow-y-auto flex-1 px-6 py-5 space-y-5">

          {/* Titel */}
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-zinc-300">
              Titel <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={form.title ?? ""}
              onChange={(e) => set("title", e.target.value)}
              placeholder="T.ex. Viral Video Idea Generator"
              className="w-full rounded-xl border border-zinc-700 bg-zinc-800 px-4 py-3 text-base text-white placeholder-zinc-600 focus:border-cyan-500 focus:outline-none"
            />
          </div>

          {/* Beskrivning */}
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-zinc-300">Beskrivning</label>
            <input
              type="text"
              value={form.description ?? ""}
              onChange={(e) => set("description", e.target.value)}
              placeholder="Kort beskrivning av vad promoten gör"
              className="w-full rounded-xl border border-zinc-700 bg-zinc-800 px-4 py-3 text-base text-white placeholder-zinc-600 focus:border-cyan-500 focus:outline-none"
            />
          </div>

          {/* Kategori + Agent-typ */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-zinc-300">Kategori</label>
              <select
                value={form.category}
                onChange={(e) => set("category", e.target.value)}
                className="w-full rounded-xl border border-zinc-700 bg-zinc-800 px-4 py-3 text-base text-white focus:border-cyan-500 focus:outline-none"
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>{CATEGORY_LABELS[c]}</option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-semibold text-zinc-300">Agent-typ</label>
              <select
                value={form.agentType}
                onChange={(e) => set("agentType", e.target.value)}
                className="w-full rounded-xl border border-zinc-700 bg-zinc-800 px-4 py-3 text-base text-white focus:border-cyan-500 focus:outline-none"
              >
                {AGENT_TYPES.map((a) => (
                  <option key={a} value={a}>{AGENT_LABELS[a]}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Prompt-text — stor textarea */}
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-zinc-300">
              Prompt-text <span className="text-red-400">*</span>
            </label>
            <textarea
              value={form.promptText ?? ""}
              onChange={(e) => set("promptText", e.target.value)}
              placeholder="Skriv din prompt här. Använd [PLATSHÅLLARE] för variabler..."
              rows={8}
              className="w-full rounded-xl border border-zinc-700 bg-zinc-800 px-4 py-3 text-sm text-white placeholder-zinc-600 focus:border-cyan-500 focus:outline-none resize-none font-mono leading-relaxed"
            />
            <p className="text-xs text-zinc-600">
              Tips: Använd [HAKPARENTES] för variabler som användaren ska fylla i
            </p>
          </div>

          {/* Taggar */}
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-zinc-300">
              Taggar <span className="text-zinc-600 font-normal">(komma-separerade)</span>
            </label>
            <input
              type="text"
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
              placeholder="t.ex. viral, strategi, youtube"
              className="w-full rounded-xl border border-zinc-700 bg-zinc-800 px-4 py-3 text-base text-white placeholder-zinc-600 focus:border-cyan-500 focus:outline-none"
            />
          </div>

          {/* Felmeddelande */}
          {error && (
            <p className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
              ⚠️ {error}
            </p>
          )}
        </div>

        {/* Footer med knappar */}
        <div className="flex justify-end gap-3 border-t border-zinc-800 px-6 py-4 shrink-0">
          <button
            onClick={onClose}
            className="rounded-xl border border-zinc-700 bg-zinc-800 px-5 py-3 text-sm font-bold text-zinc-300 hover:bg-zinc-700 transition"
          >
            Avbryt
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 rounded-xl bg-green-600 px-6 py-3 text-sm font-bold text-white hover:bg-green-500 disabled:opacity-50 transition"
          >
            <Save size={16} />
            {saving ? "Sparar..." : "Spara prompt"}
          </button>
        </div>

      </div>
    </div>
  );
}
