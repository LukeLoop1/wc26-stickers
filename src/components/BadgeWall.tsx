import { useRef, useState, type CSSProperties } from "react";
import type { Collection, Sticker, Team } from "../lib/types";
import { countHave, keyOf } from "../lib/collection";

interface Props {
  teams: Team[]; // sorted by page
  stickersByCode: Map<string, Sticker[]>;
  collection: Collection;
  onJump: (page: number) => void;
  onClose: () => void;
}

export function BadgeWall({ teams, stickersByCode, collection, onJump, onClose }: Props) {
  const [stats, setStats] = useState<string | null>(null);
  const pressTimer = useRef<number | undefined>(undefined);
  const longPressed = useRef(false);

  const progress = (t: Team) => {
    const keys = (stickersByCode.get(t.code) ?? []).map((s) => keyOf(s.code, s.num));
    return { have: countHave(collection, keys), total: keys.length };
  };

  const groups: (string | null)[] = [null, "A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L"];

  return (
    <div className="overlay" role="dialog" aria-label="Jump to team">
      <button className="close" aria-label="Close" onClick={onClose}>✕</button>
      <h2>Jump to…</h2>
      {groups.map((g) => {
        const members = teams.filter((t) => t.group === g);
        if (members.length === 0) return null;
        return (
          <div key={g ?? "specials"}>
            <div className="wall-group-label">{g ? `Group ${g}` : "Specials"}</div>
            <div className="wall-grid">
              {members.map((t) => {
                const { have, total } = progress(t);
                return (
                  <button
                    key={t.code}
                    className={`crest${have === total && total > 0 ? " complete" : ""}`}
                    style={{ "--crest-color": t.colors.primary } as CSSProperties}
                    aria-label={`${t.name} ${have}/${total}`}
                    onPointerDown={() => {
                      longPressed.current = false;
                      pressTimer.current = window.setTimeout(() => {
                        longPressed.current = true;
                        setStats(`${t.flag} ${t.name}: ${have}/${total}`);
                      }, 450);
                    }}
                    onPointerUp={() => {
                      window.clearTimeout(pressTimer.current);
                      if (!longPressed.current) onJump(t.page);
                    }}
                    onPointerLeave={() => window.clearTimeout(pressTimer.current)}
                    onPointerCancel={() => {
                      window.clearTimeout(pressTimer.current);
                      // touch turned into a scroll — suppress the jump on pointerup
                      longPressed.current = true;
                    }}
                    onContextMenu={(e) => e.preventDefault()}
                  >
                    {t.flag}
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}
      {stats && <div className="wall-stats">{stats}</div>}
    </div>
  );
}
