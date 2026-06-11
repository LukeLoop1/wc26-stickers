import { describe, expect, it } from "vitest";
import { loadCollection, saveCollection, STORAGE_KEY } from "./storage";

function fakeStorage(initial: Record<string, string> = {}) {
  const map = new Map(Object.entries(initial));
  return {
    getItem: (k: string) => map.get(k) ?? null,
    setItem: (k: string, v: string) => void map.set(k, v),
  };
}

describe("storage round-trip", () => {
  it("saves and loads", () => {
    const s = fakeStorage();
    saveCollection(s, { "BRA-7": "have" });
    expect(loadCollection(s)).toEqual({ "BRA-7": "have" });
  });
});

describe("loadCollection resilience", () => {
  it("returns empty on missing key", () => {
    expect(loadCollection(fakeStorage())).toEqual({});
  });
  it("returns empty on corrupt JSON", () => {
    expect(loadCollection(fakeStorage({ [STORAGE_KEY]: "{oops" }))).toEqual({});
  });
  it("drops invalid values, keeps valid ones", () => {
    const s = fakeStorage({
      [STORAGE_KEY]: JSON.stringify({ "BRA-7": "have", "ARG-1": "banana" }),
    });
    expect(loadCollection(s)).toEqual({ "BRA-7": "have" });
  });
});
