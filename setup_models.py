from pathlib import Path

import requests


def download_file(url: str, filepath: Path, chunk_size: int = 8192) -> None:
    """Laddar ner en fil med streaming till given sökväg."""
    filepath.parent.mkdir(parents=True, exist_ok=True)

    # Om filen redan finns antar vi att den är klar.
    if filepath.exists():
        print(f"OK: {filepath.name} finns redan")
        return

    print(f"INFO: Laddar ner {filepath.name}...")
    headers = {
        # En enkel User-Agent gör att vissa värdar blir mindre “hårda”.
        "User-Agent": "flowdesk-setup-models/1.0",
    }
    with requests.get(url, stream=True, timeout=60, headers=headers) as response:
        response.raise_for_status()
        with open(filepath, "wb") as f:
            for chunk in response.iter_content(chunk_size=chunk_size):
                if chunk:
                    f.write(chunk)
    print(f"OK: Klar med {filepath.name}")


def download_first_match(urls: list[str], filepath: Path) -> None:
    """
    Försök ladda ner från flera URL:er tills en fungerar.
    Detta hanterar att upstream-releaser kan flyttas mellan taggar.
    """
    if filepath.exists():
        print(f"OK: {filepath.name} finns redan")
        return

    last_error: Exception | None = None
    for url in urls:
        try:
            download_file(url=url, filepath=filepath)
            return
        except requests.exceptions.HTTPError as e:
            last_error = e
            print(f"WARN: Kunde inte hämta ({filepath.name}) från: {url}")

    raise RuntimeError(
        f"Kunde inte ladda ner {filepath.name} från någon av URL:erna. Sista fel: {last_error}"
    )


def main() -> None:
    base_path = Path(r"C:\Users\Slarv\flowdesk")
    # `scripts/tts.py` letar i projektets rotmapp (inte i `models/`).
    model_path = base_path / "kokoro-v0_19.onnx"
    voices_path = base_path / "voices.bin"

    kokoro_urls = [
        # URL som appen själv föreslår.
        "https://github.com/thewh1teagle/kokoro-onnx/releases/download/model-files-v1.0/kokoro-v0_19.onnx",
        # Vanligast fungerande tagg i releasen.
        "https://github.com/thewh1teagle/kokoro-onnx/releases/download/model-files/kokoro-v0_19.onnx",
    ]

    voices_urls = [
        # Appens rekommenderade sätt (rätt bin, men vi sparar alltid som `voices.bin`).
        "https://github.com/thewh1teagle/kokoro-onnx/releases/download/model-files-v1.0/voices-v1.0.bin",
        # Ibland finns den redan publicerad som `voices.bin`.
        "https://github.com/thewh1teagle/kokoro-onnx/releases/download/model-files/voices.bin",
        # Fallback om namn skiljer sig.
        "https://github.com/thewh1teagle/kokoro-onnx/releases/download/model-files/voices-v1.0.bin",
    ]

    download_first_match(urls=kokoro_urls, filepath=model_path)
    download_first_match(urls=voices_urls, filepath=voices_path)

    print("KLAR: Alla filer nedladdade!")


if __name__ == "__main__":
    # Windows kan bli “tyst” om import/skript körs fel; main ger tydlig exit.
    main()

