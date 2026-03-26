import { NextResponse } from "next/server";
import { readdir, readFile, stat, mkdir } from "fs/promises";
import path from "path";

export async function GET() {
  const dir = path.join(process.cwd(), "public", "scripts");

  try {
    // Create the folder if it doesn't exist yet
    await mkdir(dir, { recursive: true });

    const files = await readdir(dir);
    const txts  = files.filter((f) => f.endsWith(".txt"));

    const results = await Promise.all(
      txts.map(async (filename) => {
        const filePath = path.join(dir, filename);
        const [s, content] = await Promise.all([
          stat(filePath),
          readFile(filePath, "utf8"),
        ]);
        return { filename, content, created: s.birthtimeMs };
      })
    );

    results.sort((a, b) => b.created - a.created);
    return NextResponse.json(results);
  } catch (err) {
    console.error("[scripts]", err);
    return NextResponse.json([]);
  }
}
