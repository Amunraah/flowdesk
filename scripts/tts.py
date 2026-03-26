import sys
import os
import soundfile as sf

# argv[1] = path to a temp file containing the text to synthesize
# argv[2] = output base name (timestamp, no extension)
text_file = sys.argv[1]
filename  = sys.argv[2]

try:
    with open(text_file, "r", encoding="utf-8") as f:
        text = f.read().strip()

    if not text:
        print("Error: text file is empty", file=sys.stderr)
        sys.exit(1)

    script_dir   = os.path.dirname(os.path.abspath(__file__))
    project_root = os.path.dirname(script_dir)

    # Search for model files: project root first (original location), then scripts/
    def find_file(name: str) -> str:
        for d in [project_root, script_dir]:
            p = os.path.join(d, name)
            if os.path.exists(p):
                return p
        # Return project-root path so the missing-file error is obvious
        return os.path.join(project_root, name)

    model_path = find_file("kokoro-v0_19.onnx")
    voice_path = find_file("voices.bin")

    # soundfile (libsndfile) cannot encode MP3 — save as WAV which always works
    output_dir  = os.path.join(project_root, "public", "audio")
    output_path = os.path.join(output_dir, f"{filename}.wav")

    os.makedirs(output_dir, exist_ok=True)

    import kokoro_onnx
    kokoro = kokoro_onnx.Kokoro(model_path, voice_path)
    samples, sample_rate = kokoro.create(text, voice="af_heart", speed=1.0)
    sf.write(output_path, samples, sample_rate)

    print(f"OK:{output_path}")

except Exception as e:
    print(f"Error: {e}", file=sys.stderr)
    sys.exit(1)
