"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import Link from "next/link";
import {
  FileText,
  TrendingUp,
  Mic,
  Lightbulb,
  Activity,
  Bot,
  FileAudio,
  Loader2,
  CheckCircle2,
  XCircle,
  Clock,
  Download,
  Zap,
  RotateCcw,
  Package,        // Dropshipping-ikon
  Youtube,        // YouTube-ikon
} from "lucide-react";
import ProductHunterWidget from "@/components/product-hunter-widget";
import { cn } from "@/lib/utils";

// ── existing types ────────────────────────────────────────────────────────────
interface ActivityItem {
  id: string;
  type: "script" | "trend" | "brainstorm" | "voice";
  description: string;
  timestamp: number;
}

const typeColors: Record<ActivityItem["type"], string> = {
  script:     "text-violet-400",
  trend:      "text-indigo-400",
  brainstorm: "text-emerald-400",
  voice:      "text-orange-400",
};

const typeIcons: Record<ActivityItem["type"], React.ElementType> = {
  script:     FileText,
  trend:      TrendingUp,
  brainstorm: Lightbulb,
  voice:      Mic,
};

// ── auto-run types ────────────────────────────────────────────────────────────
type StepStatus = "waiting" | "running" | "done" | "error";

interface AutoStep {
  id:     string;
  emoji:  string;
  label:  string;
  status: StepStatus;
  detail: string;
}

interface AutoResult {
  niche:          string;
  trend:          string;
  scriptPreview:  string;
  scriptFilename: string;
  audioFilename:  string | null;
  audioError:     string | null;
}

const STEP_DEFS: Omit<AutoStep, "status" | "detail">[] = [
  { id: "niche",  emoji: "🧠", label: "Pick a profitable niche"   },
  { id: "trend",  emoji: "📈", label: "Find the best trend"       },
  { id: "script", emoji: "✍️",  label: "Write the video script"    },
  { id: "save",   emoji: "💾", label: "Save script to disk"       },
  { id: "voice",  emoji: "🎙️", label: "Generate voice MP3"        },
];

function initSteps(): AutoStep[] {
  return STEP_DEFS.map((s) => ({ ...s, status: "waiting", detail: "" }));
}

function addActivity(type: ActivityItem["type"], description: string) {
  try {
    const prev = JSON.parse(localStorage.getItem("fd_activity") ?? "[]") as ActivityItem[];
    prev.unshift({ id: String(Date.now()), type, description, timestamp: Date.now() });
    localStorage.setItem("fd_activity", JSON.stringify(prev.slice(0, 20)));
  } catch { /* ignore */ }
}

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

  if (!res.ok) throw new Error(`Ollama error ${res.status} — is the server running?`);

  if (!stream) {
    const data = (await res.json()) as { response: string };
    return data.response.trim();
  }

  // Streaming — accumulate tokens
  const reader  = res.body!.getReader();
  const decoder = new TextDecoder();
  let   full    = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    const chunk = decoder.decode(value, { stream: true });
    for (const line of chunk.split("\n")) {
      if (!line.trim()) continue;
      try {
        const obj = JSON.parse(line) as { response?: string; done?: boolean };
        if (obj.response) { full += obj.response; onToken(full); }
        if (obj.done)    break;
      } catch { /* partial JSON */ }
    }
  }

  return full.trim();
}

// ── Step status icon ─────────────────────────────────────────────────────────
function StepIcon({ status }: { status: StepStatus }) {
  if (status === "running") return <Loader2 size={15} className="animate-spin text-sky-400" />;
  if (status === "done")    return <CheckCircle2 size={15} className="text-emerald-400" />;
  if (status === "error")   return <XCircle size={15} className="text-red-400" />;
  return <Clock size={15} className="text-zinc-600" />;
}

