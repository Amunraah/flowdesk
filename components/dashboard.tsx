"use client";

import { useState } from "react";
import { Play, Activity, CheckCircle2, XCircle, Clock, TrendingUp, FileText, Video, Mic, Upload, DollarSign } from "lucide-react";

type AgentStatus = "idle" | "running" | "done" | "error";

type Agent = {
  id: string;
  name: string;
  icon: React.ReactNode;
};

const AGENTS: Agent[] = [
  { id: "trend",  name: "Trend",  icon: <TrendingUp size={15} /> },
  { id: "script", name: "Script", icon: <FileText size={15} /> },
  { id: "video",  name: "Video",  icon: <Video size={15} /> },
  { id: "voice",  name: "Voice",  icon: <Mic size={15} /> },
  { id: "upload", name: "Upload", icon: <Upload size={15} /> },
  { id: "sales",  name: "Sales",  icon: <DollarSign size={15} /> },
];

const PIPELINE_STEPS = ["Trend", "Hook", "Script", "Video", "Voice", "Upload"];

const statusConfig: Record<AgentStatus, { label: string; color: string; icon: React.ReactNode }> = {
  idle:    { label: "idle",    color: "bg-zinc-700 text-zinc-300",          icon: <Clock size={11} /> },
  running: { label: "running", color: "bg-indigo-500/20 text-indigo-300 animate-pulse", icon: <Activity size={11} /> },
  done:    { label: "done",    color: "bg-emerald-500/20 text-emerald-300", icon: <CheckCircle2 size={11} /> },
  error:   { label: "error",   color: "bg-red-500/20 text-red-300",         icon: <XCircle size={11} /> },
};

const initialStatuses: Record<string, AgentStatus> = {
  trend: "idle", script: "idle", video: "idle",
  voice: "idle", upload: "idle", sales: "idle",
};

// Split raw Ollama text into lines; numbered items (1. …) become selectable trend picks.
function parseTrendLines(text: string) {
  return text.split("\n").map((line) => {
    const isItem = /^\d+[\.\)]\s+\S/.test(line.trim());
    const itemText = isItem ? line.replace(/^\d+[\.\)]\s*/, "").trim() : "";
    return { raw: line, isItem, itemText };
  });
}

