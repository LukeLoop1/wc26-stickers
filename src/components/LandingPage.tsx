import { useEffect, useRef } from "react";
import type { Collection, Sticker, Team } from "../lib/types";
import { countHave, keyOf } from "../lib/collection";
import { ProgressRing } from "./ProgressRing";

interface Props {
  teams: Team[];
  stickersByCode: Map<string, Sticker[]>;
  collection: Collection;
  currentPage: number;
  totalHave: number;
  totalAll: number;
  onContinue: () => void;
  onOpenGroup: (group: string) => void;
  onJumpToPage: (page: number) => void;
}

const GROUPS = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L"] as const;

const GROUP_COLORS: Record<string, string> = {
  A: "#26d07c",
  B: "#ff5d5d",
  C: "#ffd34d",
  D: "#5da9ff",
  E: "#c77dff",
  F: "#ff9f45",
  G: "#4dd6c4",
  H: "#f06292",
  I: "#9ccc65",
  J: "#ba8bf5",
  K: "#64b5f6",
  L: "#ef5350",
};

const GOLD = "#d4a24c";

function getGroupProgress(
  group: string,
  teams: Team[],
  stickersByCode: Map<string, Sticker[]>,
  collection: Collection
): { have: number; total: number } {
  const groupTeams = teams.filter((t) => t.group === group);
  let have = 0;
  let total = 0;
  for (const t of groupTeams) {
    const keys = (stickersByCode.get(t.code) ?? []).map((s) => keyOf(s.code, s.num));
    have += countHave(collection, keys);
    total += keys.length;
  }
  return { have, total };
}

function getTeamProgress(
  team: Team,
  stickersByCode: Map<string, Sticker[]>,
  collection: Collection
): { have: number; total: number } {
  const keys = (stickersByCode.get(team.code) ?? []).map((s) => keyOf(s.code, s.num));
  return { have: countHave(collection, keys), total: keys.length };
}

export function LandingPage({
  teams,
  stickersByCode,
  collection,
  currentPage,
  totalHave,
  totalAll,
  onContinue,
  onOpenGroup,
  onJumpToPage,
}: Props) {
  const scrollRef = useRef<HTMLDivElement>(null);

  // Scroll to top when landing page mounts
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: 0 });
  }, []);

  const overallPct = totalAll > 0 ? Math.round((totalHave / totalAll) * 100) : 0;

  const currentTeam = teams.find((t) => t.page === currentPage);
  const currentTeamProg = currentTeam
    ? getTeamProgress(currentTeam, stickersByCode, collection)
    : null;

  const fwcTeam = teams.find((t) => t.code === "FWC");
  const ccTeam = teams.find((t) => t.code === "CC");
  const fwcProg = fwcTeam ? getTeamProgress(fwcTeam, stickersByCode, collection) : null;
  const ccProg = ccTeam ? getTeamProgress(ccTeam, stickersByCode, collection) : null;

  return (
    <div className="landing" ref={scrollRef}>
      {/* Hero */}
      <div className="landing-hero-wrap">
        <div className="landing-hero" aria-label="26">26</div>
        <div className="landing-sub">WORLD CUP ALBUM</div>
      </div>

      {/* Overall ring */}
      <div className="landing-ring-wrap">
        <ProgressRing
          pct={overallPct}
          size={120}
          color={GOLD}
          label={`${totalHave}/${totalAll}`}
          sublabel="COLLECTED"
        />
      </div>

      {/* Continue button */}
      <button className="landing-continue" onClick={onContinue}>
        {currentTeam && currentTeamProg
          ? `▶ Continue — ${currentTeam.flag} ${currentTeam.name} ${currentTeamProg.have}/${currentTeamProg.total}`
          : "▶ Open Album"}
      </button>

      {/* FWC / CC chips */}
      <div className="landing-chips">
        {fwcTeam && fwcProg && (
          <button
            className="landing-chip"
            onClick={() => onJumpToPage(fwcTeam.page)}
            aria-label={`FIFA World Cup stickers ${fwcProg.have}/${fwcProg.total}`}
          >
            🏆 FWC {fwcProg.have}/{fwcProg.total}
          </button>
        )}
        {ccTeam && ccProg && (
          <button
            className="landing-chip"
            onClick={() => onJumpToPage(ccTeam.page)}
            aria-label={`Coca-Cola stickers ${ccProg.have}/${ccProg.total}`}
          >
            🥤 CC {ccProg.have}/{ccProg.total}
          </button>
        )}
      </div>

      {/* Group rings grid */}
      <div className="landing-groups">
        {GROUPS.map((g) => {
          const { have, total } = getGroupProgress(g, teams, stickersByCode, collection);
          const pct = total > 0 ? Math.round((have / total) * 100) : 0;
          const color = pct === 100 ? GOLD : GROUP_COLORS[g] ?? GOLD;
          return (
            <button
              key={g}
              className="landing-group-btn"
              onClick={() => onOpenGroup(g)}
              aria-label={`Group ${g} ${have}/${total}`}
            >
              <ProgressRing pct={pct} size={72} color={color} label={g} />
              <div className="landing-group-count">{have}/{total}</div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
