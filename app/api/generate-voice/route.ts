import { NextRequest, NextResponse } from "next/server";
import { exec } from "child_process";
import { promisify } from "util";
import { mkdir } from "fs/promises";
import path from "path";

const execAsync = promisify(exec);

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as { text?: string };
    const { text } = body;

    if (!text || !text.trim()) {
      return NextResponse.json({ error: "No text provided" }, { status: 400 });
    }

    const timestamp = Date.now();
    const filename  = `${timestamp}.mp3`;
    const audioDir  = path.join(process.cwd(), "public", "audio");

    await mkdir(audioDir, { recursive: true });

    const scriptPath  = path.join(process.cwd(), "scripts", "tts.py");
    // Strip newlines and escape double-quotes for shell safety
    const safeText = text
      .replace(/\r?\n/g, " ")
      .replace(/"/g, '\\"')
      .slice(0, 4000); // hard cap to avoid shell-limit issues

    await execAsync(`python "${scriptPath}" "${safeText}" "${timestamp}"`, {
      cwd:     process.cwd(),
      timeout: 120_000, // 2-minute timeout
    });

    return NextResponse.json({ filename });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    console.error("[generate-voice]", msg);
    return NextResponse.json(
      { error: `TTS failed: ${msg.slice(0, 300)}` },
      { status: 500 }
    );
  }
}
