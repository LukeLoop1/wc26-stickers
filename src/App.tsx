import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import stickersData from "./data/stickers.json";
import teamsData from "./data/teams.json";
import type { Collection, Sticker, Team } from "./lib/types";
import { countHave, cycle, keyOf, stateOf } from "./lib/collection";
import { loadCollection, saveCollection } from "./lib/storage";
import { AlbumPager } from "./components/AlbumPager";

const stickers = stickersData as unknown as Sticker[];
const teams = (teamsData as unknown as Team[]).slice().sort((a, b) => a.page - b.page);
const allKeys = stickers.map((s) => keyOf(s.code, s.num));

const PAGE_KEY = "wc26-page";
const LAST_BACKUP_KEY = "wc26-last-backup";
const CHANGES_KEY = "wc26-changes-since-backup";

interface Toast {
  msg: string;
  undo?: Collection;
}

export default function App() {
  const [collection, setCollection] = useState<Collection>(() => loadCollection(localStorage));
  const [page, setPage] = useState(() => {
    const p = Number(localStorage.getItem(PAGE_KEY));
    return Number.isInteger(p) && p >= 0 && p < teams.length ? p : 0;
  });
  const [overlay, setOverlay] = useState<"none" | "wall" | "export">("none");
  const [toast, setToast] = useState<Toast | null>(null);
  const toastTimer = useRef<number | undefined>(undefined);

  // Fix 1: latest-value ref to avoid stale closure in handleTap
  const latestCollection = useRef(collection);
  useEffect(() => { latestCollection.current = collection; }, [collection]);

  const stickersByCode = useMemo(() => {
    const m = new Map<string, Sticker[]>();
    for (const s of stickers) {
      if (!m.has(s.code)) m.set(s.code, []);
      m.get(s.code)!.push(s);
    }
    for (const arr of m.values()) arr.sort((a, b) => a.num - b.num);
    return m;
  }, []);

  useEffect(() => saveCollection(localStorage, collection), [collection]);
  useEffect(() => localStorage.setItem(PAGE_KEY, String(page)), [page]);
  useEffect(() => {
    document
      .querySelector('meta[name="theme-color"]')
      ?.setAttribute("content", teams[page]?.colors.primary ?? "#ffffff");
  }, [page]);

  function showToast(t: Toast) {
    window.clearTimeout(toastTimer.current);
    setToast(t);
    toastTimer.current = window.setTimeout(() => setToast(null), 4000);
  }

  // Fix 3: wrap in useCallback; safe because all state is accessed via refs or stable setters
  const handleTap = useCallback((key: string, label: string) => {
    // Fix 1: read from ref so rapid back-to-back taps always see the latest state
    const prev = latestCollection.current;
    const next = cycle(prev, key);
    setCollection(next);
    latestCollection.current = next; // sync ref immediately for any tap in the same frame

    showToast({ msg: `${label} → ${stateOf(next, key)}`, undo: prev });

    // Backup nudge: every 10th change if last backup > 7 days ago (or never)
    const changes = Number(localStorage.getItem(CHANGES_KEY) ?? 0) + 1;
    localStorage.setItem(CHANGES_KEY, String(changes));
    const last = Number(localStorage.getItem(LAST_BACKUP_KEY) ?? 0);
    const stale = Date.now() - last > 7 * 24 * 60 * 60 * 1000;
    if (changes % 10 === 0 && stale) {
      window.setTimeout(
        () => showToast({ msg: "📦 Lots of changes — consider a backup (export screen)" }),
        4200,
      );
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // empty dep list intentional: all mutable state accessed via latestCollection ref

  const totalHave = countHave(collection, allKeys);

  return (
    <>
      <AlbumPager
        teams={teams}
        stickersByCode={stickersByCode}
        collection={collection}
        page={page}
        onTap={handleTap}
        onPageChange={setPage}
      />

      <nav className="bottom-bar">
        <button aria-label="Jump to team" aria-expanded={overlay === "wall"} onClick={() => setOverlay("wall")}>⊞</button>
        <span className="overall">{totalHave}/{stickers.length}</span>
        <button aria-label="Export and backup" aria-expanded={overlay === "export"} onClick={() => setOverlay("export")}>↗</button>
      </nav>

      {/* BadgeWall overlay — Task 10 */}
      {/* ExportSheet overlay — Task 11 */}

      {toast && (
        <div className="toast" role="status">
          <span>{toast.msg}</span>
          {toast.undo && (
            <button
              onClick={() => {
                latestCollection.current = toast.undo!;
                setCollection(toast.undo!);
                setToast(null);
              }}
            >
              UNDO
            </button>
          )}
        </div>
      )}
    </>
  );
}
