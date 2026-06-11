import { useEffect, useRef } from "react";
import type { Collection, Sticker, Team } from "../lib/types";
import { TeamPage } from "./TeamPage";

interface Props {
  teams: Team[]; // sorted by page
  stickersByCode: Map<string, Sticker[]>;
  collection: Collection;
  page: number;
  onTap: (key: string, label: string) => void;
  onPageChange: (page: number) => void;
}

export function AlbumPager({ teams, stickersByCode, collection, page, onTap, onPageChange }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const suppress = useRef(false);

  // Jump (initial load or badge-wall navigation): scroll without firing onPageChange churn
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const target = page * el.clientWidth;
    if (Math.abs(el.scrollLeft - target) > 2) {
      suppress.current = true;
      el.scrollTo({ left: target, behavior: "instant" as ScrollBehavior });
      setTimeout(() => (suppress.current = false), 400); // Fix 4: 400ms for iOS Safari late momentum events
    }
  }, [page]);

  // Fix 2: realign on orientation/resize so the snap position stays correct
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const realign = () => {
      suppress.current = true;
      el.scrollTo({ left: page * el.clientWidth, behavior: "instant" as ScrollBehavior });
      window.setTimeout(() => (suppress.current = false), 400);
    };
    window.addEventListener("resize", realign);
    return () => window.removeEventListener("resize", realign);
  }, [page]);

  const handleScroll = () => {
    const el = ref.current;
    if (!el || suppress.current) return;
    const current = Math.round(el.scrollLeft / el.clientWidth);
    if (current !== page) onPageChange(current);
  };

  // NOTE: collection prop changes per tap; deeper memoization deferred until profiling shows jank
  return (
    <div className="pager" ref={ref} onScroll={handleScroll}>
      {teams.map((team) => (
        <TeamPage
          key={team.code}
          team={team}
          stickers={stickersByCode.get(team.code) ?? []}
          collection={collection}
          onTap={onTap}
        />
      ))}
    </div>
  );
}
