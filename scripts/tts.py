import sys
import soundfile as sf

text = sys.argv[1]
filename = sys.argv[2]

try:
    import kokoro_onnx
    kokoro = kokoro_onnx.Kokoro("kokoro-v0_19.onnx", "voices.bin")
    samples, sample_rate = kokoro.create(text, voice="af_heart", speed=1.0)
    sf.write(f"public/audio/{filename}.mp3", samples, sample_rate)
    print(f"OK: public/audio/{filename}.mp3")
except Exception as e:
    print(f"Error: {e}", file=sys.stderr)
    sys.exit(1)
