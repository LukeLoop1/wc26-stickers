import type { Sticker, SlotState } from "../lib/types";

interface Props {
  sticker: Sticker;
  state: SlotState;
  onTap: () => void;
}

export function StickerSlot({ sticker, state, onTap }: Props) {
  const foil = sticker.type === "badge" || sticker.type === "special";
  const label = sticker.num === 0 ? "00" : String(sticker.num);
  return (
    <button
      className={`slot slot-${state}${foil ? " slot-foil" : ""}`}
      onClick={onTap}
      aria-label={`${sticker.code} ${label} ${sticker.name}: ${state}`}
      title={sticker.name}
    >
      <span>{label}</span>
    </button>
  );
}
