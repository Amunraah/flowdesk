"use client";

import { useState } from "react";
import { Search, Loader2, TrendingUp, Package } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  searchProducts,
  type Product,
} from "@/templates/dropshipping/product-hunter";

// Färg per konkurrens-nivå
const competitionColor: Record<Product["competitionLevel"], string> = {
  Låg:   "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
  Medel: "text-amber-400 bg-amber-500/10 border-amber-500/20",
  Hög:   "text-red-400 bg-red-500/10 border-red-500/20",
};

// Färg på trend-score-stapeln
function trendColor(score: number) {
  if (score >= 85) return "bg-emerald-500";
  if (score >= 70) return "bg-amber-500";
  return "bg-zinc-500";
}

export default function ProductHunterWidget() {
  const [query,    setQuery]    = useState("");
  const [results,  setResults]  = useState<Product[]>([]);
  const [loading,  setLoading]  = useState(false);
  const [searched, setSearched] = useState(false);

  /** Kör sökning — simulerar asynkron latens (byt mot fetch() sen) */
  async function handleSearch() {
    if (!query.trim()) return;
    setLoading(true);
    setSearched(false);

    // Simulera nätverkslatens (tas bort när riktig API används)
    await new Promise((r) => setTimeout(r, 600));

    setResults(searchProducts(query));
    setLoading(false);
    setSearched(true);
  }

  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900 overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 px-5 py-4 border-b border-zinc-800">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-cyan-500/10">
          <Package size={15} className="text-cyan-400" />
        </div>
        <div>
          <p className="text-sm font-semibold text-white">Product Hunter</p>
          <p className="text-xs text-zinc-500">Hitta vinnande dropshipping-produkter</p>
        </div>
        {/* Mock-badge — ta bort när riktig data används */}
        <span className="ml-auto text-[10px] font-medium px-2 py-0.5 rounded border border-zinc-700 text-zinc-500">
          mock-data
        </span>
      </div>

      {/* Sökfält */}
      <div className="p-4 flex gap-2">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          placeholder="t.ex. bambu köksredskap, katt, fitness…"
          className="flex-1 rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-cyan-500/50"
        />
        <button
          onClick={handleSearch}
          disabled={loading || !query.trim()}
          className="inline-flex items-center gap-1.5 rounded-lg bg-cyan-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-cyan-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading
            ? <Loader2 size={14} className="animate-spin" />
            : <Search size={14} />}
          Sök
        </button>
      </div>

      {/* Resultat-grid */}
      {searched && results.length > 0 && (
        <div className="px-4 pb-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
          {results.map((p) => (
            <div
              key={p.name}
              className="rounded-xl border border-zinc-800 bg-zinc-950 p-3 space-y-2"
            >
              {/* Produktnamn */}
              <p className="text-sm font-semibold text-zinc-100 leading-snug">
                {p.name}
              </p>

              {/* Trend-score stapel */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-zinc-500 flex items-center gap-1">
                    <TrendingUp size={10} /> Trend-score
                  </span>
                  <span className="font-bold text-zinc-200">{p.trendScore}/100</span>
                </div>
                <div className="h-1.5 rounded-full bg-zinc-800">
                  <div
                    className={cn("h-1.5 rounded-full transition-all", trendColor(p.trendScore))}
                    style={{ width: `${p.trendScore}%` }}
                  />
                </div>
              </div>

              {/* Detaljer-rad */}
              <div className="flex flex-wrap gap-1.5">
                {/* Marginal */}
                <span className="text-[10px] px-2 py-0.5 rounded border border-violet-500/20 bg-violet-500/10 text-violet-400">
                  {p.estimatedMargin}
                </span>
                {/* Pris */}
                <span className="text-[10px] px-2 py-0.5 rounded border border-zinc-700 bg-zinc-800 text-zinc-400">
                  {p.suggestedPrice}
                </span>
                {/* Konkurrens */}
                <span className={cn(
                  "text-[10px] px-2 py-0.5 rounded border",
                  competitionColor[p.competitionLevel]
                )}>
                  {p.competitionLevel} konkurrens
                </span>
              </div>

              {/* Sökvolym */}
              <p className="text-[10px] text-zinc-600">
                ~{p.monthlySearches} sök/mån · {p.category}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Tom state */}
      {searched && results.length === 0 && (
        <p className="px-4 pb-4 text-xs text-zinc-600">
          Inga produkter hittades — prova ett annat sökord.
        </p>
      )}
    </div>
  );
}
