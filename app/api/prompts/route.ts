// CRUD-API för Prompt Library — läser/skriver till data/prompts.json

import { NextRequest, NextResponse } from "next/server";
import { readFile, writeFile, mkdir } from "fs/promises";
import path from "path";
import type { Prompt } from "@/types/prompt";

const DATA_FILE = path.join(process.cwd(), "data", "prompts.json");

// Hjälpfunktion: läs prompts (returnerar tom array om filen saknas)
async function readPrompts(): Promise<Prompt[]> {
  try {
    const raw = await readFile(DATA_FILE, "utf8");
    return JSON.parse(raw) as Prompt[];
  } catch {
    return [];
  }
}

// Hjälpfunktion: skriv prompts till fil
async function writePrompts(prompts: Prompt[]): Promise<void> {
  await mkdir(path.dirname(DATA_FILE), { recursive: true });
  await writeFile(DATA_FILE, JSON.stringify(prompts, null, 2), "utf8");
}

// GET /api/prompts — hämta alla
export async function GET() {
  const prompts = await readPrompts();
  return NextResponse.json(prompts);
}

// POST /api/prompts — skapa ny prompt
export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as Partial<Prompt>;

    if (!body.title?.trim() || !body.promptText?.trim()) {
      return NextResponse.json({ error: "Titel och prompt-text krävs" }, { status: 400 });
    }

    const prompts = await readPrompts();
    const newPrompt: Prompt = {
      id:          `prompt-${Date.now()}`,
      title:       body.title.trim(),
      description: body.description?.trim() ?? "",
      category:    body.category   ?? "general" as never,
      agentType:   body.agentType  ?? "general",
      promptText:  body.promptText.trim(),
      tags:        body.tags ?? [],
      createdAt:   Date.now(),
      updatedAt:   Date.now(),
    };

    prompts.unshift(newPrompt); // nyaste först
    await writePrompts(prompts);

    return NextResponse.json(newPrompt, { status: 201 });
  } catch (err) {
    console.error("[api/prompts POST]", err);
    return NextResponse.json({ error: "Kunde inte spara prompt" }, { status: 500 });
  }
}

// PUT /api/prompts — uppdatera befintlig
export async function PUT(req: NextRequest) {
  try {
    const body = await req.json() as Partial<Prompt> & { id: string };

    if (!body.id) {
      return NextResponse.json({ error: "ID krävs" }, { status: 400 });
    }

    const prompts = await readPrompts();
    const idx = prompts.findIndex((p) => p.id === body.id);

    if (idx === -1) {
      return NextResponse.json({ error: "Prompt hittades inte" }, { status: 404 });
    }

    prompts[idx] = { ...prompts[idx], ...body, updatedAt: Date.now() };
    await writePrompts(prompts);

    return NextResponse.json(prompts[idx]);
  } catch (err) {
    console.error("[api/prompts PUT]", err);
    return NextResponse.json({ error: "Kunde inte uppdatera prompt" }, { status: 500 });
  }
}

// DELETE /api/prompts?id=xxx — ta bort
export async function DELETE(req: NextRequest) {
  try {
    const id = req.nextUrl.searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "ID krävs" }, { status: 400 });
    }

    const prompts = await readPrompts();
    const filtered = prompts.filter((p) => p.id !== id);

    if (filtered.length === prompts.length) {
      return NextResponse.json({ error: "Prompt hittades inte" }, { status: 404 });
    }

    await writePrompts(filtered);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[api/prompts DELETE]", err);
    return NextResponse.json({ error: "Kunde inte ta bort prompt" }, { status: 500 });
  }
}
