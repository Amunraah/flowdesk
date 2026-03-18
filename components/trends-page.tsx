"use client";

import { useState, useEffect } from "react";
import {
  TrendingUp,
  Loader2,
  AlertCircle,
  ArrowRight,
  DollarSign,
  Zap,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

interface Trend {
  title: string;
  hook: string;
  cpm_estimate: string;
}

function addActivity(type: string, description: string) {
  try {
    const prev = JSON.parse(localStorage.getItem("fd_activity") || "[]");
    prev.unshift({ id: String(Date.now()), type, description, timestamp: Date.now() });
    localStorage.setItem("fd_activity", JSON.stringify(prev.slice(0, 20)));
  } catch {}
}

export default function TrendsPage() {
  const router = useRouter();
  const [niche, setNiche]       = useState("");
  const [trends, setTrends]     = useState<Trend[]>([]);
  const [selected, setSelected] = useState<Trend | null>(null);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState<string | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem("fd_selected_niche");
    if (saved) setNiche(saved);
  }, []);

  async function findTrends() {
    if (!niche.trim()) return;
    setError(null);
    setTrends([]);
    setSelected(null);
    setLoading(true);

    try {
      const res = await fetch("http://localhost:11434/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "llama3.1",
          prompt:
            `Give me 5 trending YouTube video ideas for a faceless channel in the niche: ${niche}. ` +
            "Return as JSON array with fields: title, hook, cpm_estimate. " +
            "Return ONLY the JSON array, no extra text or markdown.",
          stream: false,
        }),
      });

      if (!res.ok) throw new Error(`Ollama returned ${res.status}`);

      const data = await res.json() as { response?: string };
      const text = data.response ?? "";

      const match = text.match(/\[[\s\S]*\]/);
      if (!match) throw new Error("Could not find a JSON array in the response");

      const parsed: Trend[] = JSON.parse(match[0]);
      setTrends(parsed);

      const prev = parseInt(localStorage.getItem("fd_trends_count") ?? "0", 10);
      localStorage.setItem("fd_trends_count", String(prev + parsed.length));
      addActivity("trend", `Found ${parsed.length} trends for "${niche}"`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      setError(
        msg.toLowerCase().includes("fetch") || msg.includes("11434")
          ? "Cannot reach Ollama at localhost:11434. Make sure Ollama is running."
          : `Error: ${msg}`
      );
    } finally {
      setLoading(false);
    }
  }

  function useTrend() {
    if (!selected) return;
    localStorage.setItem("fd_selected_trend", JSON.stringify(selected));
    addActivity("trend", `Selected trend: "${selected.title}"`);
    router.push("/script");
  }

  return (
    <main className="p-6 lg:p-8 pt-14 lg:pt-8">
      {/* Header */}
      <div className="mb-6 flex items-center gap-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-500/10">
          <TrendingUp size={16} className="text-indigo-400" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-white">Trend Agent</h1>
          <p className="text-xs text-zinc-500">
            Discover viral video ideas for your niche
          </p>
        </div>
      </div>

      {/* Niche input row */}
      <div className="flex gap-2 mb-6">
        <input
          type="text"
          value={niche}
          onChange={(e) => setNiche(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && findTrends()}
          placeholder="Enter niche  (e.g. AI tools, personal finance…)"
          className="flex-1 rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2.5 text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-indigo-500 transition-colors"
        />
        <button
          onClick={findTrends}
          disabled={loading || !niche.trim()}
          className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <Loader2 size={14} className="animate-spin" />
          ) : (
            <TrendingUp size={14} />
          )}
          {loading ? "Söker…" : "Hitta trender"}
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="mb-5 flex items-start gap-2 rounded-lg border border-red-500/30 bg-red-500/10 p-3">
          <AlertCircle size={14} className="text-red-400 mt-0.5 shrink-0" />
          <p className="text-xs text-red-300">{error}</p>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="flex items-center gap-2 text-sm text-zinc-500">
          <Loader2 size={13} className="animate-spin" />
          Asking llama3.1 for trending ideas…
        </div>
      )}

      {/* Results */}
      {trends.length > 0 && (
        <>
          <p className="text-xs text-zinc-500 mb-3">
            Click a trend to select it, then send it to the Script agent →
          </p>
          <div className="space-y-2 mb-5">
            {trends.map((t, i) => (
              <button
                key={i}
                onClick={() =>
                  setSelected((prev) =>
                    prev?.title === t.title ? null : t
                  )
                }
                className={cn(
                  "w-full text-left rounded-xl border p-4 transition-all",
                  selected?.title === t.title
                    ? "border-indigo-500/50 bg-indigo-500/10"
                    : "border-zinc-800 bg-zinc-900 hover:border-zinc-700 hover:bg-zinc-800/70"
                )}
              >
                <p className="text-sm font-semibold text-zinc-100 mb-1">
                  {t.title}
                </p>
                <p className="text-xs text-zinc-400 mb-2 leading-relaxed">
                  <span className="text-zinc-600">Hook: </span>
                  {t.hook}
                </p>
                <div className="flex items-center gap-1 text-[11px] text-zinc-500">
                  <DollarSign size={10} className="text-indigo-400" />
                  CPM estimate: {t.cpm_estimate}
                </div>
              </button>
            ))}
          </div>

          <button
            onClick={useTrend}
            disabled={!selected}
            className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-500 disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <Zap size={14} />
            Använd denna trend
            <ArrowRight size={14} />
          </button>
        </>
      )}
    </main>
  );
}
