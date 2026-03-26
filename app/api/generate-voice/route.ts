import { NextRequest, NextResponse } from "next/server";
import { exec } from "child_process";
import { promisify } from "util";
import { mkdir, writeFile, unlink, access } from "fs/promises";
import path from "path";
import os from "os";

const execAsync = promisify(exec);

/**
 * Build the list of Python executables to try, newest first.
 * On Windows we probe the standard per-user install paths directly so
 * we always land on the Python that has the user's packages (soundfile,
 * kokoro-onnx) even when Next.js dev-server inherits a stripped PATH.
 */
async function pythonCandidates(): Promise<string[]> {
  const candidates: string[] = [];

  if (process.platform === "win32") {
    const base = process.env.USERPROFILE ?? "C:\\Users\\Default";
    const root = path.join(base, "AppData", "Local", "Programs", "Python");

    // Try Python 3.14 → 3.10 in descending order
    for (const ver of ["Python314", "Python313", "Python312", "Python311", "Python310"]) {
      const exe = path.join(root, ver, "python.exe");
      try {
        await access(exe); // throws if file doesn't exist
        candidates.push(exe);
      } catch {
        // not installed, skip
      }
    }
  }

  // Generic names as final fallbacks (work on macOS/Linux, and on Windows
  // when the launcher / python are actually in PATH)
  candidates.push("py", "python", "python3");

  return candidates;
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
    const filename = `${timestamp}.wav`;
    const audioDir = path.join(process.cwd(), "public", "audio");

    await mkdir(audioDir, { recursive: true });

    // Write text to a temp file — avoids shell arg-length & escaping issues
    tmpFile = path.join(os.tmpdir(), `tts_${timestamp}.txt`);
    await writeFile(tmpFile, text, "utf8");

    const scriptPath = path.join(process.cwd(), "scripts", "tts.py");
    const candidates  = await pythonCandidates();
    let   lastError: Error | null = null;

    for (const python of candidates) {
      try {
        // Full paths need quoting; bare names (py, python3) do not
        const exe = python.includes(" ") || python.includes("\\")
          ? `"${python}"`
          : python;

        await execAsync(
          `${exe} "${scriptPath}" "${tmpFile}" "${timestamp}"`,
          { cwd: process.cwd(), timeout: 120_000 }
        );

        // Success
        return NextResponse.json({ success: true, filename });
      } catch (err) {
        const e = err instanceof Error ? err : new Error(String(err));
        lastError = e;

        // Only skip to the next candidate when the OS couldn't find the
        // executable at all (Node throws with code ENOENT).  Any other
        // failure means Python ran and the script itself crashed — stop
        // immediately so the real error reaches the client.
        const code = (e as NodeJS.ErrnoException).code;
        if (code === "ENOENT") {
          continue;
        }

        throw e;
      }
    }

    throw (
      lastError ??
      new Error(
        "No Python 3 executable found. " +
        "Install Python 3 from python.org and ensure it is in your PATH."
      )
    );
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    console.error("[generate-voice]", msg);
    return NextResponse.json(
      { error: `TTS failed: ${msg.slice(0, 500)}` },
      { status: 500 }
    );
  } finally {
    if (tmpFile) {
      try { await unlink(tmpFile); } catch { /* ignore */ }
    }
  }
}
