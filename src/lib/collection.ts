import type { Collection, SlotState } from "./types";

export const keyOf = (code: string, num: number): string => `${code}-${num}`;

export function stateOf(c: Collection, key: string): SlotState {
  return c[key] ?? "need";
}

/** Immutable need → have → spare → need cycle. */
export function cycle(c: Collection, key: string): Collection {
  const next = { ...c };
  switch (stateOf(c, key)) {
    case "need":
      next[key] = "have";
      break;
    case "have":
      next[key] = "spare";
      break;
    case "spare":
      delete next[key];
      break;
  }
  return next;
}

/** Owned = have or spare. */
export function countHave(c: Collection, keys: string[]): number {
  return keys.filter((k) => stateOf(c, k) !== "need").length;
}
