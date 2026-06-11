import type { Collection } from "./types";

export function serializeBackup(c: Collection): string {
  return JSON.stringify({ app: "wc26-tracker", version: 1, collection: c }, null, 2);
}

/** Throws with a human-readable message on any problem. Never partially applies. */
export function parseBackup(text: string, validKeys: Set<string>): Collection {
  let obj: unknown;
  try {
    obj = JSON.parse(text);
  } catch {
    throw new Error("That file is not valid JSON.");
  }
  if (!obj || typeof obj !== "object" || (obj as { app?: unknown }).app !== "wc26-tracker") {
    throw new Error("That file is not a WC26 backup.");
  }
  const col = (obj as { collection?: unknown }).collection;
  if (!col || typeof col !== "object" || Array.isArray(col)) {
    throw new Error("Backup contains no collection data.");
  }
  const out: Collection = {};
  for (const [k, v] of Object.entries(col)) {
    if (!validKeys.has(k)) throw new Error(`Unknown sticker key in backup: ${k}`);
    if (v !== "have" && v !== "spare") throw new Error(`Invalid state for ${k}: ${String(v)}`);
    out[k] = v;
  }
  return out;
}
