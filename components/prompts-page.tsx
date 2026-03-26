"use client";

// Prompt Library — huvudsida (/prompts)
// Grid med sökning, kategorifilter, skapa/redigera/ta bort

import { useCallback, useEffect, useState } from "react";
import { Plus, Search, BookOpen, Keyboard } from "lucide-react";
import type { Prompt, PromptCategory } from "@/types/prompt";
import { CATEGORY_LABELS } from "@/types/prompt";
import PromptCard from "@/components/prompts/PromptCard";
import PromptModal from "@/components/prompts/PromptModal";
import { cn } from "@/lib/utils";

// Alla kategorier + "Alla" som filter
const FILTER_CATEGORIES: Array<{ value: PromptCategory | "all"; label: string }> = [
  { value: "all",       label: "Alla" },
  { value: "youtube",   label: "YouTube" },
  { value: "business",  label: "Business" },
  { value: "creative",  label: "Creative" },
  { value: "coding",    label: "Coding" },
  { value: "marketing", label: "Marketing" },
];

export default function PromptsPage() {
  const [prompts, setPrompts]       = useState<Prompt[]>([]);
  const [loading, setLoading]       = useState(true);
  const [search, setSearch]         = useState("");
  const [category, setCategory]     = useState<PromptCategory | "all">("all");
  const [modal, setModal]           = useState<{ open: boolean; editing: Prompt | null }>({
    open: false, editing: null,
  });
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  // Hämta alla prompts
  const loadPrompts = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/prompts");
      const data = await res.json() as Prompt[];
      setPrompts(Array.isArray(data) ? data : []);
    } catch {
      setPrompts([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void loadPrompts(); }, [loadPrompts]);

  // Filtrera prompts på sökning + kategori
  const filtered = prompts.filter((p) => {
    const matchCat = category === "all" || p.category === category;
    const q = search.toLowerCase();
    const matchSearch =
      !q ||
      p.title.toLowerCase().includes(q) ||
      p.description.toLowerCase().includes(q) ||
      p.tags.some((t) => t.toLowerCase().includes(q));
    return matchCat && matchSearch;
  });

  // Spara ny eller uppdaterad prompt
  async function handleSave(data: Partial<Prompt>) {
    const method = modal.editing ? "PUT" : "POST";
    const body   = modal.editing ? { ...data, id: modal.editing.id } : data;

    const res = await fetch("/api/prompts", {
      method,
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify(body),
    });

    if (res.ok) {
      setModal({ open: false, editing: null });
      await loadPrompts();
    }
  }

  // Ta bort prompt (bekräftelse med dubbelklick)
  async function handleDelete(id: string) {
    if (deleteConfirm !== id) {
      // Första klick — be om bekräftelse
      setDeleteConfirm(id);
      setTimeout(() => setDeleteConfirm(null), 3000);
      return;
    }
    // Andra klick — ta bort
    await fetch(`/api/prompts?id=${id}`, { method: "DELETE" });
    setDeleteConfirm(null);
    await loadPrompts();
  }

  return (
    <main className="p-6 lg:p-8 pt-14 lg:pt-8">

      {/* Header */}
      <div className="mb-8 flex items-start justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-600/15">
            <BookOpen size={20} className="text-cyan-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Prompt Library</h1>
            <p className="text-sm text-zinc-500 mt-0.5">
              {prompts.length} prompts sparade · Ctrl+K snabbsökning · Ctrl+E förbättra text
            </p>
          </div>
        </div>

        {/* Ny prompt-knapp — stor och cyan */}
        <button
          onClick={() => setModal({ open: true, editing: null })}
          className="flex items-center gap-2 rounded-xl bg-cyan-600 px-5 py-3 text-base font-bold text-white hover:bg-cyan-500 transition"
        >
          <Plus size={20} />
          Lägg till ny prompt
        </button>
      </div>

      {/* Tangentbordsgenvägar-info */}
      <div className="mb-6 flex items-center gap-6 rounded-xl border border-zinc-800 bg-zinc-900 px-5 py-3">
        <Keyboard size={16} className="text-zinc-600 shrink-0" />
        <div className="flex flex-wrap gap-5 text-xs text-zinc-600">
          <span><kbd className="rounded bg-zinc-800 px-1.5 py-0.5 text-zinc-400">Ctrl+K</kbd> Snabbsök</span>
          <span><kbd className="rounded bg-zinc-800 px-1.5 py-0.5 text-zinc-400">Ctrl+E</kbd> Förbättra text</span>
          <span><kbd className="rounded bg-zinc-800 px-1.5 py-0.5 text-zinc-400">Ctrl+S</kbd> Spara i modal</span>
        </div>
      </div>

      {/* Sök + Kategorifilter */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center">
        {/* Sökfält */}
        <div className="relative flex-1">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Sök bland prompts..."
            className="w-full rounded-xl border border-zinc-800 bg-zinc-900 py-3 pl-11 pr-4 text-base text-white placeholder-zinc-600 focus:border-cyan-500 focus:outline-none"
          />
        </div>

        {/* Kategoripillar */}
        <div className="flex flex-wrap gap-2">
          {FILTER_CATEGORIES.map(({ value, label }) => (
            <button
              key={value}
              onClick={() => setCategory(value)}
              className={cn(
                "rounded-xl px-4 py-2.5 text-sm font-semibold transition",
                category === value
                  ? "bg-cyan-600 text-white"
                  : "border border-zinc-800 bg-zinc-900 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200"
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Bekräftelse-banner för radering */}
      {deleteConfirm && (
        <div className="mb-4 rounded-xl border border-red-500/30 bg-red-500/10 px-5 py-3">
          <p className="text-sm text-red-300">
            ⚠️ Klicka på <strong>radera-knappen igen</strong> för att bekräfta borttagning
          </p>
        </div>
      )}

      {/* Grid med promptkort */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-64 rounded-2xl border border-zinc-800 bg-zinc-900 animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <BookOpen size={40} className="text-zinc-800" />
          <p className="text-lg font-semibold text-zinc-600">
            {search ? `Inga prompts hittades för "${search}"` : "Inga prompts i den här kategorin"}
          </p>
          <button
            onClick={() => setModal({ open: true, editing: null })}
            className="mt-2 rounded-xl bg-cyan-600 px-5 py-3 text-sm font-bold text-white hover:bg-cyan-500 transition"
          >
            + Skapa din första prompt
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {filtered.map((p) => (
            <PromptCard
              key={p.id}
              prompt={p}
              onEdit={(pr)  => setModal({ open: true, editing: pr })}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      {/* Antal resultat */}
      {!loading && filtered.length > 0 && (
        <p className="mt-6 text-center text-xs text-zinc-700">
          Visar {filtered.length} av {prompts.length} prompts
          {category !== "all" && ` i ${CATEGORY_LABELS[category as PromptCategory]}`}
        </p>
      )}

      {/* Skapa/redigera-modal */}
      {modal.open && (
        <PromptModal
          initial={modal.editing}
          onSave={handleSave}
          onClose={() => setModal({ open: false, editing: null })}
        />
      )}
    </main>
  );
}
