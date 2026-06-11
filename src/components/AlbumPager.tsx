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
      setTimeout(() => (suppress.current = false), 100);
    }
  }, [page]);

  const handleScroll = () => {
    const el = ref.current;
    if (!el || suppress.current) return;
    const current = Math.round(el.scrollLeft / el.clientWidth);
    if (current !== page) onPageChange(current);
  };

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
