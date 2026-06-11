import type { Collection, Sticker, SlotState } from "./types";
import { keyOf, stateOf } from "./collection";

const numLabel = (n: number) => (n === 0 ? "00" : String(n));

function sectionList(
  collection: Collection,
  stickers: Sticker[],
  sectionOrder: string[],
  want: SlotState,
): string {
  return sectionOrder
    .map((code) => {
      const nums = stickers
        .filter(
          (s) =>
            s.code === code &&
            stateOf(collection, keyOf(s.code, s.num)) === want,
        )
        .sort((a, b) => a.num - b.num)
        .map((s) => numLabel(s.num))
        .join(", ");
      return nums ? `${code} ${nums}` : null;
    })
    .filter(Boolean)
    .join(" · ");
}

export function tradeListText(
  collection: Collection,
  stickers: Sticker[],
  sectionOrder: string[],
): string {
  const need = sectionList(collection, stickers, sectionOrder, "need");
  const spares = sectionList(collection, stickers, sectionOrder, "spare");
  return `WC26 — Need: ${need || "none 🎉"}\nSpares: ${spares || "none"}`;
}
