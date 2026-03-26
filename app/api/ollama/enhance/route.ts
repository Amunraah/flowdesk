// Ollama Enhance API — förbättrar text via lokal llama3.1
// Streamar svaret direkt tillbaka till klienten (token för token)

import { NextRequest, NextResponse } from "next/server";

const OLLAMA_BASE = "http://localhost:11434";
const MODEL       = "llama3.1";
const TIMEOUT_MS  = 60_000;

// Kolla om Ollama körs och om modellen finns
async function checkOllama(): Promise<{ ok: boolean; hasModel: boolean }> {
  try {
    const res = await fetch(`${OLLAMA_BASE}/api/tags`, {
      signal: AbortSignal.timeout(3_000),
    });
    if (!res.ok) return { ok: false, hasModel: false };

    const data = await res.json() as { models?: Array<{ name: string }> };
    const hasModel = data.models?.some((m) => m.name.includes("llama3.1")) ?? false;

    return { ok: true, hasModel };
  } catch {
    return { ok: false, hasModel: false };
  }
}

export async function POST(req: NextRequest) {
  try {
    const { text, context } = await req.json() as { text?: string; context?: string };

    if (!text?.trim()) {
      return NextResponse.json({ error: "Ingen text angiven" }, { status: 400 });
    }

    // Kolla Ollama-status
    const status = await checkOllama();

    if (!status.ok) {
      return NextResponse.json(
        { error: "ollama_offline", message: "Ollama är offline. Starta med: ollama serve" },
        { status: 503 }
      );
    }

    if (!status.hasModel) {
      return NextResponse.json(
        { error: "model_missing", message: "Modellen saknas. Kör: ollama pull llama3.1" },
        { status: 503 }
      );
    }

    // Bygg prompten
    const systemContext = context ? `Kontext: ${context}\n\n` : "";
    const prompt = `${systemContext}Du är en expert på att förbättra texter på svenska och engelska. Förbättra följande text till en mer klar, kraftfull och övertygande version. Behåll kärnbudskapet och språket (svenska = svenska, engelska = engelska). Svara BARA med den förbättrade texten utan kommentarer eller förklaringar:

${text.trim()}`;

    // Skicka till Ollama med streaming
    const upstream = await fetch(`${OLLAMA_BASE}/api/generate`, {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ model: MODEL, prompt, stream: true }),
      signal:  AbortSignal.timeout(TIMEOUT_MS),
    });

    if (!upstream.ok) {
      const err = await upstream.text();
      return NextResponse.json({ error: `Ollama fel: ${err}` }, { status: 500 });
    }

    // Transformera NDJSON → plain text tokens
    const transform = new TransformStream<Uint8Array, Uint8Array>({
      transform(chunk, controller) {
        const text = new TextDecoder().decode(chunk);
        for (const line of text.split("\n")) {
          if (!line.trim()) continue;
          try {
            const obj = JSON.parse(line) as { response?: string; done?: boolean };
            if (obj.response) {
              controller.enqueue(new TextEncoder().encode(obj.response));
            }
          } catch {
            // Ignorera trasiga JSON-rader
          }
        }
      },
    });

    return new Response(upstream.body!.pipeThrough(transform), {
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Okänt fel";
    console.error("[ollama/enhance]", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
