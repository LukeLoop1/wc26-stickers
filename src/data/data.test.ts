import { describe, expect, it } from "vitest";
import stickersData from "./stickers.json";
import teamsData from "./teams.json";
import type { Sticker, Team } from "../lib/types";

const stickers = stickersData as Sticker[];
const teams = teamsData as Team[];

describe("dataset integrity", () => {
  it("has a plausible total", () => {
    expect(stickers.length).toBeGreaterThanOrEqual(980);
    expect(stickers.length).toBeLessThanOrEqual(995);
  });

  it("has unique keys", () => {
    const keys = new Set(stickers.map((s) => `${s.code}-${s.num}`));
    expect(keys.size).toBe(stickers.length);
  });

  it("covers every sticker code with a team entry, and vice versa", () => {
    const stickerCodes = new Set(stickers.map((s) => s.code));
    const teamCodes = new Set(teams.map((t) => t.code));
    expect([...stickerCodes].filter((c) => !teamCodes.has(c))).toEqual([]);
    expect([...teamCodes].filter((c) => !stickerCodes.has(c))).toEqual([]);
  });

  it("gives every group team exactly 20 stickers numbered 1-20", () => {
    for (const t of teams.filter((t) => t.group !== null)) {
      const nums = stickers
        .filter((s) => s.code === t.code)
        .map((s) => s.num)
        .sort((a, b) => a - b);
      expect(nums, t.code).toEqual(Array.from({ length: 20 }, (_, i) => i + 1));
    }
  });

  it("has 48 teams + 2 special sections with unique contiguous pages", () => {
    expect(teams.filter((t) => t.group !== null)).toHaveLength(48);
    expect(teams.filter((t) => t.group === null)).toHaveLength(2);
    const pages = teams.map((t) => t.page).sort((a, b) => a - b);
    expect(pages).toEqual(Array.from({ length: 50 }, (_, i) => i));
  });
});
