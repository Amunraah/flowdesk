import urllib.request
import os

print("Laddar ner AI-modeller...")

if not os.path.exists("models"):
    os.makedirs("models")
    print("Skapade mappen models")

url1 = "https://github.com/thewh1teagle/kokoro-onnx/releases/download/model-files-v1.0/kokoro-v0_19.onnx"
fil1 = "models/kokoro-v0_19.onnx"

print("Laddar ner kokoro-v0_19.onnx...")
urllib.request.urlretrieve(url1, fil1)
print("Klar!")

url2 = "https://github.com/thewh1teagle/kokoro-onnx/releases/download/model-files-v1.0/voices-v1.0.bin"
fil2 = "models/voices.bin"

print("Laddar ner voices.bin...")
urllib.request.urlretrieve(url2, fil2)
print("Klar!")

print("Allt nedladdat!")
