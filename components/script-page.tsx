"use client";

import { useState, useEffect } from "react";
import {
  FileText,
  Loader2,
  AlertCircle,
  Save,
  CheckCircle2,
  TrendingUp,
} from "lucide-react";

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

export default function ScriptPage() {
  const [trend, setTrend]         = useState<Trend | null>(null);
  const [script, setScript]       = useState("");
  const [loading, setLoading]     = useState(false);
  const [saving, setSaving]       = useState(false);
  const [error, setError]         = useState<string | null>(null);
  const [savedFile, setSavedFile] = useState<string | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem("fd_selected_trend");
    if (stored) {
      try { setTrend(JSON.parse(stored) as Trend); } catch {}
    }
  }, []);

  async function writeScript() {
    if (!trend) return;
    setError(null);
    setScript("");
    setSavedFile(null);
    setLoading(true);

    try {
      const res = await fetch("http://localhost:11434/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "qwen3-coder:30b",
          prompt:
            `Write a YouTube script for a faceless channel about: ${trend.title}. ` +
            "Structure: " +
            "HOOK (0-5s): attention grabbing opening. " +
            "INTRO (0:06-0:15): welcome and topic overview. " +
            "MAIN CONTENT: 3 key points each with explanation. " +
            "OUTRO: summary and call to action. " +
            "Keep under 300 words. Write in English.",
          stream: true,
        }),
      });

      if (!res.ok || !res.body) throw new Error(`Ollama returned ${res.status}`);

      const reader  = res.body.getReader();
      const decoder = new TextDecoder();
      let accumulated = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        for (const line of chunk.split("\n").filter(Boolean)) {
          try {
            const parsed = JSON.parse(line) as { response?: string };
            if (parsed.response) {
              accumulated += parsed.response;
              setScript(accumulated);
            }
          } catch {}
        }
      }

      addActivity("script", `Script written for "${trend.title}"`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      setError(
        msg.includes("11434") || msg.toLowerCase().includes("fetch")
          ? "Cannot reach Ollama. Make sure it is running with qwen3-coder:30b loaded."
          : `Error: ${msg}`
      );
    } finally {
      setLoading(false);
    }
  }

  async function saveScript() {
    if (!script || !trend) return;
    setSaving(true);
    setSavedFile(null);
    try {
      const res = await fetch("/api/save-script", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: script, title: trend.title }),
      });
      const data = await res.json() as { filename?: string; error?: string };
      if (!res.ok) throw new Error(data.error ?? "Save failed");
      setSavedFile(data.filename ?? "saved");
      addActivity("script", `Saved: ${data.filename}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save script");
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="p-6 lg:p-8 pt-14 lg:pt-8">
      {/* Header */}
      <div className="mb-6 flex items-center gap-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-500/10">
          <FileText size={16} className="text-violet-400" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-white">Script Agent</h1>
          <p className="text-xs text-zinc-500">
            AI-powered YouTube script writer (qwen3-coder:30b)
          </p>
        </div>
      </div>

      {/* Selected trend badge */}
      {trend ? (
        <div className="mb-5 flex items-start gap-2 rounded-lg border border-indigo-500/30 bg-indigo-500/10 p-3">
          <TrendingUp size={13} className="text-indigo-400 mt-0.5 shrink-0" />
          <div>
            <p className="text-[10px] text-indigo-400 font-semibold uppercase tracking-wider mb-0.5">
              Selected trend
            </p>
            <p className="text-sm text-zinc-100">{trend.title}</p>
          </div>
        </div>
      ) : (
        <div className="mb-5 rounded-lg border border-zinc-700 bg-zinc-900 p-3">
          <p className="text-xs text-zinc-500">
            No trend selected.{" "}
            <a href="/trends" className="text-indigo-400 hover:underline">
              Go to Trends
            </a>{" "}
            and pick one first.
          </p>
        </div>
      )}

      {/* Action buttons */}
      <div className="flex flex-wrap gap-2 mb-5">
        <button
          onClick={writeScript}
          disabled={!trend || loading}
          className="inline-flex items-center gap-2 rounded-lg bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-violet-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <Loader2 size={14} className="animate-spin" />
          ) : (
            <FileText size={14} />
          )}
          {loading ? "Skriver manus…" : "Skriv manus"}
        </button>

        {script && (
          <button
            onClick={saveScript}
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-2.5 text-sm font-semibold text-zinc-200 transition hover:bg-zinc-700 disabled:opacity-50"
          >
            {saving ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <Save size={14} />
            )}
            Spara manus
          </button>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="mb-4 flex items-start gap-2 rounded-lg border border-red-500/30 bg-red-500/10 p-3">
          <AlertCircle size={14} className="text-red-400 mt-0.5 shrink-0" />
          <p className="text-xs text-red-300">{error}</p>
        </div>
      )}

      {/* Save success */}
      {savedFile && (
        <div className="mb-4 flex items-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3">
          <CheckCircle2 size={14} className="text-emerald-400 shrink-0" />
          <p className="text-xs text-emerald-300">
            Saved as{" "}
            <code className="font-mono bg-emerald-500/10 px-1 rounded">
              {savedFile}
            </code>
          </p>
        </div>
      )}

      {/* Script output */}
      {(script || loading) && (
        <div>
          <div className="flex items-center gap-2 mb-2">
            <FileText size={12} className="text-violet-400" />
            <span className="text-xs font-semibold uppercase tracking-widest text-violet-400">
              Generated Script
            </span>
            {loading && (
              <Loader2 size={10} className="animate-spin text-violet-400" />
            )}
          </div>
          <textarea
            readOnly
            value={script}
            rows={22}
            className="w-full rounded-xl border border-zinc-800 bg-zinc-950 p-4 font-mono text-xs text-zinc-200 leading-relaxed resize-none focus:outline-none"
          />
        </div>
      )}
    </main>
  );
}
