import type { CSSProperties } from "react";
import type { Collection, Sticker, Team } from "../lib/types";
import { countHave, keyOf, stateOf } from "../lib/collection";
import { StickerSlot } from "./StickerSlot";

interface Props {
  team: Team;
  stickers: Sticker[];
  collection: Collection;
  onTap: (key: string, label: string) => void;
}

export function TeamPage({ team, stickers, collection, onTap }: Props) {
  const keys = stickers.map((s) => keyOf(s.code, s.num));
  const have = countHave(collection, keys);
  const complete = have === stickers.length;
  const themeVars = {
    "--team-primary": team.colors.primary,
    "--team-secondary": team.colors.secondary,
    "--team-accent": team.colors.accent,
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
            <div className="bar-fill" style={{ width: `${(have / stickers.length) * 100}%` }} />
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
}
