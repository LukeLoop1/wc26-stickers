import { describe, expect, it } from "vitest";
import { parseBackup, serializeBackup } from "./backup";
import type { Collection } from "./types";

const validKeys = new Set(["BRA-7", "ARG-1"]);

describe("backup round-trip", () => {
  it("serializes and parses back", () => {
    const c: Collection = { "BRA-7": "spare" };
    expect(parseBackup(serializeBackup(c), validKeys)).toEqual(c);
  });
});

describe("parseBackup rejects bad input without partial application", () => {
  it("rejects non-JSON", () => {
    expect(() => parseBackup("not json", validKeys)).toThrow(/JSON/);
  });
  it("rejects foreign JSON files", () => {
    expect(() => parseBackup('{"foo": 1}', validKeys)).toThrow(/backup/i);
  });
  it("rejects unknown sticker keys", () => {
    const text = serializeBackup({ "XXX-99": "have" } as Collection);
    expect(() => parseBackup(text, validKeys)).toThrow(/XXX-99/);
  });
  it("rejects invalid states", () => {
    const text = JSON.stringify({
      app: "wc26-tracker",
      version: 1,
      collection: { "BRA-7": "banana" },
    });
    expect(() => parseBackup(text, validKeys)).toThrow(/BRA-7/);
  });
});
