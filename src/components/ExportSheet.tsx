import { useRef, useState } from "react";
import type { Collection, Sticker } from "../lib/types";
import { tradeListText } from "../lib/tradeList";
import { parseBackup, serializeBackup } from "../lib/backup";

interface Props {
  collection: Collection;
  stickers: Sticker[];
  sectionOrder: string[]; // team codes in album page order
  validKeys: Set<string>;
  onRestore: (c: Collection) => void;
  onBackedUp: () => void;
  onClose: () => void;
}

export function ExportSheet({
  collection, stickers, sectionOrder, validKeys, onRestore, onBackedUp, onClose,
}: Props) {
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  async function copyTradeList() {
    const text = tradeListText(collection, stickers, sectionOrder);
    try {
      await navigator.clipboard.writeText(text);
      setStatus("Trade list copied — paste it anywhere 📋");
    } catch {
      // Clipboard API can fail outside secure contexts; show the text instead
      window.prompt("Copy your trade list:", text);
    }
  }

  function downloadBackup() {
    const blob = new Blob([serializeBackup(collection)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `wc26-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
    onBackedUp();
    setStatus("Backup downloaded ✓");
  }

  async function restore(file: File) {
    setError(null);
    try {
      const restored = parseBackup(await file.text(), validKeys);
      onRestore(restored);
      setStatus("Backup restored ✓");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not read that file.");
    }
  }

  return (
    <div className="overlay" role="dialog" aria-label="Export and backup">
      <button className="close" aria-label="Close" onClick={onClose}>✕</button>
      <h2>Trade & Backup</h2>
      <button className="sheet-btn" onClick={copyTradeList}>📋 Copy missing & spares list</button>
      <button className="sheet-btn" onClick={downloadBackup}>💾 Download backup</button>
      <button className="sheet-btn" onClick={() => fileInput.current?.click()}>📥 Restore backup…</button>
      <input
        ref={fileInput}
        type="file"
        accept="application/json"
        hidden
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) void restore(f);
          e.target.value = "";
        }}
      />
      {status && <p style={{ marginTop: 8, fontSize: 13 }}>{status}</p>}
      {error && <p className="sheet-error">⚠ {error}</p>}
    </div>
  );
}
