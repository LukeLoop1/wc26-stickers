import type { Collection } from "./types";

export const STORAGE_KEY = "wc26-collection-v1";

type StorageLike = Pick<Storage, "getItem" | "setItem">;

export function loadCollection(storage: StorageLike): Collection {
  try {
    const raw = storage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return {};
    const out: Collection = {};
    for (const [k, v] of Object.entries(parsed)) {
      if (v === "have" || v === "spare") out[k] = v;
    }
    return out;
  } catch {
    return {};
  }
}

export function saveCollection(storage: StorageLike, c: Collection): void {
  storage.setItem(STORAGE_KEY, JSON.stringify(c));
}
