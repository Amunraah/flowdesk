import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as { text?: string; title?: string };
    const { text, title } = body;

    if (!text) {
      return NextResponse.json({ error: "No text provided" }, { status: 400 });
    }

    const timestamp = Date.now();
    const slug = (title ?? "script")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 50);

    const filename = `${timestamp}-${slug}.txt`;
    const dir = path.join(process.cwd(), "public", "scripts");

    await mkdir(dir, { recursive: true });
    await writeFile(path.join(dir, filename), text, "utf-8");

    return NextResponse.json({ filename });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