export default function Dashboard() {
  const [statuses, setStatuses]         = useState<Record<string, AgentStatus>>(initialStatuses);
  const [trendOutput, setTrendOutput]   = useState<string>("");
  const [trendError, setTrendError]     = useState<string | null>(null);
  const [selectedTrend, setSelectedTrend] = useState<string | null>(null);
  const [scriptOutput, setScriptOutput] = useState<string>("");
  const [scriptError, setScriptError]   = useState<string | null>(null);

  const setAgentStatus = (id: string, status: AgentStatus) =>
    setStatuses((prev) => ({ ...prev, [id]: status }));

  async function runTrendAgent() {
    setTrendError(null);
    setTrendOutput("");
    setSelectedTrend(null);
    setScriptOutput("");
    setScriptError(null);
    setAgentStatus("trend", "running");
    setAgentStatus("script", "idle");

    try {
      const res = await fetch("http://localhost:11434/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "llama3.1",
          prompt:
            "Give me exactly 5 trending YouTube video ideas for faceless channels in 2026. " +
            "Format as a numbered list. Be specific and creative. Focus on high-CPM niches.",
          stream: true,
        }),
      });

      if (!res.ok || !res.body) {
        throw new Error(`Ollama svarade med status ${res.status}`);
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let accumulated = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split("\n").filter(Boolean);

        for (const line of lines) {
          try {
            const parsed = JSON.parse(line) as { response?: string; done?: boolean };
            if (parsed.response) {
              accumulated += parsed.response;
              setTrendOutput(accumulated);
            }
          } catch {
            // skip malformed lines
          }
        }
      }

      setAgentStatus("trend", "done");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Okänt fel";
      setTrendError(`Kunde inte nå Ollama: ${msg}. Kontrollera att Ollama körs på localhost:11434.`);
      setAgentStatus("trend", "error");
    }
  }

  async function runScriptAgent() {
    if (!selectedTrend) return;
    setScriptError(null);
    setScriptOutput("");
    setAgentStatus("script", "running");

    try {
      const res = await fetch("http://localhost:11434/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "qwen3-coder:30b",
          prompt:
            `Write a short YouTube script for a faceless channel about: ${selectedTrend}. ` +
            "Include: Hook (first 5 seconds), Intro, Main content (3 points), Outro with call to action. " +
            "Keep it under 300 words.",
          stream: true,
        }),
      });

      if (!res.ok || !res.body) {
        throw new Error(`Ollama svarade med status ${res.status}`);
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let accumulated = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split("\n").filter(Boolean);

        for (const line of lines) {
          try {
            const parsed = JSON.parse(line) as { response?: string; done?: boolean };
            if (parsed.response) {
              accumulated += parsed.response;
              setScriptOutput(accumulated);
            }
          } catch {
            // skip malformed lines
          }
        }
      }

      setAgentStatus("script", "done");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Okänt fel";
      setScriptError(`Kunde inte nå Ollama: ${msg}. Kontrollera att Ollama körs på localhost:11434.`);
      setAgentStatus("script", "error");
    }
  }

  const activePipelineStep = (() => {
    const order = ["trend", "script", "video", "voice", "upload"];
    const running = order.find((id) => statuses[id] === "running");
    if (running) return running;
    const lastDone = [...order].reverse().find((id) => statuses[id] === "done");
    return lastDone ?? null;
  })();

  return (
    <main className="min-h-screen bg-black text-zinc-100 p-6 font-sans">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-white">
          Flowdesk
        </h1>
        <p className="text-sm text-zinc-500 mt-0.5">Your autonomous command center</p>
      </div>

      {/* Main grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">

        {/* LEFT — Agent Status Panel */}
        <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-5">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-zinc-400 mb-4">
            Agent Status
          </h2>

          <div className="space-y-2">
            {AGENTS.map((agent) => {
              const s = statuses[agent.id];
              const cfg = statusConfig[s];
              const isTrend  = agent.id === "trend";
              const isScript = agent.id === "script";
              const scriptReady = isScript && selectedTrend !== null;

              return (
                <div
                  key={agent.id}
                  className="flex items-center justify-between rounded-lg bg-zinc-800/50 px-3 py-2.5"
                >
                  <div className="flex items-center gap-2.5 text-sm font-medium text-zinc-200">
                    <span className="text-zinc-400">{agent.icon}</span>
                    {agent.name}
                    {/* Show the chosen topic as a subtle hint on the Script row */}
                    {isScript && selectedTrend && (
                      <span className="ml-1 max-w-[140px] truncate text-[10px] text-zinc-500 font-normal">
                        — {selectedTrend}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium ${cfg.color}`}
                    >
                      {cfg.icon}
                      {cfg.label}
                    </span>

                    {isTrend && (
                      <button
                        onClick={runTrendAgent}
                        disabled={s === "running"}
                        className="inline-flex items-center gap-1 rounded-md bg-indigo-600 px-2.5 py-1 text-xs font-semibold text-white transition hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <Play size={10} className="fill-white" />
                        Kör
                      </button>
                    )}

                    {isScript && (
                      <button
                        onClick={runScriptAgent}
                        disabled={!scriptReady || s === "running"}
                        title={!scriptReady ? "Välj ett trendämne först" : ""}
                        className="inline-flex items-center gap-1 rounded-md bg-violet-600 px-2.5 py-1 text-xs font-semibold text-white transition hover:bg-violet-500 disabled:opacity-30 disabled:cursor-not-allowed"
                      >
                        <Play size={10} className="fill-white" />
                        Kör
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* RIGHT — Content Pipeline */}
        <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-5">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-zinc-400 mb-4">
            Content Pipeline
          </h2>

          {/* Pipeline steps */}
          <div className="flex flex-wrap gap-2 mb-4">
            {PIPELINE_STEPS.map((step, i) => {
              const stepId = step.toLowerCase();
              const isDone    = statuses[stepId] === "done";
              const isRunning = statuses[stepId] === "running" || (stepId === "hook" && statuses["trend"] === "running");
              const isActive  = activePipelineStep === stepId;

              return (
                <div key={step} className="flex items-center gap-1.5">
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold transition-all ${
                      isDone
                        ? "bg-emerald-500/20 text-emerald-300 ring-1 ring-emerald-500/30"
                        : isRunning || isActive
                        ? "bg-indigo-500/20 text-indigo-300 ring-1 ring-indigo-500/40 animate-pulse"
                        : "bg-zinc-800 text-zinc-500"
                    }`}
                  >
                    {step}
                  </span>
                  {i < PIPELINE_STEPS.length - 1 && (
                    <span className="text-zinc-700 text-xs">→</span>
                  )}
                </div>
              );
            })}
          </div>

          {/* Trend Error */}
          {trendError && (
            <div className="mb-3 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-300">
              {trendError}
            </div>
          )}

          {/* Trend Output */}
          <div className="rounded-lg bg-zinc-800/60 border border-zinc-700/50 min-h-[120px] p-3">
            {/* Empty state */}
            {!trendOutput && !trendError && statuses.trend === "idle" && (
              <p className="text-xs text-zinc-600 italic">
                Trend agent output visas här när du kör agenten...
              </p>
            )}

            {/* Streaming spinner (before any text arrives) */}
            {statuses.trend === "running" && !trendOutput && (
              <div className="flex items-center gap-2 text-xs text-indigo-400">
                <span className="inline-block h-1.5 w-1.5 rounded-full bg-indigo-400 animate-ping" />
                Genererar idéer med llama3.1...
              </div>
            )}

            {/* Streaming: raw pre with cursor */}
            {trendOutput && statuses.trend === "running" && (
              <pre className="whitespace-pre-wrap text-xs leading-relaxed text-zinc-200 font-mono">
                {trendOutput}
                <span className="inline-block w-1.5 h-3 bg-indigo-400 animate-pulse ml-0.5 align-middle" />
              </pre>
            )}

            {/* Done: clickable numbered lines */}
            {trendOutput && statuses.trend !== "running" && (
              <div className="space-y-1">
                <p className="text-[10px] text-zinc-500 mb-2 italic">
                  Klicka på ett ämne för att välja det för Script agenten
                </p>
                {parseTrendLines(trendOutput).map((line, idx) =>
                  line.isItem ? (
                    <button
                      key={idx}
                      onClick={() =>
                        setSelectedTrend((prev) =>
                          prev === line.itemText ? null : line.itemText
                        )
                      }
                      className={`w-full text-left rounded-md px-2.5 py-1.5 text-xs font-mono transition-all ${
                        selectedTrend === line.itemText
                          ? "bg-indigo-500/20 text-indigo-200 ring-1 ring-indigo-500/50"
                          : "bg-zinc-700/40 text-zinc-300 hover:bg-zinc-700 hover:text-zinc-100"
                      }`}
                    >
                      {line.raw}
                    </button>
                  ) : (
                    line.raw.trim() !== "" && (
                      <p key={idx} className="text-[11px] text-zinc-500 px-1 font-mono">
                        {line.raw}
                      </p>
                    )
                  )
                )}
              </div>
            )}
          </div>

          {/* Script Error */}
          {scriptError && (
            <div className="mt-3 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-300">
              {scriptError}
            </div>
          )}

          {/* Script Output */}
          {(scriptOutput || statuses.script === "running") && (
            <div className="mt-3">
              <div className="flex items-center gap-2 mb-2">
                <FileText size={12} className="text-violet-400" />
                <span className="text-xs font-semibold uppercase tracking-widest text-violet-400">
                  Script
                </span>
                {selectedTrend && (
                  <span className="text-[10px] text-zinc-500 truncate max-w-[200px]">
                    — {selectedTrend}
                  </span>
                )}
              </div>
              <div className="rounded-lg bg-zinc-950 border border-violet-500/20 min-h-[100px] p-3">
                {statuses.script === "running" && !scriptOutput && (
                  <div className="flex items-center gap-2 text-xs text-violet-400">
                    <span className="inline-block h-1.5 w-1.5 rounded-full bg-violet-400 animate-ping" />
                    Genererar script med qwen3-coder:30b...
                  </div>
                )}
                {scriptOutput && (
                  <pre className="whitespace-pre-wrap text-xs leading-relaxed text-zinc-200 font-mono">
                    {scriptOutput}
                    {statuses.script === "running" && (
                      <span className="inline-block w-1.5 h-3 bg-violet-400 animate-pulse ml-0.5 align-middle" />
                    )}
                  </pre>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Videos denna vecka", value: "0", sub: "+0 från förra veckan" },
          { label: "Affiliate intäkter",  value: "0 kr", sub: "Senaste 30 dagarna" },
          { label: "Aktiva flöden",       value: "0", sub: "Pipelines i drift" },
          { label: "Screen recordings",   value: "0", sub: "Inspelade sessioner" },
        ].map((stat) => (
          <div
            key={stat.label}
            className="rounded-xl border border-zinc-800 bg-zinc-900 p-4"
          >
            <p className="text-xs text-zinc-500 mb-1">{stat.label}</p>
            <p className="text-2xl font-bold text-white">{stat.value}</p>
            <p className="text-[11px] text-zinc-600 mt-0.5">{stat.sub}</p>
          </div>
        ))}
      </div>
    </main>
  );
}
