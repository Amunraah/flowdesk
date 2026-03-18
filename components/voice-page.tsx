"use client";

import { useState, useEffect } from "react";
import { Mic, Loader2, AlertCircle, Download, Music } from "lucide-react";
import { cn } from "@/lib/utils";

interface ScriptFile {
  filename: string;
  content:  string;
  created:  number;
}

function addActivity(type: string, description: string) {
  try {
    const prev = JSON.parse(localStorage.getItem("fd_activity") || "[]");
    prev.unshift({ id: String(Date.now()), type, description, timestamp: Date.now() });
    localStorage.setItem("fd_activity", JSON.stringify(prev.slice(0, 20)));
  } catch {}
}

export default function VoicePage() {
  const [scripts, setScripts]         = useState<ScriptFile[]>([]);
  const [selected, setSelected]       = useState<ScriptFile | null>(null);
  const [loadingList, setLoadingList] = useState(true);
  const [generating, setGenerating]   = useState(false);
  const [error, setError]             = useState<string | null>(null);
  const [audioFile, setAudioFile]     = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/scripts")
      .then((r) => r.json())
      .then((d) => setScripts(Array.isArray(d) ? (d as ScriptFile[]) : []))
      .catch(() => setScripts([]))
      .finally(() => setLoadingList(false));
  }, []);

  function selectScript(s: ScriptFile) {
    setSelected(s);
    setAudioFile(null);
    setError(null);
  }

  async function generateVoice() {
    if (!selected?.content.trim()) return;
    setError(null);
    setAudioFile(null);
    setGenerating(true);

    try {
      const res = await fetch("/api/generate-voice", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ text: selected.content }),
      });

      const data = await res.json() as { filename?: string; error?: string };
      if (!res.ok) throw new Error(data.error ?? `Server error ${res.status}`);

      setAudioFile(data.filename ?? "output.mp3");
      addActivity("voice", `MP3 generated: ${data.filename}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate voice");
    } finally {
      setGenerating(false);
    }
  }

  return (
    <main className="p-6 lg:p-8 pt-14 lg:pt-8">

      {/* Header */}
      <div className="mb-6 flex items-center gap-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-500/10">
          <Mic size={16} className="text-orange-400" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-white">Voice Agent</h1>
          <p className="text-xs text-zinc-500">
            Convert scripts to audio using Kokoro TTS
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

        {/* ── Left: script list ────────────────────────────────────── */}
        <div>
          <h2 className="text-xs font-semibold text-zinc-500 uppercase tracking-widest mb-3">
            Saved Scripts
          </h2>

          <div className="rounded-xl border border-zinc-800 bg-zinc-900 overflow-hidden min-h-[120px]">
            {loadingList ? (
              <div className="flex items-center justify-center p-8">
                <Loader2 size={16} className="animate-spin text-zinc-600" />
              </div>
            ) : scripts.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-8 gap-2">
                <Music size={20} className="text-zinc-700" />
                <p className="text-xs text-zinc-600 text-center">
                  No scripts saved yet.{" "}
                  <a href="/script" className="text-orange-400 hover:underline">
                    Write one first.
                  </a>
                </p>
              </div>
            ) : (
              <div className="divide-y divide-zinc-800">
                {scripts.map((s) => (
                  <button
                    key={s.filename}
                    onClick={() => selectScript(s)}
                    className={cn(
                      "w-full text-left px-4 py-3 transition-colors",
                      selected?.filename === s.filename
                        ? "bg-orange-500/10 text-orange-200"
                        : "text-zinc-300 hover:bg-zinc-800"
                    )}
                  >
                    <p className="text-xs font-mono truncate">{s.filename}</p>
                    <p className="text-[10px] text-zinc-600 mt-0.5">
                      {new Date(s.created).toLocaleString("sv-SE")}
                    </p>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ── Right: content preview + generation ──────────────────── */}
        <div className="flex flex-col gap-3">
          <h2 className="text-xs font-semibold text-zinc-500 uppercase tracking-widest">
            Script Content
          </h2>

          {/* Content card */}
          {selected ? (
            <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-4 max-h-[360px] overflow-y-auto">
              <p className="font-mono text-xs text-zinc-300 leading-relaxed whitespace-pre-wrap break-words">
                {selected.content}
              </p>
            </div>
          ) : (
            <div className="rounded-xl border border-zinc-800 bg-zinc-950 flex items-center justify-center min-h-[200px]">
              <p className="text-xs text-zinc-700">Select a script from the list…</p>
            </div>
          )}

          {/* Error — with special treatment for missing model files */}
          {error && (
            (() => {
              const isMissingModel =
                error.toLowerCase().includes("voices") ||
                error.toLowerCase().includes(".onnx") ||
                error.toLowerCase().includes("kokoro-v0");

              return isMissingModel ? (
                <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 space-y-2">
                  <div className="flex items-center gap-2">
                    <AlertCircle size={14} className="text-amber-400 shrink-0" />
                    <p className="text-xs font-semibold text-amber-300">
                      Kokoro model files missing — download them first
                    </p>
                  </div>
                  <p className="text-[11px] text-amber-200/70">
                    Run these commands in the{" "}
                    <span className="font-mono">flowdesk</span> project folder:
                  </p>
                  <pre className="text-[11px] font-mono bg-zinc-900 rounded p-2 text-zinc-300 whitespace-pre-wrap break-all">
{`wget https://github.com/thewh1teagle/kokoro-onnx/releases/download/model-files-v1.0/kokoro-v0_19.onnx
wget https://github.com/thewh1teagle/kokoro-onnx/releases/download/model-files-v1.0/voices-v1.0.bin -O voices.bin`}
                  </pre>
                  <p className="text-[10px] text-amber-200/50">
                    Place both files in{" "}
                    <span className="font-mono">C:\Users\Slarv\flowdesk\</span>
                    , then try again.
                  </p>
                </div>
              ) : (
                <div className="flex items-start gap-2 rounded-lg border border-red-500/30 bg-red-500/10 p-3">
                  <AlertCircle size={14} className="text-red-400 mt-0.5 shrink-0" />
                  <p className="text-xs text-red-300">{error}</p>
                </div>
              );
            })()
          )}

          {/* Generate button */}
          <button
            onClick={generateVoice}
            disabled={!selected || generating}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-orange-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-orange-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {generating ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <Mic size={14} />
            )}
            {generating ? "Generating MP3…" : "Generera MP3"}
          </button>

          {/* Audio result */}
          {audioFile && (
            <div className="rounded-xl border border-orange-500/20 bg-orange-500/5 p-4">
              <p className="text-xs text-orange-400 font-medium mb-3">
                ✓ Audio ready:{" "}
                <span className="font-mono">{audioFile}</span>
              </p>
              {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
              <audio
                controls
                className="w-full mb-3"
                src={`/audio/${audioFile}`}
              />
              <a
                href={`/audio/${audioFile}`}
                download={audioFile}
                className="inline-flex items-center gap-2 rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-xs font-semibold text-zinc-200 transition hover:bg-zinc-700"
              >
                <Download size={12} />
                Download MP3
              </a>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
