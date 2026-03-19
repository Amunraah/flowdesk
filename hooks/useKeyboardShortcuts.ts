"use client";

// Globala tangentbordsgenvägar för Flowdesk
// Ctrl+E = Quick Enhance, Ctrl+K = Command Palette, Ctrl+S = Spara (i modal)

import { useEffect } from "react";

type ShortcutMap = {
  onQuickEnhance?:    () => void; // Ctrl+E
  onCommandPalette?:  () => void; // Ctrl+K
  onSave?:            () => void; // Ctrl+S
};

export function useKeyboardShortcuts({
  onQuickEnhance,
  onCommandPalette,
  onSave,
}: ShortcutMap) {
  useEffect(() => {
    function handler(e: KeyboardEvent) {
      // Ignorera om användaren skriver i input/textarea (förutom Ctrl+S)
      const tag = (e.target as HTMLElement).tagName;
      const inInput = tag === "INPUT" || tag === "SELECT";

      if (e.ctrlKey && e.key === "e" && !e.shiftKey && !e.altKey) {
        e.preventDefault();
        onQuickEnhance?.();
      }

      if (e.ctrlKey && e.key === "k" && !e.shiftKey && !e.altKey) {
        if (!inInput) {
          e.preventDefault();
          onCommandPalette?.();
        }
      }

      if (e.ctrlKey && e.key === "s" && !e.shiftKey && !e.altKey) {
        // Spara — tillåts även i textarea (förhindrar webbläsarens "spara sida")
        const inTextarea = tag === "TEXTAREA";
        if (inTextarea || !inInput) {
          e.preventDefault();
          onSave?.();
        }
      }
    }

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onQuickEnhance, onCommandPalette, onSave]);
}
