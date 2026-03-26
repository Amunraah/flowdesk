"use client";

// Quick Enhance — öppnas med Ctrl+E
// Klistra in text → skicka till Ollama llama3.1 → visa förbättrat resultat

import { useRef } from "react";
import { X, Sparkles, Copy, Check, Loader2, AlertTriangle } from "lucide-react";
import { useOllamaEnhance } from "@/hooks/useOllama";
import { useState } from "react";

interface Props {
  onClose: () => void;
}

export default function QuickEnhance({ onClose }: Props) {
  const [inputText, setInputText] = useState("");
  const [copied, setCopied]       = useState(false);
  const textareaRef               = useRef<HTMLTextAreaElement>(null);

  const { loading, result, error, enhance, reset } = useOllamaEnhance();

  // Fokusera textarea vid öppning
  const handleRef = (el: HTMLTextAreaElement | null) => {
    (textareaRef as React.MutableRefObject<HTMLTextAreaElement | null>).current = el;
    el?.focus();
  };

  async function handleEnhance() {
    if (!inputText.trim()) return;
    reset();
    await enhance(inputText);
  }

  async function copyResult() {
    if (!result) return;
    await navigator.clipboard.writeText(result);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function useResult() {
    setInputText(result);
    reset();
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="w-full max-w-2xl rounded-2xl border border-zinc-700 bg-zinc-900 shadow-2xl flex flex-col max-h-[90vh]">

        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-800 px-6 py-4 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-cyan-600/20">
              <Sparkles size={15} className="text-cyan-400" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Quick Enhance</h2>
              <p className="text-xs text-zinc-500">Förbättra text med llama3.1 lokalt</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-zinc-500 hover:bg-zinc-800 hover:text-zinc-200 transition"
          >
            <X size={18} />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 px-6 py-5 space-y-4">

          {/* Ollama offline-varning */}
          {error && (error.includes("offline") || error.includes("Ollama")) && (
            <div className="flex items-start gap-3 rounded-xl border border-red-500/30 bg-red-500/10 p-4">
              <AlertTriangle size={18} className="text-red-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-red-300">{error}</p>
                <code className="mt-1 block text-xs text-zinc-400">ollama serve</code>
              </div>
            </div>
          )}

          {/* Input-textarea */}
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-zinc-300">
              Din text — klistra in eller skriv
            </label>
            <textarea
              ref={handleRef}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Klistra in texten du vill förbättra här..."
              rows={6}
              className="w-full rounded-xl border border-zinc-700 bg-zinc-800 px-4 py-3 text-base text-white placeholder-zinc-600 focus:border-cyan-500 focus:outline-none resize-none leading-relaxed"
            />
          </div>

          {/* Förbättra-knapp */}
          <button
            onClick={handleEnhance}
            disabled={!inputText.trim() || loading}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-cyan-600 py-3.5 text-base font-bold text-white transition hover:bg-cyan-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <><Loader2 size={18} className="animate-spin" /> Förbättrar med llama3.1…</>
            ) : (
              <><Sparkles size={18} /> Förbättra texten</>
            )}
          </button>

          {/* Resultat */}
          {(result || (loading && !result)) && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-sm font-semibold text-zinc-300">
                  ✨ Förbättrad version
                  {loading && <span className="ml-2 text-xs text-cyan-500 animate-pulse">skriver…</span>}
                </label>
                {result && (
                  <div className="flex gap-2">
                    <button
                      onClick={copyResult}
                      className="flex items-center gap-1.5 rounded-lg bg-zinc-800 px-3 py-1.5 text-xs font-semibold text-zinc-300 hover:bg-zinc-700 transition"
                    >
                      {copied ? <Check size={13} /> : <Copy size={13} />}
                      {copied ? "Kopierad!" : "Kopiera"}
                    </button>
                    <button
                      onClick={useResult}
                      className="rounded-lg bg-zinc-800 px-3 py-1.5 text-xs font-semibold text-zinc-300 hover:bg-zinc-700 transition"
                    >
                      Använd som input
                    </button>
                  </div>
                )}
              </div>

              <div className="min-h-[100px] rounded-xl border border-cyan-500/20 bg-zinc-950 p-4">
                <p className="text-base text-zinc-200 leading-relaxed whitespace-pre-wrap">
                  {result || <span className="text-zinc-700">Väntar på svar…</span>}
                </p>
              </div>
            </div>
          )}

          {/* Fel (ej offline-relaterat) */}
          {error && !error.includes("offline") && !error.includes("Ollama") && (
            <p className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
              ⚠️ {error}
            </p>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-zinc-800 px-6 py-3 shrink-0">
          <p className="text-xs text-zinc-600">
            Ctrl+E öppna/stäng · Esc stäng · Modell: llama3.1 (lokal Ollama)
          </p>
        </div>

      </div>
    </div>
  );
}
