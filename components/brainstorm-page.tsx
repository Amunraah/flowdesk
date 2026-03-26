"use client";

import { useState } from "react";
import { Lightbulb, Loader2, AlertCircle, DollarSign, ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

interface Niche {
  niche: string;
  reason: string;
  cpm: string;
  difficulty: "Easy" | "Medium" | "Hard";
}

const CATEGORIES = [
  "Gaming",
  "Finance",
  "Health & Wellness",
  "AI & Tech",
  "Education",
  "Productivity",
  "True Crime",
  "Travel",
  "Food",
  "Relationships",
] as const;

const difficultyStyles: Record<Niche["difficulty"], string> = {
  Easy:   "bg-emerald-500/20 text-emerald-300 ring-1 ring-emerald-500/30",
  Medium: "bg-yellow-500/20  text-yellow-300  ring-1 ring-yellow-500/30",
  Hard:   "bg-red-500/20     text-red-300     ring-1 ring-red-500/30",
};

function addActivity(type: string, description: string) {
  try {
    const prev = JSON.parse(localStorage.getItem("fd_activity") || "[]");
    prev.unshift({ id: String(Date.now()), type, description, timestamp: Date.now() });
    localStorage.setItem("fd_activity", JSON.stringify(prev.slice(0, 20)));
  } catch {}
}

export default function BrainstormPage() {
  const router = useRouter();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [niches, setNiches]   = useState<Niche[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState<string | null>(null);

  async function generateNiches() {
    if (!selectedCategory) {
      setError("Välj en kategori först");
      return;
    }
    setError(null);
    setNiches([]);
    setLoading(true);

    try {
      const res = await fetch("http://localhost:11434/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "llama3.1",
          prompt:
            `Give me 5 profitable YouTube niche ideas for faceless channels in 2026 within the category: ${selectedCategory}. ` +
            "Return as JSON array with fields: niche, reason, cpm, difficulty (Easy/Medium/Hard). " +
            "Return ONLY the JSON array, no extra text or markdown.",
          stream: false,
        }),
      });

      if (!res.ok) throw new Error(`Ollama returned ${res.status}`);

      const data = await res.json() as { response?: string };
      const text = data.response ?? "";

      const match = text.match(/\[[\s\S]*\]/);
      if (!match) throw new Error("Could not find a JSON array in the response");

      const parsed: Niche[] = JSON.parse(match[0]);
      setNiches(parsed);
      addActivity("brainstorm", `Generated ${parsed.length} niche ideas in ${selectedCategory}`);
      localStorage.setItem("fd_niches", JSON.stringify(parsed));
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      setError(
        msg.toLowerCase().includes("fetch") || msg.includes("11434")
          ? "Cannot reach Ollama at localhost:11434. Make sure Ollama is running with llama3.1 loaded."
          : `Error: ${msg}`
      );
    } finally {
      setLoading(false);
    }
  }

  function selectNiche(niche: Niche) {
    localStorage.setItem("fd_selected_niche", niche.niche);
    addActivity("brainstorm", `Selected niche: "${niche.niche}"`);
    router.push("/trends");
  }

  return (
    <main className="p-6 lg:p-8 pt-14 lg:pt-8">
      {/* Header */}
      <div className="mb-6 flex items-center gap-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10">
          <Lightbulb size={16} className="text-emerald-400" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-white">Brainstorm Agent</h1>
          <p className="text-xs text-zinc-500">
            Find profitable YouTube niches powered by llama3.1
          </p>
        </div>
      </div>

      {/* Category pills */}
      <div className="mb-6">
        <p className="text-xs font-semibold text-zinc-500 uppercase tracking-widest mb-3">
          Välj kategori
        </p>
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() =>
                setSelectedCategory((prev) => (prev === cat ? null : cat))
              }
              className={cn(
                "rounded-full px-3 py-1.5 text-xs font-medium transition-all",
                selectedCategory === cat
                  ? "bg-indigo-600 text-white ring-2 ring-indigo-500/50"
                  : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-zinc-100"
              )}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Action button */}
      <button
        onClick={generateNiches}
        disabled={loading}
        className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed mb-6"
      >
        {loading ? (
          <Loader2 size={14} className="animate-spin" />
        ) : (
          <Lightbulb size={14} />
        )}
        {loading ? "Genererar..." : "Generera nischer"}
      </button>

      {/* Error */}
      {error && (
        <div className="mb-5 flex items-start gap-2 rounded-lg border border-red-500/30 bg-red-500/10 p-3">
          <AlertCircle size={14} className="text-red-400 mt-0.5 shrink-0" />
          <p className="text-xs text-red-300">{error}</p>
        </div>
      )}

      {/* Loading placeholder */}
      {loading && niches.length === 0 && (
        <div className="flex items-center gap-2 text-sm text-zinc-500">
          <Loader2 size={13} className="animate-spin" />
          Asking llama3.1 for niche ideas…
        </div>
      )}

      {/* Results */}
      {niches.length > 0 && (
        <div className="space-y-3">
          <p className="text-xs text-zinc-500 mb-1">
            Click a niche to send it to the Trends agent →
          </p>
          {niches.map((n, i) => (
            <button
              key={i}
              onClick={() => selectNiche(n)}
              className="w-full text-left rounded-xl border border-zinc-800 bg-zinc-900 p-4 transition hover:border-emerald-500/40 hover:bg-zinc-800/70 group"
            >
              <div className="flex items-start justify-between gap-3 mb-1.5">
                <h3 className="text-sm font-semibold text-zinc-100 group-hover:text-white">
                  {n.niche}
                </h3>
                <span
                  className={cn(
                    "shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold",
                    difficultyStyles[n.difficulty] ?? difficultyStyles.Medium
                  )}
                >
                  {n.difficulty}
                </span>
              </div>
              <p className="text-xs text-zinc-400 mb-2 leading-relaxed">{n.reason}</p>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1 text-[11px] text-zinc-500">
                  <DollarSign size={10} className="text-emerald-500" />
                  CPM: {n.cpm}
                </div>
                <ArrowRight
                  size={13}
                  className="text-zinc-700 group-hover:text-emerald-400 transition-colors"
                />
              </div>
            </button>
          ))}
        </div>
      )}
    </main>
  );
}
