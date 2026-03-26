"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Search,
  Loader2,
  CheckCircle2,
  XCircle,
  Clock,
  ChevronDown,
  ChevronUp,
  Copy,
  Check,
  Zap,
  TrendingUp,
  RotateCcw,
  Package,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  searchProducts,
  type Product,
} from "@/templates/dropshipping/product-hunter";

// ── Ollama helper ─────────────────────────────────────────────────────────────
const OLLAMA = "http://localhost:11434/api/generate";

async function ollamaGenerate(
  model:    string,
  prompt:   string,
  onToken?: (partial: string) => void,
): Promise<string> {
  const stream = !!onToken;
  const res = await fetch(OLLAMA, {
    method:  "POST",
    headers: { "Content-Type": "application/json" },
    body:    JSON.stringify({ model, prompt, stream }),
  });
  if (!res.ok) throw new Error(`Ollama ${res.status} — är servern igång?`);

  if (!stream) {
    const data = (await res.json()) as { response: string };
    return data.response.trim();
  }

  const reader  = res.body!.getReader();
  const decoder = new TextDecoder();
  let   full    = "";
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    for (const line of decoder.decode(value, { stream: true }).split("\n")) {
      if (!line.trim()) continue;
      try {
        const obj = JSON.parse(line) as { response?: string; done?: boolean };
        if (obj.response) { full += obj.response; onToken(full); }
        if (obj.done)     break;
      } catch { /* partial JSON */ }
    }
  }
  return full.trim();
}

// ── Types ─────────────────────────────────────────────────────────────────────
type StepStatus = "waiting" | "running" | "done" | "error";

interface PipelineStep {
  id:      string;
  emoji:   string;
  label:   string;
  status:  StepStatus;
  content: string;
}

function initSteps(): PipelineStep[] {
  return [
    { id: "analysis", emoji: "🔍", label: "Marknadsanalys", status: "waiting", content: "" },
    { id: "listing",  emoji: "📝", label: "Produktlisting",  status: "waiting", content: "" },
    { id: "price",    emoji: "💰", label: "Prisstrategi",    status: "waiting", content: "" },
    { id: "adcopy",   emoji: "📣", label: "Annonskopia",     status: "waiting", content: "" },
  ];
}

// ── Pris-kalkyl från mock-data ────────────────────────────────────────────────
function calcPrice(p: Product) {
  const sell = parseInt(p.suggestedPrice.replace(/[^0-9]/g, ""), 10) || 200;
  const parts = p.estimatedMargin.replace(/ %|%/g, "").split("–").map(Number);
  const marginMid = ((parts[0] + parts[1]) / 2) / 100;
  const buy         = Math.round(sell * (1 - marginMid));
  const platformFee = Math.round(sell * 0.3);
  const adSpend     = Math.round(sell * 0.15);
  const netProfit   = sell - buy - platformFee - adSpend;
  const netMargin   = Math.round((netProfit / sell) * 100);
  return { sell, buy, platformFee, adSpend, netProfit, netMargin };
}

// ── Status-ikon ───────────────────────────────────────────────────────────────
function StepIcon({ status }: { status: StepStatus }) {
  if (status === "running") return <Loader2 size={14} className="animate-spin text-sky-400" />;
  if (status === "done")    return <CheckCircle2 size={14} className="text-emerald-400" />;
  if (status === "error")   return <XCircle size={14} className="text-red-400" />;
  return <Clock size={14} className="text-zinc-600" />;
}

// ── Konkurrens-färg ───────────────────────────────────────────────────────────
const compColor: Record<Product["competitionLevel"], string> = {
  Låg:   "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
  Medel: "text-amber-400 bg-amber-500/10 border-amber-500/20",
  Hög:   "text-red-400 bg-red-500/10 border-red-500/20",
};

function trendBar(score: number) {
  if (score >= 85) return "bg-emerald-500";
  if (score >= 70) return "bg-amber-500";
  return "bg-zinc-500";
}

