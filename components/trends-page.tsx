"use client";

import { useState, useEffect } from "react";
import {
  TrendingUp,
  Loader2,
  AlertCircle,
  ArrowRight,
  DollarSign,
  Zap,
  RefreshCw,
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

  // ── Niche + Ollama state ──────────────────────────────────────────────
  const [niche, setNiche]       = useState("");
  const [trends, setTrends]     = useState<Trend[]>([]);
  const [selected, setSelected] = useState<Trend | null>(null);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState<string | null>(null);

  // ── Google Trends state ───────────────────────────────────────────────
  const [realTrends, setRealTrends]               = useState<string[]>([]);
  const [realTrendsLoading, setRealTrendsLoading] = useState(true);
  const [isFallback, setIsFallback]               = useState(false);

  // Pre-fill niche from Brainstorm, then fetch real trends
  useEffect(() => {
    const saved = localStorage.getItem("fd_selected_niche");
    if (saved) setNiche(saved);
    fetchRealTrends();
  }, []);

  async function fetchRealTrends() {
    setRealTrendsLoading(true);
    try {
      const res  = await fetch("/api/real-trends");
      const data = await res.json() as { topics?: string[]; isFallback?: boolean };
      setRealTrends(data.topics ?? []);
      setIsFallback(data.isFallback ?? false);
    } catch {
      // Network error hitting our own API — show fallback silently
      setRealTrends([
        "AI Tools 2026", "Passive Income Ideas", "ChatGPT Alternatives",
        "Make Money Online", "Home Automation", "Electric Vehicles",
        "Mental Health Tips", "Crypto 2026", "Remote Work Tools", "Side Hustle Ideas",
      ]);
      setIsFallback(true);
    } finally {
      setRealTrendsLoading(false);
    }
  }

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
            `It is 2026. Give me 5 trending YouTube video ideas for a faceless channel in the niche: ${niche}. ` +
            "Make the ideas highly relevant to what is trending RIGHT NOW in 2026: consider recent AI breakthroughs, " +
            "current geopolitical events, new tech product launches, viral health and wellness topics, " +
            "and major financial market shifts. Each idea should feel fresh and timely, not generic. " +
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

      {/* ── Google Trends section ──────────────────────────────────────── */}
      <div className="mb-7 rounded-xl border border-zinc-800 bg-zinc-900 p-5">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-white">
            {isFallback ? "⭐ Populära ämnen" : "🔥 Riktiga trender just nu"}
          </h2>
          <button
            onClick={fetchRealTrends}
            disabled={realTrendsLoading}
            className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-[11px] font-medium text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800 transition-colors disabled:opacity-40"
            title="Refresh"
          >
            <RefreshCw size={11} className={realTrendsLoading ? "animate-spin" : ""} />
            Uppdatera
          </button>
        </div>

        {realTrendsLoading && (
          <div className="flex items-center gap-2 text-xs text-zinc-500">
            <Loader2 size={12} className="animate-spin" />
            Hämtar trender…
          </div>
        )}

        {!realTrendsLoading && realTrends.length > 0 && (
          <>
            <p className="text-[11px] text-zinc-600 mb-2.5">
              Klicka för att fylla i nisch-fältet
            </p>
            <div className="flex flex-wrap gap-1.5">
              {realTrends.map((topic) => (
                <button
                  key={topic}
                  onClick={() => setNiche(topic)}
                  className={cn(
                    "rounded-full px-3 py-1 text-[11px] font-medium transition-all",
                    isFallback
                      ? niche === topic
                        ? "bg-orange-500 text-white ring-2 ring-orange-400/40"
                        : "bg-orange-500/10 text-orange-300 ring-1 ring-orange-500/20 hover:bg-orange-500/20 hover:text-orange-200"
                      : niche === topic
                        ? "bg-emerald-600 text-white ring-2 ring-emerald-500/40"
                        : "bg-emerald-500/10 text-emerald-300 ring-1 ring-emerald-500/20 hover:bg-emerald-500/20 hover:text-emerald-200"
                  )}
                >
                  {topic}
                </button>
              ))}
            </div>
          </>
        )}
      </div>

      {/* ── Page header ───────────────────────────────────────────────── */}
      <div className="mb-6 flex items-center gap-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-500/10">
          <TrendingUp size={16} className="text-indigo-400" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-white">Trend Agent</h1>
          <p className="text-xs text-zinc-500">
            Discover viral video ideas for your niche — powered by llama3.1
          </p>
        </div>
      </div>

      {/* ── Niche input row ───────────────────────────────────────────── */}
      <div className="flex gap-2 mb-6">
        <input
          type="text"
          value={niche}
          onChange={(e) => setNiche(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && findTrends()}
          placeholder="Enter niche (e.g. AI tools, personal finance…)"
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

      {/* ── Ollama error ──────────────────────────────────────────────── */}
      {error && (
        <div className="mb-5 flex items-start gap-2 rounded-lg border border-red-500/30 bg-red-500/10 p-3">
          <AlertCircle size={14} className="text-red-400 mt-0.5 shrink-0" />
          <p className="text-xs text-red-300">{error}</p>
        </div>
      )}

      {/* ── Ollama loading ────────────────────────────────────────────── */}
      {loading && (
        <div className="flex items-center gap-2 text-sm text-zinc-500">
          <Loader2 size={13} className="animate-spin" />
          Asking llama3.1 for 2026 trending ideas…
        </div>
      )}

      {/* ── Trend results ─────────────────────────────────────────────── */}
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
