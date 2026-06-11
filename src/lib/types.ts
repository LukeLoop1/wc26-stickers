export type StickerType = "player" | "badge" | "team_photo" | "special";

export interface Sticker {
  code: string;
  num: number;
  name: string;
  type: StickerType;
}

export interface TeamColors {
  primary: string;
  secondary: string;
  accent: string;
}

export interface Team {
  code: string;
  name: string;
  group: string | null; // null = special section (FWC, Coca-Cola)
  flag: string;         // emoji
  colors: TeamColors;
  page: number;         // album page order
}

export type SlotState = "need" | "have" | "spare";

/** Flat collection map; absent key = "need". Key format: `${code}-${num}`. */
export type Collection = Record<string, "have" | "spare">;