// ── Huvud-komponent ───────────────────────────────────────────────────────────
export default function DropshippingPage() {
  const [query,    setQuery]    = useState("");
  const [results,  setResults]  = useState<Product[]>([]);
  const [selected, setSelected] = useState<Product | null>(null);
  const [steps,    setSteps]    = useState<PipelineStep[]>(initSteps());
  const [running,  setRunning]  = useState(false);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [copied,   setCopied]   = useState<string | null>(null);

  // Visa alla produkter vid sidladdning
  useEffect(() => { setResults(searchProducts("")); }, []);

  // Sök i mock-data
  function handleSearch() {
    setResults(searchProducts(query));
    setSelected(null);
    setSteps(initSteps());
    setExpanded({});
  }

  // Välj produkt → återställ pipeline
  function selectProduct(p: Product) {
    setSelected(p);
    setSteps(initSteps());
    setExpanded({});
  }

  // Uppdatera ett steg
  const setStep = useCallback(
    (id: string, updates: Partial<Pick<PipelineStep, "status" | "content">>) => {
      setSteps((prev) => prev.map((s) => (s.id === id ? { ...s, ...updates } : s)));
    },
    []
  );

  // Expandera/kollapsa steg-kort
  function toggle(id: string) {
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));
  }

  // Kopiera text
  async function copyText(id: string, text: string) {
    await navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  }

  // ── Kör hela pipeline ──────────────────────────────────────────────────────
  const runPipeline = useCallback(async () => {
    if (!selected) return;
    setRunning(true);
    setSteps(initSteps());
    // Expandera alla steg direkt
    setExpanded({ analysis: true, listing: true, price: true, adcopy: true });

    try {
      // 1. Marknadsanalys
      setStep("analysis", { status: "running" });
      const analysis = await ollamaGenerate(
        "llama3.1",
        `Du är en erfaren dropshipping-expert. Det är 2026. Analysera produkten: "${selected.name}".
Svara på svenska med dessa fyra punkter:
1. Målgrupp — vem köper detta? (1–2 meningar)
2. Bästa säljplattform — Shopify, Amazon, Etsy, Blocket? Varför?
3. Bästa säsong — när toppar efterfrågan?
4. Konkurrenssituation — hur trångt är det? Vad är din edge?
Var konkret. Max 200 ord totalt.`,
        (p) => setStep("analysis", { content: p }),
      );
      setStep("analysis", { status: "done", content: analysis });

      // 2. Produktlisting
      setStep("listing", { status: "running" });
      const listing = await ollamaGenerate(
        "llama3.1",
        `Du är en e-handelskopierare. Skriv en konverteringsoptimerad produktlisting på svenska för:
Produkt: "${selected.name}"
Kategori: ${selected.category}

Exakt format — håll dig till det:
TITEL: [max 80 tecken, SEO-nyckelord inkluderade]

BESKRIVNING:
[3 säljande meningar som svarar på "varför ska jag köpa detta?"]

FÖRDELAR:
• [fördel 1 — konkret och specifik]
• [fördel 2]
• [fördel 3]
• [fördel 4]
• [fördel 5]`,
        (p) => setStep("listing", { content: p }),
      );
      setStep("listing", { status: "done", content: listing });

      // 3. Prisstrategi — beräknad lokalt, ingen Ollama-latens
      const pc = calcPrice(selected);
      const priceText =
        `PRISSTRATEGI — ${selected.name}\n` +
        `${"─".repeat(40)}\n` +
        `Inköpspris (est.):     ${pc.buy} kr\n` +
        `Plattformsavgift 30 %: ${pc.platformFee} kr\n` +
        `Annonsbudget 15 %:     ${pc.adSpend} kr\n` +
        `${"─".repeat(40)}\n` +
        `Försäljningspris:      ${pc.sell} kr\n` +
        `Nettovinst:            ${pc.netProfit} kr  (${pc.netMargin} %)\n\n` +
        `Baserat på ${selected.estimatedMargin} bruttomarginal.\n` +
        `Tips: Nå 25 %+ netto → sänk inköp eller höj pris till ${Math.round(pc.sell * 1.15)} kr.`;
      setStep("price", { status: "running", content: priceText });
      await new Promise((r) => setTimeout(r, 300));
      setStep("price", { status: "done", content: priceText });

      // 4. Annonskopia
      setStep("adcopy", { status: "running" });
      const adcopy = await ollamaGenerate(
        "llama3.1",
        `Du är expert på Facebook- och TikTok-annonsering för den svenska marknaden.
Produkt: "${selected.name}"  |  Pris: ${selected.suggestedPrice}

Skriv exakt dessa tre varianter:

FACEBOOK 1 (problem→lösning, max 150 tecken, emoji):

FACEBOOK 2 (social proof-vinkel, max 150 tecken, emoji):

TIKTOK HOOK (viral krok, max 60 tecken, börja med "POV:" eller en fråga):`,
        (p) => setStep("adcopy", { content: p }),
      );
      setStep("adcopy", { status: "done", content: adcopy });

    } catch (err) {
      // Markera körande steg som fel
      const msg = err instanceof Error ? err.message : "Okänt fel";
      setSteps((prev) =>
        prev.map((s) => s.status === "running" ? { ...s, status: "error", content: msg } : s)
      );
    } finally {
      setRunning(false);
    }
  }, [selected, setStep]);

  const doneCount = steps.filter((s) => s.status === "done").length;
  const progress  = Math.round((doneCount / steps.length) * 100);

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <main className="p-6 lg:p-8 pt-14 lg:pt-8">

      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-2.5 mb-1">
          <Package size={18} className="text-cyan-400" />
          <h1 className="text-2xl font-bold text-white">Dropshipping Studio</h1>
        </div>
        <p className="text-sm text-zinc-500">
          Produkt → Marknadsanalys → Listing → Prisstrategi → Annonskopia
        </p>
      </div>

      {/* Two-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-5">

        {/* ── VÄNSTER: Product Hunter ─────────────────────────────────── */}
        <div className="space-y-3">
          <h2 className="text-xs font-semibold text-zinc-500 uppercase tracking-widest">
            Product Hunter
          </h2>

          {/* Sökfält */}
          <div className="flex gap-2">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              placeholder="bambu, katt, fitness…"
              className="flex-1 rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-cyan-500/50"
            />
            <button
              onClick={handleSearch}
              className="rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-700 transition-colors"
            >
              <Search size={15} />
            </button>
          </div>

          {/* Produktlista */}
          <div className="rounded-xl border border-zinc-800 bg-zinc-900 overflow-hidden">
            {results.length === 0 ? (
              <p className="p-4 text-xs text-zinc-600 text-center">Inga produkter — sök något.</p>
            ) : (
              <div className="divide-y divide-zinc-800 max-h-[560px] overflow-y-auto">
                {results.map((p) => (
                  <button
                    key={p.name}
                    onClick={() => selectProduct(p)}
                    className={cn(
                      "w-full text-left px-4 py-3 transition-colors",
                      selected?.name === p.name
                        ? "bg-cyan-500/10 border-l-2 border-cyan-500"
                        : "hover:bg-zinc-800 border-l-2 border-transparent"
                    )}
                  >
                    {/* Namn + kategori */}
                    <p className="text-xs font-semibold text-zinc-100 leading-snug mb-1.5">
                      {p.name}
                    </p>

                    {/* Trend-bar */}
                    <div className="flex items-center gap-2 mb-1.5">
                      <div className="flex-1 h-1 rounded-full bg-zinc-800">
                        <div
                          className={cn("h-1 rounded-full", trendBar(p.trendScore))}
                          style={{ width: `${p.trendScore}%` }}
                        />
                      </div>
                      <span className="text-[10px] font-bold text-zinc-400 w-7 text-right">
                        {p.trendScore}
                      </span>
                    </div>

                    {/* Badges */}
                    <div className="flex flex-wrap gap-1">
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-violet-500/10 text-violet-400 border border-violet-500/20">
                        {p.estimatedMargin}
                      </span>
                      <span className={cn("text-[10px] px-1.5 py-0.5 rounded border", compColor[p.competitionLevel])}>
                        {p.competitionLevel}
                      </span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-500 border border-zinc-700">
                        {p.suggestedPrice}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ── HÖGER: Pipeline ─────────────────────────────────────────── */}
        <div className="space-y-3">
          <h2 className="text-xs font-semibold text-zinc-500 uppercase tracking-widest">
            Pipeline
          </h2>

          {!selected ? (
            /* Empty state */
            <div className="rounded-xl border border-zinc-800 bg-zinc-900 flex flex-col items-center justify-center min-h-[400px] gap-3 text-center p-8">
              <TrendingUp size={28} className="text-zinc-700" />
              <p className="text-sm text-zinc-500 font-medium">Välj en produkt till vänster</p>
              <p className="text-xs text-zinc-600 max-w-xs">
                Klicka på en produkt för att köra AI-pipeline: marknadsanalys, listing, prisstrategi och annonskopia.
              </p>
            </div>
          ) : (
            <div className="space-y-3">

              {/* Vald produkt-kort */}
              <div className="rounded-xl border border-cyan-500/20 bg-cyan-500/5 p-4">
                <p className="text-[10px] text-cyan-500 font-semibold uppercase tracking-widest mb-1">
                  Vald produkt
                </p>
                <p className="text-sm font-bold text-white mb-2">{selected.name}</p>
                <div className="flex flex-wrap gap-2 text-[11px]">
                  <span className="text-zinc-400">{selected.category}</span>
                  <span className="text-zinc-600">·</span>
                  <span className="text-violet-400">{selected.estimatedMargin} marginal</span>
                  <span className="text-zinc-600">·</span>
                  <span className="text-zinc-400">{selected.suggestedPrice}</span>
                  <span className="text-zinc-600">·</span>
                  <span className={cn(
                    "font-medium",
                    selected.competitionLevel === "Låg" ? "text-emerald-400" :
                    selected.competitionLevel === "Medel" ? "text-amber-400" : "text-red-400"
                  )}>
                    {selected.competitionLevel} konkurrens
                  </span>
                </div>
              </div>

              {/* Kör-knapp */}
              <button
                onClick={runPipeline}
                disabled={running}
                className={cn(
                  "w-full flex items-center justify-between rounded-xl border px-5 py-3.5 transition-all",
                  running
                    ? "border-sky-500/30 bg-sky-500/10 cursor-not-allowed"
                    : "border-cyan-500/30 bg-gradient-to-r from-cyan-500/10 to-sky-500/10 hover:from-cyan-500/20 hover:to-sky-500/20 cursor-pointer"
                )}
              >
                <div className="flex items-center gap-3">
                  <span className="text-xl">{running ? "⚡" : "🚀"}</span>
                  <div className="text-left">
                    <p className="text-sm font-bold text-white">Kör hela dropshipping-flödet</p>
                    <p className="text-xs text-zinc-400">Analys → Listing → Pris → Annons</p>
                  </div>
                </div>
                {running ? (
                  <div className="flex items-center gap-2">
                    <Loader2 size={14} className="animate-spin text-sky-400" />
                    <span className="text-xs text-sky-400 font-medium">{progress}%</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5 rounded-lg border border-cyan-500/30 bg-cyan-500/20 px-3 py-1.5">
                    <Zap size={12} className="text-cyan-400" />
                    <span className="text-xs font-semibold text-cyan-300">Auto Run</span>
                  </div>
                )}
              </button>

              {/* Progress-bar */}
              {(running || doneCount > 0) && (
                <div className="h-1 rounded-full bg-zinc-800">
                  <div
                    className="h-1 rounded-full bg-gradient-to-r from-cyan-500 to-sky-500 transition-all duration-500"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              )}

              {/* Pipeline-steg */}
              {steps.map((step) => (
                <div
                  key={step.id}
                  className={cn(
                    "rounded-xl border overflow-hidden transition-colors",
                    step.status === "done"    ? "border-zinc-700 bg-zinc-900"
                    : step.status === "running" ? "border-sky-500/30 bg-sky-500/5"
                    : step.status === "error"   ? "border-red-500/30 bg-red-500/5"
                    : "border-zinc-800 bg-zinc-900/50"
                  )}
                >
                  {/* Steg-header */}
                  <button
                    className="w-full flex items-center gap-3 px-4 py-3 text-left"
                    onClick={() => step.content && toggle(step.id)}
                  >
                    <span className="text-base w-5 text-center select-none">{step.emoji}</span>
                    <p className={cn(
                      "flex-1 text-sm font-medium",
                      step.status === "waiting"  ? "text-zinc-600"
                      : step.status === "running" ? "text-zinc-200"
                      : step.status === "done"    ? "text-zinc-200"
                      : "text-red-400"
                    )}>
                      {step.label}
                    </p>

                    {/* Live-ord-räknare under generering */}
                    {step.status === "running" && step.content && (
                      <span className="text-xs text-sky-400 font-mono">
                        {step.content.split(/\s+/).filter(Boolean).length} ord…
                      </span>
                    )}

                    <StepIcon status={step.status} />

                    {/* Expandera-pil när klar */}
                    {step.status === "done" && step.content && (
                      expanded[step.id]
                        ? <ChevronUp size={13} className="text-zinc-600" />
                        : <ChevronDown size={13} className="text-zinc-600" />
                    )}
                  </button>

                  {/* Genererat innehåll */}
                  {step.content && (step.status === "running" || expanded[step.id]) && (
                    <div className="border-t border-zinc-800 px-4 pt-3 pb-4">
                      <div className="flex justify-end mb-2">
                        {step.status === "done" && (
                          <button
                            onClick={() => copyText(step.id, step.content)}
                            className="inline-flex items-center gap-1 text-[11px] text-zinc-500 hover:text-zinc-300 transition-colors"
                          >
                            {copied === step.id
                              ? <><Check size={11} className="text-emerald-400" /> Kopierat!</>
                              : <><Copy size={11} /> Kopiera</>
                            }
                          </button>
                        )}
                      </div>
                      <pre className="font-mono text-xs text-zinc-300 leading-relaxed whitespace-pre-wrap break-words max-h-[300px] overflow-y-auto">
                        {step.content}
                      </pre>
                    </div>
                  )}
                </div>
              ))}

              {/* Kör-igen-länk */}
              {doneCount === steps.length && (
                <button
                  onClick={runPipeline}
                  className="inline-flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
                >
                  <RotateCcw size={11} /> Kör om med samma produkt
                </button>
              )}

            </div>
          )}
        </div>

      </div>
    </main>
  );
}