// ── Main component ────────────────────────────────────────────────────────────
export default function DashboardPage() {
  // ── template-val: "youtube" | "dropshipping" ──────────────────────────────
  type Template = "youtube" | "dropshipping";
  const [template, setTemplate] = useState<Template>("youtube");

  // Byt template och spara i localStorage
  function switchTemplate(t: Template) {
    setTemplate(t);
    localStorage.setItem("fd_template", t);
  }

  // existing state
  const [scriptCount, setScriptCount] = useState(0);
  const [audioCount,  setAudioCount]  = useState(0);
  const [trendsCount, setTrendsCount] = useState(0);
  const [activity,    setActivity]    = useState<ActivityItem[]>([]);

  // auto-run state
  const [autoSteps,        setAutoSteps]        = useState<AutoStep[]>(initSteps());
  const [autoRunning,      setAutoRunning]       = useState(false);
  const [autoResult,       setAutoResult]        = useState<AutoResult | null>(null);
  const [showAutoPanel,    setShowAutoPanel]     = useState(false);
  const [scriptWordCount,  setScriptWordCount]   = useState(0);
  const [fatalError,       setFatalError]        = useState<string | null>(null);

  const panelRef = useRef<HTMLDivElement>(null);

  // ── load stats + sparat template-val ────────────────────────────────────────
  useEffect(() => {
    const saved = localStorage.getItem("fd_template");
    if (saved === "dropshipping" || saved === "youtube") setTemplate(saved);

    fetch("/api/scripts")
      .then((r) => r.json())
      .then((d) => setScriptCount(Array.isArray(d) ? d.length : 0))
      .catch(() => {});

    fetch("/api/audio")
      .then((r) => r.json())
      .then((d) => setAudioCount(Array.isArray(d) ? d.length : 0))
      .catch(() => {});

    const tc   = localStorage.getItem("fd_trends_count");
    setTrendsCount(tc ? parseInt(tc, 10) : 0);

    const acts = localStorage.getItem("fd_activity");
    setActivity(acts ? (JSON.parse(acts) as ActivityItem[]) : []);
  }, []);

  // ── step helpers ─────────────────────────────────────────────────────────────
  const setStep = useCallback(
    (id: string, updates: Partial<Omit<AutoStep, "id" | "emoji" | "label">>) => {
      setAutoSteps((prev) =>
        prev.map((s) => (s.id === id ? { ...s, ...updates } : s))
      );
    },
    []
  );

  const doneCount = autoSteps.filter((s) => s.status === "done").length;
  const progress  = Math.round((doneCount / autoSteps.length) * 100);

  // ── auto-run orchestrator ───────────────────────────────────────────────────
  const startAutoRun = useCallback(async () => {
    setAutoSteps(initSteps());
    setAutoResult(null);
    setFatalError(null);
    setScriptWordCount(0);
    setAutoRunning(true);
    setShowAutoPanel(true);

    // Scroll panel into view
    setTimeout(() => panelRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 100);

    let niche        = "";
    let trend        = "";
    let scriptText   = "";
    let scriptFilename = "";
    let audioFilename: string | null = null;
    let audioError:   string | null = null;

    try {
      // ── Step 1: pick niche ───────────────────────────────────────────────
      setStep("niche", { status: "running", detail: "Asking llama3.1…" });
      try {
        const raw = await ollamaGenerate(
          "llama3.1",
          "You are a YouTube growth strategist. It is 2026. " +
          "Name ONE highly profitable YouTube niche that is booming right now. " +
          "Reply with ONLY the niche name, 2–4 words, nothing else.",
        );
        // take first line, strip punctuation and quotes
        niche = raw.split("\n")[0].replace(/["""*]/g, "").trim();
        setStep("niche", { status: "done", detail: niche });
        addActivity("brainstorm", `Auto-run niche: ${niche}`);
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        setStep("niche", { status: "error", detail: msg });
        throw new Error(`Niche step failed: ${msg}`);
      }

      // ── Step 2: find trend ───────────────────────────────────────────────
      setStep("trend", { status: "running", detail: `Researching "${niche}"…` });
      try {
        const raw = await ollamaGenerate(
          "llama3.1",
          `You are a viral YouTube content expert. It is 2026. ` +
          `For the YouTube niche "${niche}", what is the SINGLE most viral video topic right now? ` +
          `Reply with ONLY the video title, under 70 characters, no quotes, nothing else.`,
        );
        trend = raw.split("\n")[0].replace(/["""*]/g, "").trim();
        setStep("trend", { status: "done", detail: trend });
        addActivity("trend", `Auto-run trend: ${trend}`);
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        setStep("trend", { status: "error", detail: msg });
        throw new Error(`Trend step failed: ${msg}`);
      }

      // ── Step 3: write script (streaming) ────────────────────────────────
      setStep("script", { status: "running", detail: "Streaming from qwen3-coder:30b…" });
      try {
        scriptText = await ollamaGenerate(
          "qwen3-coder:30b",
          `Write a complete, engaging YouTube video script for the topic: "${trend}". ` +
          `Niche: ${niche}. It is 2026. Include: hook (0–5 sec), intro (0:00–0:15), ` +
          `3 main content sections with timestamps, and a CTA. ` +
          `Write it as spoken dialogue, ready to record. No markdown headers.`,
          (partial) => {
            const words = partial.split(/\s+/).filter(Boolean).length;
            setScriptWordCount(words);
            setStep("script", { status: "running", detail: `${words} words…` });
          },
        );
        const wc = scriptText.split(/\s+/).filter(Boolean).length;
        setStep("script", { status: "done", detail: `${wc} words written` });
        addActivity("script", `Auto-run script: ${trend}`);
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        setStep("script", { status: "error", detail: msg });
        throw new Error(`Script step failed: ${msg}`);
      }

      // ── Step 4: save script ──────────────────────────────────────────────
      setStep("save", { status: "running", detail: "Writing to public/scripts/…" });
      try {
        const saveRes  = await fetch("/api/save-script", {
          method:  "POST",
          headers: { "Content-Type": "application/json" },
          body:    JSON.stringify({ title: trend, text: scriptText }),
        });
        const saveData = (await saveRes.json()) as { filename?: string; error?: string };
        if (!saveRes.ok) throw new Error(saveData.error ?? `Status ${saveRes.status}`);
        scriptFilename = saveData.filename ?? "script.txt";
        setStep("save", { status: "done", detail: scriptFilename });
        setScriptCount((n) => n + 1);
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        setStep("save", { status: "error", detail: msg });
        throw new Error(`Save step failed: ${msg}`);
      }

      // ── Step 5: generate voice ───────────────────────────────────────────
      setStep("voice", { status: "running", detail: "Running Kokoro TTS…" });
      try {
        const voiceRes  = await fetch("/api/generate-voice", {
          method:  "POST",
          headers: { "Content-Type": "application/json" },
          body:    JSON.stringify({ text: scriptText }),
        });
        const voiceData = (await voiceRes.json()) as { filename?: string; success?: boolean; error?: string };

        if (!voiceRes.ok || voiceData.error) {
          // Soft failure — voice is optional; surface the error but don't abort
          audioError = voiceData.error ?? `Status ${voiceRes.status}`;
          setStep("voice", { status: "error", detail: audioError });
          addActivity("voice", `Auto-run TTS failed: ${audioError.slice(0, 60)}`);
        } else {
          audioFilename = voiceData.filename ?? null;
          setStep("voice", { status: "done", detail: audioFilename ?? "done" });
          addActivity("voice", `Auto-run MP3: ${audioFilename}`);
          setAudioCount((n) => n + 1);
        }
      } catch (e) {
        audioError = e instanceof Error ? e.message : String(e);
        setStep("voice", { status: "error", detail: audioError });
      }

      // ── All done ─────────────────────────────────────────────────────────
      setAutoResult({
        niche,
        trend,
        scriptPreview: scriptText.slice(0, 300),
        scriptFilename,
        audioFilename,
        audioError,
      });

    } catch (err) {
      setFatalError(err instanceof Error ? err.message : String(err));
    } finally {
      setAutoRunning(false);
    }
  }, [setStep]);

  // ── layout data ──────────────────────────────────────────────────────────────
  const activeAgents = autoRunning ? 1 : 0;

  const stats = [
    { label: "Scripts Saved",     value: scriptCount,  icon: FileText,  color: "text-violet-400", bg: "bg-violet-500/10" },
    { label: "Trends Generated",  value: trendsCount,  icon: TrendingUp,color: "text-indigo-400", bg: "bg-indigo-500/10" },
    { label: "MP3 Files",         value: audioCount,   icon: FileAudio, color: "text-orange-400", bg: "bg-orange-500/10" },
    { label: "Active Agents",     value: activeAgents, icon: Bot,       color: "text-emerald-400",bg: "bg-emerald-500/10"},
  ];

  const quickActions = [
    { href: "/brainstorm", label: "Brainstorm Niches", icon: Lightbulb,  desc: "Find profitable YouTube niches",  border: "border-emerald-500/20 hover:border-emerald-500/40", bg: "hover:bg-emerald-500/5", iconColor: "text-emerald-400" },
    { href: "/trends",     label: "Find Trends",       icon: TrendingUp, desc: "Discover trending video ideas",   border: "border-indigo-500/20 hover:border-indigo-500/40",   bg: "hover:bg-indigo-500/5",  iconColor: "text-indigo-400"  },
    { href: "/script",     label: "Write Script",      icon: FileText,   desc: "Generate AI video script",        border: "border-violet-500/20 hover:border-violet-500/40",   bg: "hover:bg-violet-500/5",  iconColor: "text-violet-400"  },
    { href: "/voice",      label: "Generate Voice",    icon: Mic,        desc: "Convert script to MP3 audio",     border: "border-orange-500/20 hover:border-orange-500/40",   bg: "hover:bg-orange-500/5",  iconColor: "text-orange-400"  },
  ];

  // ── isMissingModel helper (reused from voice-page) ────────────────────────
  const isMissingModel = (msg: string) =>
    msg.toLowerCase().includes("voices") ||
    msg.toLowerCase().includes(".onnx")  ||
    msg.toLowerCase().includes("kokoro-v0");

  // ── render ────────────────────────────────────────────────────────────────
  return (
    <main className="p-6 lg:p-8 pt-14 lg:pt-8">

      {/* Header */}
      <div className="mb-6 flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-white">Dashboard</h1>
          <p className="text-sm text-zinc-500 mt-1">
            {template === "youtube"
              ? "Your autonomous YouTube content pipeline"
              : "Din automatiserade dropshipping-pipeline"}
          </p>
        </div>

        {/* ── Template-väljare ── */}
        <div className="flex items-center gap-1 rounded-xl border border-zinc-800 bg-zinc-900 p-1">
          <button
            onClick={() => switchTemplate("youtube")}
            className={cn(
              "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors",
              template === "youtube"
                ? "bg-sky-500/20 text-sky-300 border border-sky-500/30"
                : "text-zinc-500 hover:text-zinc-300"
            )}
          >
            <Youtube size={13} /> YouTube
          </button>
          <button
            onClick={() => switchTemplate("dropshipping")}
            className={cn(
              "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors",
              template === "dropshipping"
                ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/30"
                : "text-zinc-500 hover:text-zinc-300"
            )}
          >
            <Package size={13} /> Dropshipping
          </button>
        </div>
      </div>

      {/* ── AUTO RUN BUTTON (bara i YouTube-läge) ───────────────────────── */}
      {template === "dropshipping" && (
        <div className="mb-8">
          <ProductHunterWidget />
        </div>
      )}

      {/* ── AUTO RUN BUTTON (YouTube-läge) ──────────────────────────────── */}
      {template === "youtube" && (
      /* ── AUTO RUN BUTTON ─────────────────────────────────────────────── */
      <div className="mb-8">
        <button
          onClick={autoRunning ? undefined : startAutoRun}
          disabled={autoRunning}
          className={cn(
            "w-full rounded-2xl border px-6 py-5 text-left transition-all",
            "flex items-center gap-4",
            autoRunning
              ? "border-sky-500/40 bg-sky-500/10 cursor-not-allowed"
              : "border-sky-500/30 bg-gradient-to-r from-sky-500/10 to-indigo-500/10 hover:from-sky-500/20 hover:to-indigo-500/20 hover:border-sky-500/50 cursor-pointer"
          )}
        >
          <div className={cn(
            "flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-2xl",
            autoRunning ? "animate-pulse" : ""
          )}>
            {autoRunning ? "⚡" : "🚀"}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-lg font-bold text-white">
              Kör hela flödet automatiskt
            </p>
            <p className="text-xs text-zinc-400 mt-0.5">
              Niche → Trend → Script → Voice — allt på en gång med AI
            </p>
          </div>
          <div className="shrink-0">
            {autoRunning ? (
              <div className="flex items-center gap-2">
                <Loader2 size={16} className="animate-spin text-sky-400" />
                <span className="text-xs text-sky-400 font-medium">{progress}%</span>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 rounded-lg border border-sky-500/30 bg-sky-500/20 px-3 py-1.5">
                <Zap size={13} className="text-sky-400" />
                <span className="text-xs font-semibold text-sky-300">Auto Run</span>
              </div>
            )}
          </div>
        </button>

        {/* ── AUTO RUN PANEL (visible once started) ───────────────────────── */}
        {showAutoPanel && (
          <div
            ref={panelRef}
            className="mt-3 rounded-2xl border border-zinc-800 bg-zinc-900 overflow-hidden"
          >
            {/* progress bar */}
            <div className="h-1 bg-zinc-800">
              <div
                className="h-1 bg-gradient-to-r from-sky-500 to-indigo-500 transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>

            {/* steps list */}
            <div className="p-4 space-y-1">
              {autoSteps.map((step) => (
                <div
                  key={step.id}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors",
                    step.status === "running" && "bg-sky-500/8",
                    step.status === "done"    && "bg-emerald-500/5",
                    step.status === "error"   && "bg-red-500/5",
                  )}
                >
                  <span className="text-base w-5 text-center select-none">{step.emoji}</span>
                  <p className={cn(
                    "flex-1 text-sm",
                    step.status === "waiting" ? "text-zinc-600"
                    : step.status === "running" ? "text-zinc-200"
                    : step.status === "done"    ? "text-zinc-300"
                    : "text-red-400"
                  )}>
                    {step.label}
                  </p>
                  {step.detail && (
                    <p className={cn(
                      "text-xs font-mono max-w-[260px] truncate",
                      step.status === "running" ? "text-sky-400"
                      : step.status === "done"  ? "text-emerald-400"
                      : "text-red-400"
                    )}>
                      {step.detail}
                    </p>
                  )}
                  <StepIcon status={step.status} />
                </div>
              ))}
            </div>

            {/* script live word counter during generation */}
            {autoRunning && scriptWordCount > 0 && (
              <div className="mx-4 mb-4 rounded-lg border border-violet-500/20 bg-violet-500/5 px-3 py-2">
                <p className="text-xs text-violet-400">
                  ✍️ Script generating…{" "}
                  <span className="font-semibold">{scriptWordCount.toLocaleString()} words</span>
                </p>
              </div>
            )}

            {/* fatal error (non-voice) */}
            {fatalError && (
              <div className="mx-4 mb-4 rounded-lg border border-red-500/30 bg-red-500/10 p-3">
                <p className="text-xs text-red-300">⚠️ {fatalError}</p>
                <button
                  onClick={startAutoRun}
                  className="mt-2 inline-flex items-center gap-1.5 text-xs text-red-400 hover:text-red-300"
                >
                  <RotateCcw size={11} /> Prova igen
                </button>
              </div>
            )}

            {/* ── RESULT SUMMARY ───────────────────────────────────────── */}
            {autoResult && (
              <div className="border-t border-zinc-800 p-4 space-y-4">
                <p className="text-xs font-semibold text-zinc-400 uppercase tracking-widest">
                  Resultat
                </p>

                {/* niche + trend */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-lg border border-zinc-800 bg-zinc-950 p-3">
                    <p className="text-[10px] text-zinc-500 mb-1">Nisch</p>
                    <p className="text-sm font-semibold text-emerald-300">{autoResult.niche}</p>
                  </div>
                  <div className="rounded-lg border border-zinc-800 bg-zinc-950 p-3">
                    <p className="text-[10px] text-zinc-500 mb-1">Trend</p>
                    <p className="text-sm font-semibold text-indigo-300 leading-snug">{autoResult.trend}</p>
                  </div>
                </div>

                {/* script preview */}
                <div className="rounded-lg border border-zinc-800 bg-zinc-950 p-3">
                  <p className="text-[10px] text-zinc-500 mb-2">Script-förhandsgranskning</p>
                  <p className="text-xs font-mono text-zinc-400 leading-relaxed whitespace-pre-wrap line-clamp-5">
                    {autoResult.scriptPreview}
                    {autoResult.scriptPreview.length >= 300 && "…"}
                  </p>
                  <Link
                    href="/script"
                    className="mt-2 inline-flex items-center gap-1 text-xs text-violet-400 hover:underline"
                  >
                    <FileText size={11} /> Visa fullständigt script →
                  </Link>
                </div>

                {/* audio section */}
                {autoResult.audioFilename ? (
                  <div className="rounded-lg border border-orange-500/20 bg-orange-500/5 p-3 space-y-2">
                    <p className="text-xs font-medium text-orange-300">
                      🎵 MP3 redo: <span className="font-mono">{autoResult.audioFilename}</span>
                    </p>
                    {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
                    <audio controls className="w-full" src={`/audio/${autoResult.audioFilename}`} />
                    <a
                      href={`/audio/${autoResult.audioFilename}`}
                      download={autoResult.audioFilename}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-1.5 text-xs font-semibold text-zinc-200 hover:bg-zinc-700 transition-colors"
                    >
                      <Download size={11} /> Ladda ner MP3
                    </a>
                  </div>
                ) : autoResult.audioError ? (
                  isMissingModel(autoResult.audioError) ? (
                    <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 space-y-1.5">
                      <p className="text-xs font-semibold text-amber-300">
                        🎙️ Kokoro-modellfilerna saknas
                      </p>
                      <pre className="text-[10px] font-mono bg-zinc-900 rounded p-2 text-zinc-400 whitespace-pre-wrap break-all">{`wget https://github.com/thewh1teagle/kokoro-onnx/releases/download/model-files-v1.0/kokoro-v0_19.onnx\nwget https://github.com/thewh1teagle/kokoro-onnx/releases/download/model-files-v1.0/voices-v1.0.bin -O voices.bin`}</pre>
                      <p className="text-[10px] text-amber-200/60">
                        Lägg filerna i projektmappen och kör Auto Run igen, eller gå till{" "}
                        <Link href="/voice" className="text-amber-400 hover:underline">Voice-sidan</Link>.
                      </p>
                    </div>
                  ) : (
                    <div className="rounded-lg border border-red-500/20 bg-red-500/5 p-3">
                      <p className="text-xs text-red-400">
                        🎙️ Voice misslyckades: {autoResult.audioError.slice(0, 200)}
                      </p>
                      <Link href="/voice" className="mt-1 inline-flex text-xs text-orange-400 hover:underline">
                        Försök manuellt på Voice-sidan →
                      </Link>
                    </div>
                  )
                ) : null}

                {/* re-run */}
                <button
                  onClick={startAutoRun}
                  className="inline-flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
                >
                  <RotateCcw size={11} /> Kör igen med nytt nisch
                </button>
              </div>
            )}
          </div>
        )}
      </div>
      )} {/* end YouTube-only auto-run block */}

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
        {stats.map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className="rounded-xl border border-zinc-800 bg-zinc-900 p-4">
            <div className={cn("inline-flex h-8 w-8 items-center justify-center rounded-lg mb-3", bg)}>
              <Icon size={16} className={color} />
            </div>
            <p className="text-2xl font-bold text-white">{value}</p>
            <p className="text-xs text-zinc-500 mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Quick actions */}
      <div className="mb-8">
        <h2 className="text-xs font-semibold text-zinc-500 uppercase tracking-widest mb-3">
          Quick Actions
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {quickActions.map(({ href, label, icon: Icon, desc, border, bg, iconColor }) => (
            <Link
              key={href}
              href={href}
              className={cn("rounded-xl border bg-zinc-900 p-4 transition-colors", border, bg)}
            >
              <Icon size={18} className={cn("mb-2", iconColor)} />
              <p className="text-sm font-semibold text-zinc-100">{label}</p>
              <p className="text-xs text-zinc-500 mt-0.5">{desc}</p>
            </Link>
          ))}
        </div>
      </div>

      {/* Recent activity */}
      <div>
        <h2 className="text-xs font-semibold text-zinc-500 uppercase tracking-widest mb-3">
          Recent Activity
        </h2>
        <div className="rounded-xl border border-zinc-800 bg-zinc-900 overflow-hidden">
          {activity.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-10 gap-2">
              <Activity size={22} className="text-zinc-700" />
              <p className="text-sm text-zinc-600">
                No activity yet — start with Brainstorm!
              </p>
            </div>
          ) : (
            <div className="divide-y divide-zinc-800">
              {activity.slice(0, 10).map((item) => {
                const Icon  = typeIcons[item.type] ?? Activity;
                const color = typeColors[item.type] ?? "text-zinc-400";
                return (
                  <div key={item.id} className="flex items-center gap-3 px-4 py-3">
                    <Icon size={13} className={color} />
                    <p className="text-sm text-zinc-300 flex-1 truncate">{item.description}</p>
                    <p className="text-[11px] text-zinc-600 shrink-0">
                      {new Date(item.timestamp).toLocaleDateString("sv-SE")}
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
