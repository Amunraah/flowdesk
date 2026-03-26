"use client";

// Hook för att prata med lokal Ollama via API-routen

import { useState, useCallback } from "react";

interface OllamaState {
  loading:  boolean;
  result:   string;
  error:    string | null;
}

export function useOllamaEnhance() {
  const [state, setState] = useState<OllamaState>({
    loading: false,
    result:  "",
    error:   null,
  });

  // Förbättra text — streamar svaret
  const enhance = useCallback(async (text: string, context?: string): Promise<string> => {
    setState({ loading: true, result: "", error: null });

    try {
      const res = await fetch("/api/ollama/enhance", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ text, context }),
      });

      // Hantera offline/modell saknas
      if (res.status === 503) {
        const data = await res.json() as { message?: string };
        const msg = data.message ?? "Ollama är offline";
        setState({ loading: false, result: "", error: msg });
        return "";
      }

      if (!res.ok) {
        const data = await res.json() as { error?: string };
        throw new Error(data.error ?? `Server-fel ${res.status}`);
      }

      // Läs strömmad text
      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      let full = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        full += decoder.decode(value, { stream: true });
        setState((prev) => ({ ...prev, result: full }));
      }

      setState({ loading: false, result: full, error: null });
      return full;
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Okänt fel";
      setState({ loading: false, result: "", error: msg });
      return "";
    }
  }, []);

  const reset = useCallback(() => {
    setState({ loading: false, result: "", error: null });
  }, []);

  return { ...state, enhance, reset };
}
