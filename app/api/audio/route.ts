import { NextResponse } from "next/server";
import { readdir, stat } from "fs/promises";
import path from "path";

export async function GET() {
  const dir = path.join(process.cwd(), "public", "audio");

  try {
    const files = await readdir(dir);
    const mp3s  = files.filter((f) => f.endsWith(".mp3"));

    const results = await Promise.all(
      mp3s.map(async (filename) => {
        const s = await stat(path.join(dir, filename));
        return { filename, created: s.birthtimeMs };
      })
    );

    results.sort((a, b) => b.created - a.created);
    return NextResponse.json(results);
  } catch {
    // Directory doesn't exist yet — return empty list
    return NextResponse.json([]);
  }
}
