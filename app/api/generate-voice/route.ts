import { NextRequest, NextResponse } from "next/server";
import { exec } from "child_process";
import { promisify } from "util";
import { mkdir, writeFile, unlink } from "fs/promises";
import path from "path";
import os from "os";

const execAsync = promisify(exec);

/** Try running a shell command; resolves on success, rejects on failure. */
async function tryExec(cmd: string, opts: Parameters<typeof execAsync>[1]) {
  return execAsync(cmd, opts);
}

export async function POST(req: NextRequest) {
  let tmpFile: string | null = null;

  try {
    const body = await req.json() as { text?: string };
    const { text } = body;

    if (!text || !text.trim()) {
      return NextResponse.json({ error: "No text provided" }, { status: 400 });
    }

    const timestamp = Date.now();
    // Python saves as .wav (soundfile cannot encode MP3); browser <audio> plays WAV fine
    const filename  = `${timestamp}.wav`;
    const audioDir  = path.join(process.cwd(), "public", "audio");

    await mkdir(audioDir, { recursive: true });

    // Write text to a temp file — avoids shell arg length & escaping issues
    tmpFile = path.join(os.tmpdir(), `tts_${timestamp}.txt`);
    await writeFile(tmpFile, text, "utf8");

    const scriptPath = path.join(process.cwd(), "scripts", "tts.py");

    // Try python executables in order: py (Windows launcher) → python → python3
    const pythonCandidates = ["py", "python", "python3"];
    let lastError: Error | null = null;

    for (const python of pythonCandidates) {
      try {
        // Quote only file paths, not the executable name
        await tryExec(
          `${python} "${scriptPath}" "${tmpFile}" "${timestamp}"`,
          { cwd: process.cwd(), timeout: 120_000 }
        );
        // Success — exit loop
        return NextResponse.json({ success: true, filename });
      } catch (err) {
        const e = err instanceof Error ? err : new Error(String(err));
        lastError = e;

        // ENOENT / "not recognized" / "not found" → this executable isn't available, try next
        const msg = e.message.toLowerCase();
        if (
          msg.includes("enoent") ||
          msg.includes("not found") ||
          msg.includes("not recognized") ||
          msg.includes("cannot find")
        ) {
          continue;
        }

        // Any other error (script crash, import error, etc.) — stop immediately
        throw e;
      }
    }

    // If we reach here, no Python was found
    throw (
      lastError ??
      new Error("No Python executable found. Install Python 3 and ensure it is in your PATH.")
    );
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    console.error("[generate-voice]", msg);
    return NextResponse.json(
      { error: `TTS failed: ${msg.slice(0, 400)}` },
      { status: 500 }
    );
  } finally {
    // Always clean up the temp file
    if (tmpFile) {
      try {
        await unlink(tmpFile);
      } catch {
        // Ignore cleanup errors
      }
    }
  }
}
