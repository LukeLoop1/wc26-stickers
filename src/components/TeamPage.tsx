import { memo, type CSSProperties } from "react";
import type { Collection, Sticker, Team } from "../lib/types";
import { countHave, keyOf, stateOf } from "../lib/collection";
import { StickerSlot } from "./StickerSlot";

interface Props {
  team: Team;
  stickers: Sticker[];
  collection: Collection;
  onTap: (key: string, label: string) => void;
}

function onColor(hex: string): string {
  const n = parseInt(hex.slice(1), 16);
  const r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
  // perceived luminance (ITU-R BT.709)
  return 0.2126 * r + 0.7152 * g + 0.0722 * b > 150 ? "#111111" : "#ffffff";
}

export const TeamPage = memo(function TeamPage({ team, stickers, collection, onTap }: Props) {
  const keys = stickers.map((s) => keyOf(s.code, s.num));
  const have = countHave(collection, keys);
  const complete = stickers.length > 0 && have === stickers.length;
  const themeVars = {
    "--team-primary": team.colors.primary,
    "--team-secondary": team.colors.secondary,
    "--team-accent": team.colors.accent,
    "--team-on-primary": onColor(team.colors.primary),
  } as CSSProperties;

  return (
    <section className={`team-page${complete ? " complete" : ""}`} style={themeVars}>
      <header className="team-header">
        <span className="team-flag">{team.flag}</span>
        <h2>{team.name}</h2>
        {team.group && <span className="team-group">Group {team.group}</span>}
        <div className="team-progress">
          <span>{have}/{stickers.length}</span>
          <div className="bar">
            <div className="bar-fill" style={{ width: `${stickers.length > 0 ? (have / stickers.length) * 100 : 0}%` }} />
          </div>
        </div>
      </header>
      <div className="slot-grid">
        {stickers.map((s) => {
          const k = keyOf(s.code, s.num);
          return (
            <StickerSlot
              key={k}
              sticker={s}
              state={stateOf(collection, k)}
              onTap={() => onTap(k, `${s.code} ${s.num === 0 ? "00" : s.num}`)}
            />
          );
        })}
      </div>
    </section>
  );
});
