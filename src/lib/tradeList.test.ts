import { describe, expect, it } from "vitest";
import { tradeListText } from "./tradeList";
import type { Collection, Sticker } from "./types";

const stickers: Sticker[] = [
  { code: "ARG", num: 1, name: "Badge", type: "badge" },
  { code: "ARG", num: 2, name: "Player A", type: "player" },
  { code: "BRA", num: 1, name: "Badge", type: "badge" },
  { code: "BRA", num: 2, name: "Player B", type: "player" },
  { code: "FWC", num: 0, name: "Panini", type: "special" },
];
const order = ["FWC", "ARG", "BRA"];

describe("tradeListText", () => {
  it("groups need and spares by section in album order", () => {
    const c: Collection = { "ARG-1": "have", "BRA-2": "spare" };
    const text = tradeListText(c, stickers, order);
    expect(text).toBe("WC26 — Need: FWC 00 · ARG 2 · BRA 1\nSpares: BRA 2");
  });
  it("handles complete collection", () => {
    const c: Collection = {
      "ARG-1": "have", "ARG-2": "have",
      "BRA-1": "have", "BRA-2": "have",
      "FWC-0": "have",
    };
    expect(tradeListText(c, stickers, order)).toBe(
      "WC26 — Need: none 🎉\nSpares: none",
    );
  });
});
