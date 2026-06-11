# WC26 Panini Sticker Tracker Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A mobile-first, offline-capable PWA that tracks Lucas's Panini WC26 (NA edition) sticker collection as a page-flip digital album with per-team theming.

**Architecture:** Vite + React + TypeScript SPA. Static album data (`stickers.json`, `teams.json`) is baked into the build; collection state is a flat `{ "BRA-7": "have" | "spare" }` map in localStorage. Pure-TS logic modules (cycle/counts/trade-list/backup) are unit-tested with Vitest; components are verified by hand on the phone. Deployed to GitHub Pages via Actions.

**Tech Stack:** Vite, React 18, TypeScript, Vitest, vite-plugin-pwa, GitHub Pages/Actions.

**Spec:** `docs/superpowers/specs/2026-06-11-wc26-sticker-tracker-design.md`

---

## File Structure

```
package.json / vite.config.ts / tsconfig.json / index.html
scripts/
  build-stickers.mjs        # transforms raw community dataset → src/data/stickers.json
src/
  main.tsx                  # React mount
  App.tsx                   # state owner: collection, page, overlays, toast, nudge
  data/stickers.json        # 992-ish entries (generated, committed)
  data/teams.json           # 48 teams + FWC + Coca-Cola sections (hand-authored)
  data/data.test.ts         # dataset integrity tests
  lib/types.ts              # shared types
  lib/collection.ts         # keyOf, stateOf, cycle, countHave (+ tests)
  lib/storage.ts            # localStorage load/save (+ tests)
  lib/tradeList.ts          # WhatsApp trade text (+ tests)
  lib/backup.ts             # backup serialize/parse-validate (+ tests)
  components/AlbumPager.tsx # scroll-snap pager
  components/TeamPage.tsx   # themed page: header + slot grid
  components/StickerSlot.tsx# tappable cell
  components/BadgeWall.tsx  # jump-menu overlay
  components/ExportSheet.tsx# trade list / backup / restore
  index.css                 # all styles incl. theming variables
public/icon.svg             # app icon source
.github/workflows/deploy.yml
```

Album page order: page 0 = FWC intro (includes the Panini `00` slot as `FWC-0`), page 1 = Coca-Cola (`C1`–`C12`), pages 2–49 = teams by group A–L in draw order.

---

### Task 1: Scaffold the project

**Files:**
- Create: Vite scaffold at repo root (`package.json`, `vite.config.ts`, `tsconfig.json`, `index.html`, `src/main.tsx`, `src/App.tsx`, `src/index.css`)
- Modify: `.gitignore`

- [ ] **Step 1: Scaffold Vite React-TS into the existing directory**

```bash
cd /Users/lucasdrumond/Documents/Claude/Projects/Stickers
npm create vite@latest . -- --template react-ts
npm install
npm install -D vitest
```

(If `npm create vite` refuses a non-empty dir, scaffold into `tmp-scaffold/`, move its contents up, delete `tmp-scaffold/`. Keep existing `docs/`, `RESEARCH.md`, `.gitignore` contents — append Vite's `.gitignore` entries to ours.)

- [ ] **Step 2: Replace `vite.config.ts`**

```ts
/// <reference types="vitest/config" />
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  // IMPORTANT: must match the GitHub repo name used in Task 13
  base: "/wc26-stickers/",
  plugins: [react()],
  test: {
    environment: "node",
  },
});
```

- [ ] **Step 3: Add test script to `package.json`**

In `"scripts"`, add: `"test": "vitest"`.

- [ ] **Step 4: Strip the scaffold demo**

Replace `src/App.tsx` with:

```tsx
export default function App() {
  return <h1>WC26 Album</h1>;
}
```

Delete `src/App.css`, `src/assets/react.svg`, `public/vite.svg`. Empty out `src/index.css` (Task 8 fills it). In `index.html`, set `<title>WC26 Album</title>`, add `<meta name="theme-color" content="#ffffff">`, and ensure the viewport meta is `<meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover">`.

- [ ] **Step 5: Verify dev server and build run**

Run: `npm run build` — Expected: builds with no errors.
Run: `npm run dev` — Expected: page shows "WC26 Album". Stop the server.

- [ ] **Step 6: Commit**

```bash
git add -A && git commit -m "chore: scaffold Vite + React + TypeScript + Vitest"
```

---

### Task 2: Sticker dataset

**Files:**
- Create: `scripts/build-stickers.mjs`, `src/data/stickers.json` (generated)

- [ ] **Step 1: Download the community dataset**

```bash
mkdir -p scripts
curl -fL -o scripts/raw-stickers.json \
  https://raw.githubusercontent.com/phegde19/2026-World-Cup-Sticker-Tracker/main/src/data/stickers.json
head -c 500 scripts/raw-stickers.json
```

Expected: JSON array of objects shaped like `{"Code": "ARG1", "Name": "...", "Team": "...", ...}`. **If the URL 404s or the shape differs:** `git clone --depth 1 https://github.com/phegde19/2026-World-Cup-Sticker-Tracker /tmp/wc26src` and locate the JSON under `src/data/`; adapt the field names in Step 2's script to whatever the file actually uses (inspect first, then adjust the `r.Code` / `r.Name` accessors). Do not commit `raw-stickers.json` (add `scripts/raw-stickers.json` to `.gitignore`).

- [ ] **Step 2: Write the transform script `scripts/build-stickers.mjs`**

```js
// Transforms the raw community checklist into src/data/stickers.json.
// Output entry: { code, num, name, type }
//   code: section code ("ARG", "FWC", "C", ...)  num: number within section
//   The Panini "00" sticker becomes { code: "FWC", num: 0 } so it lives on the intro page.
import { readFileSync, writeFileSync } from "node:fs";

const raw = JSON.parse(readFileSync("scripts/raw-stickers.json", "utf8"));

const out = raw.map((r) => {
  const rawCode = String(r.Code).trim();
  let code, num;
  if (rawCode === "00") {
    code = "FWC";
    num = 0;
  } else {
    const m = rawCode.match(/^([A-Z]+)\s?(\d+)$/);
    if (!m) throw new Error(`Unparseable code: ${rawCode}`);
    code = m[1];
    num = Number(m[2]);
  }
  let type;
  if (code === "FWC" || code === "C") type = "special";
  else if (num === 1) type = "badge";
  else if (num === 13) type = "team_photo";
  else type = "player";
  return { code, num, name: String(r.Name ?? "").trim(), type };
});

// Stats for eyeball verification
const bySection = new Map();
for (const s of out) bySection.set(s.code, (bySection.get(s.code) ?? 0) + 1);
console.log(`Total stickers: ${out.length}`);
console.log(`Sections: ${bySection.size}`);
for (const [code, n] of [...bySection].sort()) {
  if (n !== 20) console.log(`  NOTE non-20 section: ${code} = ${n}`);
}
const keys = new Set(out.map((s) => `${s.code}-${s.num}`));
if (keys.size !== out.length) throw new Error("Duplicate sticker keys!");

writeFileSync("src/data/stickers.json", JSON.stringify(out));
console.log("Wrote src/data/stickers.json");
```

- [ ] **Step 3: Run it and eyeball the stats**

Run: `node scripts/build-stickers.mjs`
Expected: total in the 980–995 range; ~50 sections; the only non-20 sections should be `FWC` and `C` (and these counts are our authoritative answer to the research's open question). If team sections aren't 20, inspect the raw data before proceeding.

- [ ] **Step 4: Commit**

```bash
git add scripts/build-stickers.mjs src/data/stickers.json .gitignore
git commit -m "feat: add WC26 sticker dataset and build script"
```

---

### Task 3: Teams data + dataset integrity tests

**Files:**
- Create: `src/data/teams.json`, `src/data/data.test.ts`, `src/lib/types.ts`

- [ ] **Step 1: Create `src/lib/types.ts`**

```ts
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
```

- [ ] **Step 2: Create `src/data/teams.json`**

Colors from RESEARCH.md §3 (accent defaults to trophy gold `#D4A24C` when a team has no strong third color). **Team codes are provisional until Step 3's test cross-checks them against `stickers.json` — fix any mismatched code here, not in the dataset.**

```json
[
  {"code":"FWC","name":"FIFA World Cup 26","group":null,"flag":"🏆","colors":{"primary":"#000000","secondary":"#FFFFFF","accent":"#D4A24C"},"page":0},
  {"code":"C","name":"Coca-Cola","group":null,"flag":"🥤","colors":{"primary":"#F40009","secondary":"#FFFFFF","accent":"#D4A24C"},"page":1},
  {"code":"MEX","name":"Mexico","group":"A","flag":"🇲🇽","colors":{"primary":"#006847","secondary":"#FFFFFF","accent":"#CE1126"},"page":2},
  {"code":"RSA","name":"South Africa","group":"A","flag":"🇿🇦","colors":{"primary":"#FFB612","secondary":"#007749","accent":"#D4A24C"},"page":3},
  {"code":"KOR","name":"South Korea","group":"A","flag":"🇰🇷","colors":{"primary":"#CD2E3A","secondary":"#0F0F0F","accent":"#D4A24C"},"page":4},
  {"code":"CZE","name":"Czech Republic","group":"A","flag":"🇨🇿","colors":{"primary":"#D7141A","secondary":"#FFFFFF","accent":"#11457E"},"page":5},
  {"code":"CAN","name":"Canada","group":"B","flag":"🇨🇦","colors":{"primary":"#FF0000","secondary":"#FFFFFF","accent":"#D4A24C"},"page":6},
  {"code":"BIH","name":"Bosnia and Herzegovina","group":"B","flag":"🇧🇦","colors":{"primary":"#002F6C","secondary":"#FECB00","accent":"#D4A24C"},"page":7},
  {"code":"QAT","name":"Qatar","group":"B","flag":"🇶🇦","colors":{"primary":"#8A1538","secondary":"#FFFFFF","accent":"#D4A24C"},"page":8},
  {"code":"SUI","name":"Switzerland","group":"B","flag":"🇨🇭","colors":{"primary":"#DA291C","secondary":"#FFFFFF","accent":"#D4A24C"},"page":9},
  {"code":"BRA","name":"Brazil","group":"C","flag":"🇧🇷","colors":{"primary":"#FFDF00","secondary":"#009739","accent":"#002776"},"page":10},
  {"code":"MAR","name":"Morocco","group":"C","flag":"🇲🇦","colors":{"primary":"#C1272D","secondary":"#006233","accent":"#D4A24C"},"page":11},
  {"code":"HAI","name":"Haiti","group":"C","flag":"🇭🇹","colors":{"primary":"#00209F","secondary":"#D21034","accent":"#D4A24C"},"page":12},
  {"code":"SCO","name":"Scotland","group":"C","flag":"🏴󠁧󠁢󠁳󠁣󠁴󠁿","colors":{"primary":"#0D1B52","secondary":"#FFFFFF","accent":"#D4A24C"},"page":13},
  {"code":"USA","name":"United States","group":"D","flag":"🇺🇸","colors":{"primary":"#002868","secondary":"#FFFFFF","accent":"#BF0A30"},"page":14},
  {"code":"PAR","name":"Paraguay","group":"D","flag":"🇵🇾","colors":{"primary":"#D52B1E","secondary":"#FFFFFF","accent":"#0038A8"},"page":15},
  {"code":"AUS","name":"Australia","group":"D","flag":"🇦🇺","colors":{"primary":"#FFCD00","secondary":"#00843D","accent":"#D4A24C"},"page":16},
  {"code":"TUR","name":"Turkey","group":"D","flag":"🇹🇷","colors":{"primary":"#E30A17","secondary":"#FFFFFF","accent":"#D4A24C"},"page":17},
  {"code":"GER","name":"Germany","group":"E","flag":"🇩🇪","colors":{"primary":"#000000","secondary":"#FFFFFF","accent":"#FFCE00"},"page":18},
  {"code":"CUW","name":"Curaçao","group":"E","flag":"🇨🇼","colors":{"primary":"#002B7F","secondary":"#F9E814","accent":"#D4A24C"},"page":19},
  {"code":"CIV","name":"Ivory Coast","group":"E","flag":"🇨🇮","colors":{"primary":"#FF8200","secondary":"#FFFFFF","accent":"#009A44"},"page":20},
  {"code":"ECU","name":"Ecuador","group":"E","flag":"🇪🇨","colors":{"primary":"#FFDD00","secondary":"#034EA2","accent":"#ED1C24"},"page":21},
  {"code":"NED","name":"Netherlands","group":"F","flag":"🇳🇱","colors":{"primary":"#FF6600","secondary":"#21468B","accent":"#D4A24C"},"page":22},
  {"code":"JPN","name":"Japan","group":"F","flag":"🇯🇵","colors":{"primary":"#002984","secondary":"#FFFFFF","accent":"#D4A24C"},"page":23},
  {"code":"SWE","name":"Sweden","group":"F","flag":"🇸🇪","colors":{"primary":"#FFCD00","secondary":"#006AA7","accent":"#D4A24C"},"page":24},
  {"code":"TUN","name":"Tunisia","group":"F","flag":"🇹🇳","colors":{"primary":"#E70013","secondary":"#FFFFFF","accent":"#D4A24C"},"page":25},
  {"code":"BEL","name":"Belgium","group":"G","flag":"🇧🇪","colors":{"primary":"#ED2939","secondary":"#000000","accent":"#FAE042"},"page":26},
  {"code":"EGY","name":"Egypt","group":"G","flag":"🇪🇬","colors":{"primary":"#CE1126","secondary":"#FFFFFF","accent":"#000000"},"page":27},
  {"code":"IRN","name":"Iran","group":"G","flag":"🇮🇷","colors":{"primary":"#239F40","secondary":"#FFFFFF","accent":"#DA0000"},"page":28},
  {"code":"NZL","name":"New Zealand","group":"G","flag":"🇳🇿","colors":{"primary":"#000000","secondary":"#FFFFFF","accent":"#D4A24C"},"page":29},
  {"code":"ESP","name":"Spain","group":"H","flag":"🇪🇸","colors":{"primary":"#AA151B","secondary":"#F1BF00","accent":"#1F2A44"},"page":30},
  {"code":"CPV","name":"Cape Verde","group":"H","flag":"🇨🇻","colors":{"primary":"#003893","secondary":"#FFFFFF","accent":"#CF2027"},"page":31},
  {"code":"KSA","name":"Saudi Arabia","group":"H","flag":"🇸🇦","colors":{"primary":"#006C35","secondary":"#FFFFFF","accent":"#D4A24C"},"page":32},
  {"code":"URU","name":"Uruguay","group":"H","flag":"🇺🇾","colors":{"primary":"#7BAFD4","secondary":"#000000","accent":"#D4A24C"},"page":33},
  {"code":"FRA","name":"France","group":"I","flag":"🇫🇷","colors":{"primary":"#21304D","secondary":"#FFFFFF","accent":"#EF4135"},"page":34},
  {"code":"SEN","name":"Senegal","group":"I","flag":"🇸🇳","colors":{"primary":"#00853F","secondary":"#FDEF42","accent":"#E31B23"},"page":35},
  {"code":"IRQ","name":"Iraq","group":"I","flag":"🇮🇶","colors":{"primary":"#007A3D","secondary":"#FFFFFF","accent":"#CE1126"},"page":36},
  {"code":"NOR","name":"Norway","group":"I","flag":"🇳🇴","colors":{"primary":"#BA0C2F","secondary":"#FFFFFF","accent":"#00205B"},"page":37},
  {"code":"ARG","name":"Argentina","group":"J","flag":"🇦🇷","colors":{"primary":"#75AADB","secondary":"#FFFFFF","accent":"#D4A24C"},"page":38},
  {"code":"ALG","name":"Algeria","group":"J","flag":"🇩🇿","colors":{"primary":"#006233","secondary":"#FFFFFF","accent":"#D4A24C"},"page":39},
  {"code":"AUT","name":"Austria","group":"J","flag":"🇦🇹","colors":{"primary":"#ED2939","secondary":"#FFFFFF","accent":"#D4A24C"},"page":40},
  {"code":"JOR","name":"Jordan","group":"J","flag":"🇯🇴","colors":{"primary":"#CE1126","secondary":"#FFFFFF","accent":"#007A3D"},"page":41},
  {"code":"POR","name":"Portugal","group":"K","flag":"🇵🇹","colors":{"primary":"#E42518","secondary":"#046A38","accent":"#D4A24C"},"page":42},
  {"code":"COD","name":"DR Congo","group":"K","flag":"🇨🇩","colors":{"primary":"#007FFF","secondary":"#CE1021","accent":"#F7D618"},"page":43},
  {"code":"UZB","name":"Uzbekistan","group":"K","flag":"🇺🇿","colors":{"primary":"#0099B5","secondary":"#FFFFFF","accent":"#1EB53A"},"page":44},
  {"code":"COL","name":"Colombia","group":"K","flag":"🇨🇴","colors":{"primary":"#FCD116","secondary":"#003893","accent":"#CE1126"},"page":45},
  {"code":"ENG","name":"England","group":"L","flag":"🏴󠁧󠁢󠁥󠁮󠁧󠁿","colors":{"primary":"#002366","secondary":"#FFFFFF","accent":"#CE1124"},"page":46},
  {"code":"CRO","name":"Croatia","group":"L","flag":"🇭🇷","colors":{"primary":"#FF0000","secondary":"#FFFFFF","accent":"#171796"},"page":47},
  {"code":"GHA","name":"Ghana","group":"L","flag":"🇬🇭","colors":{"primary":"#CE1126","secondary":"#FCD116","accent":"#006B3F"},"page":48},
  {"code":"PAN","name":"Panama","group":"L","flag":"🇵🇦","colors":{"primary":"#DA121A","secondary":"#FFFFFF","accent":"#072357"},"page":49}
]
```

- [ ] **Step 3: Write `src/data/data.test.ts` (failing if codes mismatch)**

```ts
import { describe, expect, it } from "vitest";
import stickersData from "./stickers.json";
import teamsData from "./teams.json";
import type { Sticker, Team } from "../lib/types";

const stickers = stickersData as Sticker[];
const teams = teamsData as Team[];

describe("dataset integrity", () => {
  it("has a plausible total", () => {
    expect(stickers.length).toBeGreaterThanOrEqual(980);
    expect(stickers.length).toBeLessThanOrEqual(995);
  });

  it("has unique keys", () => {
    const keys = new Set(stickers.map((s) => `${s.code}-${s.num}`));
    expect(keys.size).toBe(stickers.length);
  });

  it("covers every sticker code with a team entry, and vice versa", () => {
    const stickerCodes = new Set(stickers.map((s) => s.code));
    const teamCodes = new Set(teams.map((t) => t.code));
    expect([...stickerCodes].filter((c) => !teamCodes.has(c))).toEqual([]);
    expect([...teamCodes].filter((c) => !stickerCodes.has(c))).toEqual([]);
  });

  it("gives every group team exactly 20 stickers numbered 1-20", () => {
    for (const t of teams.filter((t) => t.group !== null)) {
      const nums = stickers
        .filter((s) => s.code === t.code)
        .map((s) => s.num)
        .sort((a, b) => a - b);
      expect(nums, t.code).toEqual(Array.from({ length: 20 }, (_, i) => i + 1));
    }
  });

  it("has 48 teams + 2 special sections with unique contiguous pages", () => {
    expect(teams.filter((t) => t.group !== null)).toHaveLength(48);
    expect(teams.filter((t) => t.group === null)).toHaveLength(2);
    const pages = teams.map((t) => t.page).sort((a, b) => a - b);
    expect(pages).toEqual(Array.from({ length: 50 }, (_, i) => i));
  });
});
```

- [ ] **Step 4: Run and reconcile**

Run: `npm test -- --run`
Expected: likely 1–2 failures on code mismatches (e.g., dataset uses `KSA` vs `SAU`). **Fix `teams.json` codes to match the dataset** (the dataset is authoritative — it matches the physical album). Re-run until green.

- [ ] **Step 5: Commit**

```bash
git add src/lib/types.ts src/data/teams.json src/data/data.test.ts
git commit -m "feat: add teams data with colors and dataset integrity tests"
```

---

### Task 4: Collection state logic (TDD)

**Files:**
- Create: `src/lib/collection.ts`, `src/lib/collection.test.ts`

- [ ] **Step 1: Write failing tests `src/lib/collection.test.ts`**

```ts
import { describe, expect, it } from "vitest";
import { countHave, cycle, keyOf, stateOf } from "./collection";
import type { Collection } from "./types";

describe("keyOf", () => {
  it("formats code-num", () => {
    expect(keyOf("BRA", 7)).toBe("BRA-7");
  });
});

describe("stateOf", () => {
  it("defaults to need", () => {
    expect(stateOf({}, "BRA-7")).toBe("need");
  });
  it("reads have and spare", () => {
    const c: Collection = { "BRA-7": "have", "ARG-1": "spare" };
    expect(stateOf(c, "BRA-7")).toBe("have");
    expect(stateOf(c, "ARG-1")).toBe("spare");
  });
});

describe("cycle", () => {
  it("cycles need → have → spare → need", () => {
    let c: Collection = {};
    c = cycle(c, "BRA-7");
    expect(stateOf(c, "BRA-7")).toBe("have");
    c = cycle(c, "BRA-7");
    expect(stateOf(c, "BRA-7")).toBe("spare");
    c = cycle(c, "BRA-7");
    expect(stateOf(c, "BRA-7")).toBe("need");
    expect("BRA-7" in c).toBe(false);
  });
  it("does not mutate the input", () => {
    const c: Collection = {};
    cycle(c, "BRA-7");
    expect(c).toEqual({});
  });
});

describe("countHave", () => {
  it("counts have and spare as owned", () => {
    const c: Collection = { "BRA-1": "have", "BRA-2": "spare" };
    expect(countHave(c, ["BRA-1", "BRA-2", "BRA-3"])).toBe(2);
  });
});
```

- [ ] **Step 2: Run to verify failure**

Run: `npm test -- --run src/lib/collection.test.ts`
Expected: FAIL — module `./collection` not found.

- [ ] **Step 3: Implement `src/lib/collection.ts`**

```ts
import type { Collection, SlotState } from "./types";

export const keyOf = (code: string, num: number): string => `${code}-${num}`;

export function stateOf(c: Collection, key: string): SlotState {
  return c[key] ?? "need";
}

/** Immutable need → have → spare → need cycle. */
export function cycle(c: Collection, key: string): Collection {
  const next = { ...c };
  switch (stateOf(c, key)) {
    case "need":
      next[key] = "have";
      break;
    case "have":
      next[key] = "spare";
      break;
    case "spare":
      delete next[key];
      break;
  }
  return next;
}

/** Owned = have or spare. */
export function countHave(c: Collection, keys: string[]): number {
  return keys.filter((k) => stateOf(c, k) !== "need").length;
}
```

- [ ] **Step 4: Run to verify pass**

Run: `npm test -- --run src/lib/collection.test.ts` — Expected: PASS (all).

- [ ] **Step 5: Commit**

```bash
git add src/lib/collection.ts src/lib/collection.test.ts
git commit -m "feat: collection state cycle and counts"
```

---

### Task 5: localStorage persistence (TDD)

**Files:**
- Create: `src/lib/storage.ts`, `src/lib/storage.test.ts`

- [ ] **Step 1: Write failing tests `src/lib/storage.test.ts`**

```ts
import { describe, expect, it } from "vitest";
import { loadCollection, saveCollection, STORAGE_KEY } from "./storage";

function fakeStorage(initial: Record<string, string> = {}) {
  const map = new Map(Object.entries(initial));
  return {
    getItem: (k: string) => map.get(k) ?? null,
    setItem: (k: string, v: string) => void map.set(k, v),
  };
}

describe("storage round-trip", () => {
  it("saves and loads", () => {
    const s = fakeStorage();
    saveCollection(s, { "BRA-7": "have" });
    expect(loadCollection(s)).toEqual({ "BRA-7": "have" });
  });
});

describe("loadCollection resilience", () => {
  it("returns empty on missing key", () => {
    expect(loadCollection(fakeStorage())).toEqual({});
  });
  it("returns empty on corrupt JSON", () => {
    expect(loadCollection(fakeStorage({ [STORAGE_KEY]: "{oops" }))).toEqual({});
  });
  it("drops invalid values, keeps valid ones", () => {
    const s = fakeStorage({
      [STORAGE_KEY]: JSON.stringify({ "BRA-7": "have", "ARG-1": "banana" }),
    });
    expect(loadCollection(s)).toEqual({ "BRA-7": "have" });
  });
});
```

- [ ] **Step 2: Run to verify failure**

Run: `npm test -- --run src/lib/storage.test.ts` — Expected: FAIL, module not found.

- [ ] **Step 3: Implement `src/lib/storage.ts`**

```ts
import type { Collection } from "./types";

export const STORAGE_KEY = "wc26-collection-v1";

type StorageLike = Pick<Storage, "getItem" | "setItem">;

export function loadCollection(storage: StorageLike): Collection {
  try {
    const raw = storage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return {};
    const out: Collection = {};
    for (const [k, v] of Object.entries(parsed)) {
      if (v === "have" || v === "spare") out[k] = v;
    }
    return out;
  } catch {
    return {};
  }
}

export function saveCollection(storage: StorageLike, c: Collection): void {
  storage.setItem(STORAGE_KEY, JSON.stringify(c));
}
```

- [ ] **Step 4: Run to verify pass**

Run: `npm test -- --run src/lib/storage.test.ts` — Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/storage.ts src/lib/storage.test.ts
git commit -m "feat: localStorage persistence with corrupt-data resilience"
```

---

### Task 6: Trade list text (TDD)

**Files:**
- Create: `src/lib/tradeList.ts`, `src/lib/tradeList.test.ts`

- [ ] **Step 1: Write failing tests `src/lib/tradeList.test.ts`**

```ts
import { describe, expect, it } from "vitest";
import { tradeListText } from "./tradeList";
import type { Collection, Sticker } from "./types";

const stickers: Sticker[] = [
  { code: "ARG", num: 1, name: "Badge", type: "badge" },
  { code: "ARG", num: 2, name: "Player A", type: "player" },
  { code: "BRA", num: 1, name: "Badge", type: "badge" },
  { code: "BRA", num: 2, name: "Player B", type: "player" },
  { code: "FWC", num: 0, name: "Panini", type: "special" },
];
const order = ["FWC", "ARG", "BRA"];

describe("tradeListText", () => {
  it("groups need and spares by section in album order", () => {
    const c: Collection = { "ARG-1": "have", "BRA-2": "spare" };
    const text = tradeListText(c, stickers, order);
    expect(text).toBe("WC26 — Need: FWC 00 · ARG 2 · BRA 1\nSpares: BRA 2");
  });
  it("handles complete collection", () => {
    const c: Collection = {
      "ARG-1": "have", "ARG-2": "have",
      "BRA-1": "have", "BRA-2": "have",
      "FWC-0": "have",
    };
    expect(tradeListText(c, stickers, order)).toBe(
      "WC26 — Need: none 🎉\nSpares: none",
    );
  });
});
```

- [ ] **Step 2: Run to verify failure**

Run: `npm test -- --run src/lib/tradeList.test.ts` — Expected: FAIL, module not found.

- [ ] **Step 3: Implement `src/lib/tradeList.ts`**

```ts
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
```

- [ ] **Step 4: Run to verify pass**

Run: `npm test -- --run src/lib/tradeList.test.ts` — Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/tradeList.ts src/lib/tradeList.test.ts
git commit -m "feat: WhatsApp-ready trade list text generation"
```

---

### Task 7: Backup serialize/parse with validation (TDD)

**Files:**
- Create: `src/lib/backup.ts`, `src/lib/backup.test.ts`

- [ ] **Step 1: Write failing tests `src/lib/backup.test.ts`**

```ts
import { describe, expect, it } from "vitest";
import { parseBackup, serializeBackup } from "./backup";
import type { Collection } from "./types";

const validKeys = new Set(["BRA-7", "ARG-1"]);

describe("backup round-trip", () => {
  it("serializes and parses back", () => {
    const c: Collection = { "BRA-7": "spare" };
    expect(parseBackup(serializeBackup(c), validKeys)).toEqual(c);
  });
});

describe("parseBackup rejects bad input without partial application", () => {
  it("rejects non-JSON", () => {
    expect(() => parseBackup("not json", validKeys)).toThrow(/JSON/);
  });
  it("rejects foreign JSON files", () => {
    expect(() => parseBackup('{"foo": 1}', validKeys)).toThrow(/backup/i);
  });
  it("rejects unknown sticker keys", () => {
    const text = serializeBackup({ "XXX-99": "have" } as Collection);
    expect(() => parseBackup(text, validKeys)).toThrow(/XXX-99/);
  });
  it("rejects invalid states", () => {
    const text = JSON.stringify({
      app: "wc26-tracker",
      version: 1,
      collection: { "BRA-7": "banana" },
    });
    expect(() => parseBackup(text, validKeys)).toThrow(/BRA-7/);
  });
});
```

- [ ] **Step 2: Run to verify failure**

Run: `npm test -- --run src/lib/backup.test.ts` — Expected: FAIL, module not found.

- [ ] **Step 3: Implement `src/lib/backup.ts`**

```ts
import type { Collection } from "./types";

export function serializeBackup(c: Collection): string {
  return JSON.stringify({ app: "wc26-tracker", version: 1, collection: c }, null, 2);
}

/** Throws with a human-readable message on any problem. Never partially applies. */
export function parseBackup(text: string, validKeys: Set<string>): Collection {
  let obj: unknown;
  try {
    obj = JSON.parse(text);
  } catch {
    throw new Error("That file is not valid JSON.");
  }
  if (!obj || typeof obj !== "object" || (obj as { app?: unknown }).app !== "wc26-tracker") {
    throw new Error("That file is not a WC26 backup.");
  }
  const col = (obj as { collection?: unknown }).collection;
  if (!col || typeof col !== "object" || Array.isArray(col)) {
    throw new Error("Backup contains no collection data.");
  }
  const out: Collection = {};
  for (const [k, v] of Object.entries(col)) {
    if (!validKeys.has(k)) throw new Error(`Unknown sticker key in backup: ${k}`);
    if (v !== "have" && v !== "spare") throw new Error(`Invalid state for ${k}: ${String(v)}`);
    out[k] = v;
  }
  return out;
}
```

- [ ] **Step 4: Run to verify pass**

Run: `npm test -- --run src/lib/backup.test.ts` — Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/backup.ts src/lib/backup.test.ts
git commit -m "feat: backup export/import with strict validation"
```

---

### Task 8: Styles + StickerSlot + TeamPage

**Files:**
- Create: `src/components/StickerSlot.tsx`, `src/components/TeamPage.tsx`
- Modify: `src/index.css`, `src/App.tsx` (temporary harness)

- [ ] **Step 1: Write `src/index.css`**

```css
:root {
  --gold: #d4a24c;
  --panini-blue: #bee3f2;
  --ink: #111111;
  --team-primary: #000000;
  --team-secondary: #ffffff;
  --team-accent: var(--gold);
  font-family: "Noto Sans", system-ui, -apple-system, sans-serif;
}

* { box-sizing: border-box; margin: 0; padding: 0; }

html, body, #root { height: 100%; }
body {
  background: #ffffff;
  color: var(--ink);
  overscroll-behavior: none;
  -webkit-tap-highlight-color: transparent;
}

/* ---------- Pager ---------- */
.pager {
  display: flex;
  height: 100dvh;
  overflow-x: auto;
  scroll-snap-type: x mandatory;
  scrollbar-width: none;
}
.pager::-webkit-scrollbar { display: none; }

/* ---------- Team page ---------- */
.team-page {
  flex: 0 0 100%;
  scroll-snap-align: start;
  display: flex;
  flex-direction: column;
  padding: max(env(safe-area-inset-top), 12px) 16px 72px;
  background:
    linear-gradient(180deg, color-mix(in srgb, var(--team-primary) 14%, white), #fff 45%);
  max-width: 480px;
  margin: 0 auto;
  transition: background 0.3s;
}
.team-page.complete { box-shadow: inset 0 0 0 4px var(--gold); border-radius: 12px; }

.team-header { text-align: center; padding: 8px 0 16px; }
.team-flag { font-size: 44px; line-height: 1; display: block; }
.team-header h2 {
  font-size: 28px;
  font-weight: 900;
  letter-spacing: -0.5px;
  text-transform: uppercase;
  color: var(--team-primary);
}
.team-group { font-size: 12px; letter-spacing: 2px; color: #777; text-transform: uppercase; }
.team-progress { margin-top: 10px; font-weight: 700; font-size: 14px; }
.team-progress .bar {
  height: 6px; border-radius: 3px; background: #eee; margin-top: 4px; overflow: hidden;
}
.team-progress .bar-fill {
  height: 100%; border-radius: 3px;
  background: linear-gradient(90deg, var(--team-primary), var(--team-accent));
  transition: width 0.25s;
}

/* ---------- Slot grid ---------- */
.slot-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 8px;
  margin-top: auto;
  margin-bottom: 8px;
}
.slot {
  aspect-ratio: 3 / 4;
  border-radius: 10px;
  border: none;
  font: inherit;
  font-size: 18px;
  font-weight: 800;
  position: relative;
  cursor: pointer;
  background: var(--panini-blue);
}
.slot-need {
  background: #fff;
  border: 2px dashed #b9c4cc;
  color: #9aa7b0;
}
.slot-have {
  background: var(--team-primary);
  color: #fff;
  animation: stick 0.18s ease-out;
}
.slot-spare {
  background: var(--team-primary);
  color: #fff;
}
.slot-spare::after {
  content: "×2";
  position: absolute;
  top: 4px; right: 4px;
  font-size: 10px;
  background: var(--gold);
  color: #111;
  border-radius: 6px;
  padding: 1px 4px;
}
.slot-foil.slot-have, .slot-foil.slot-spare {
  background: linear-gradient(135deg, var(--team-primary) 30%, var(--gold) 50%, var(--team-primary) 70%);
  background-size: 200% 200%;
  animation: shimmer 2.5s linear infinite;
}
@keyframes stick { from { transform: scale(1.25); } to { transform: scale(1); } }
@keyframes shimmer { from { background-position: 0% 0%; } to { background-position: 200% 200%; } }

/* ---------- Bottom bar ---------- */
.bottom-bar {
  position: fixed;
  bottom: 0; left: 0; right: 0;
  display: flex;
  justify-content: space-around;
  align-items: center;
  padding: 8px 16px calc(8px + env(safe-area-inset-bottom));
  background: rgba(255, 255, 255, 0.92);
  backdrop-filter: blur(8px);
  border-top: 1px solid #eee;
}
.bottom-bar button {
  border: none; background: none; font: inherit; font-size: 22px; cursor: pointer;
}
.bottom-bar .overall { font-size: 13px; font-weight: 800; color: var(--gold); }

/* ---------- Overlays (badge wall, export sheet) ---------- */
.overlay {
  position: fixed; inset: 0;
  background: rgba(0, 0, 0, 0.82);
  color: #fff;
  overflow-y: auto;
  padding: 24px 16px calc(24px + env(safe-area-inset-bottom));
  z-index: 10;
}
.overlay h2 { font-size: 20px; font-weight: 900; text-transform: uppercase; margin-bottom: 12px; }
.overlay .close {
  position: absolute; top: 16px; right: 16px;
  border: none; background: none; color: #fff; font-size: 26px; cursor: pointer;
}
.wall-group-label { font-size: 11px; letter-spacing: 2px; color: #aaa; margin: 14px 0 6px; }
.wall-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; }
.crest {
  border: none; cursor: pointer;
  aspect-ratio: 1;
  border-radius: 50%;
  font-size: 26px;
  display: flex; align-items: center; justify-content: center;
  background: var(--crest-color, #333);
}
.crest.complete { box-shadow: 0 0 0 3px var(--gold), 0 0 14px var(--gold); }
.wall-stats {
  position: sticky; bottom: 0;
  text-align: center; padding: 8px;
  background: rgba(0,0,0,0.7); border-radius: 8px; font-size: 13px;
}

.sheet-btn {
  display: block; width: 100%;
  margin: 10px 0; padding: 14px;
  border: none; border-radius: 12px;
  font: inherit; font-weight: 700; font-size: 15px;
  background: #fff; color: #111; cursor: pointer;
}
.sheet-error { color: #ff8a80; font-size: 13px; margin-top: 8px; }

/* ---------- Toast ---------- */
.toast {
  position: fixed;
  bottom: 64px; left: 50%;
  transform: translateX(-50%);
  background: #111; color: #fff;
  border-radius: 20px;
  padding: 8px 16px;
  font-size: 13px;
  display: flex; gap: 12px; align-items: center;
  z-index: 20;
  max-width: 90vw;
}
.toast button {
  border: none; background: none; color: var(--gold);
  font: inherit; font-weight: 800; cursor: pointer;
}

/* Desktop: centered phone column */
@media (min-width: 600px) {
  .pager { max-width: 480px; margin: 0 auto; }
}
```

- [ ] **Step 2: Create `src/components/StickerSlot.tsx`**

```tsx
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
```

- [ ] **Step 3: Create `src/components/TeamPage.tsx`**

```tsx
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
```

- [ ] **Step 4: Temporary harness in `src/App.tsx` to verify visually**

```tsx
import { useState } from "react";
import stickersData from "./data/stickers.json";
import teamsData from "./data/teams.json";
import type { Collection, Sticker, Team } from "./lib/types";
import { cycle } from "./lib/collection";
import { TeamPage } from "./components/TeamPage";

const stickers = stickersData as Sticker[];
const teams = teamsData as Team[];

export default function App() {
  const [collection, setCollection] = useState<Collection>({});
  const brazil = teams.find((t) => t.code === "BRA")!;
  const braStickers = stickers
    .filter((s) => s.code === "BRA")
    .sort((a, b) => a.num - b.num);
  return (
    <TeamPage
      team={brazil}
      stickers={braStickers}
      collection={collection}
      onTap={(key) => setCollection((c) => cycle(c, key))}
    />
  );
}
```

- [ ] **Step 5: Manual verification**

Run: `npm run dev`, open in a narrow browser window (~390px wide).
Expected: Brazil page in yellow/green theme; tapping slots cycles dashed → filled → ×2 badge → dashed; slot 1 shimmers when owned (foil); progress bar updates. Then run `npm test -- --run` + `npm run build` — both green.

- [ ] **Step 6: Commit**

```bash
git add src/index.css src/components/ src/App.tsx
git commit -m "feat: themed team page with tappable sticker slots"
```

---

### Task 9: AlbumPager + full App wiring

**Files:**
- Create: `src/components/AlbumPager.tsx`
- Modify: `src/App.tsx` (replace harness with real app)

- [ ] **Step 1: Create `src/components/AlbumPager.tsx`**

```tsx
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
```

- [ ] **Step 2: Replace `src/App.tsx` with the real app shell**

(BadgeWall and ExportSheet are added in Tasks 10–11; for now the two bottom-bar buttons are present but the overlays render `null`.)

```tsx
import { useEffect, useMemo, useRef, useState } from "react";
import stickersData from "./data/stickers.json";
import teamsData from "./data/teams.json";
import type { Collection, Sticker, Team } from "./lib/types";
import { countHave, cycle, keyOf, stateOf } from "./lib/collection";
import { loadCollection, saveCollection } from "./lib/storage";
import { AlbumPager } from "./components/AlbumPager";

const stickers = stickersData as Sticker[];
const teams = (teamsData as Team[]).slice().sort((a, b) => a.page - b.page);
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

  function handleTap(key: string, label: string) {
    const prev = collection;
    const next = cycle(prev, key);
    setCollection(next);
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
  }

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
        <button aria-label="Jump to team" onClick={() => setOverlay("wall")}>⊞</button>
        <span className="overall">{totalHave}/{stickers.length}</span>
        <button aria-label="Export and backup" onClick={() => setOverlay("export")}>↗</button>
      </nav>

      {overlay === "wall" && null /* BadgeWall — Task 10 */}
      {overlay === "export" && null /* ExportSheet — Task 11 */}

      {toast && (
        <div className="toast" role="status">
          <span>{toast.msg}</span>
          {toast.undo && (
            <button
              onClick={() => {
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
```

- [ ] **Step 3: Manual verification**

Run: `npm run dev` (narrow window). Expected: swipe/scroll horizontally through FWC intro → Coca-Cola → Mexico → … with theme changing per page; tap shows undo toast; UNDO reverts; reload restores both collection and current page; browser tab theme-color follows the page. Run `npm test -- --run` and `npm run build` — green.

- [ ] **Step 4: Commit**

```bash
git add src/components/AlbumPager.tsx src/App.tsx
git commit -m "feat: page-flip album pager with persistence, undo toast, backup nudge"
```

---

### Task 10: BadgeWall jump menu

**Files:**
- Create: `src/components/BadgeWall.tsx`
- Modify: `src/App.tsx` (wire overlay)

- [ ] **Step 1: Create `src/components/BadgeWall.tsx`**

```tsx
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
```

- [ ] **Step 2: Wire into `src/App.tsx`**

Add import: `import { BadgeWall } from "./components/BadgeWall";`
Replace the `{overlay === "wall" && null ...}` line with:

```tsx
{overlay === "wall" && (
  <BadgeWall
    teams={teams}
    stickersByCode={stickersByCode}
    collection={collection}
    onJump={(p) => {
      setPage(p);
      setOverlay("none");
    }}
    onClose={() => setOverlay("none")}
  />
)}
```

- [ ] **Step 3: Manual verification**

Run: `npm run dev`. Expected: ⊞ opens dark overlay with crests grouped Specials/A–L; tap jumps to that team's page and closes; long-press shows "🇧🇷 Brazil: x/20" stats bar without jumping; completed teams glow gold. `npm run build` green.

- [ ] **Step 4: Commit**

```bash
git add src/components/BadgeWall.tsx src/App.tsx
git commit -m "feat: badge wall jump menu with long-press stats"
```

---

### Task 11: ExportSheet (trade list, backup, restore)

**Files:**
- Create: `src/components/ExportSheet.tsx`
- Modify: `src/App.tsx` (wire overlay)

- [ ] **Step 1: Create `src/components/ExportSheet.tsx`**

```tsx
import { useRef, useState } from "react";
import type { Collection, Sticker } from "../lib/types";
import { tradeListText } from "../lib/tradeList";
import { parseBackup, serializeBackup } from "../lib/backup";

interface Props {
  collection: Collection;
  stickers: Sticker[];
  sectionOrder: string[]; // team codes in album page order
  validKeys: Set<string>;
  onRestore: (c: Collection) => void;
  onBackedUp: () => void;
  onClose: () => void;
}

export function ExportSheet({
  collection, stickers, sectionOrder, validKeys, onRestore, onBackedUp, onClose,
}: Props) {
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  async function copyTradeList() {
    const text = tradeListText(collection, stickers, sectionOrder);
    try {
      await navigator.clipboard.writeText(text);
      setStatus("Trade list copied — paste it anywhere 📋");
    } catch {
      // Clipboard API can fail outside secure contexts; show the text instead
      window.prompt("Copy your trade list:", text);
    }
  }

  function downloadBackup() {
    const blob = new Blob([serializeBackup(collection)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `wc26-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
    onBackedUp();
    setStatus("Backup downloaded ✓");
  }

  async function restore(file: File) {
    setError(null);
    try {
      const restored = parseBackup(await file.text(), validKeys);
      onRestore(restored);
      setStatus("Backup restored ✓");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not read that file.");
    }
  }

  return (
    <div className="overlay" role="dialog" aria-label="Export and backup">
      <button className="close" aria-label="Close" onClick={onClose}>✕</button>
      <h2>Trade & Backup</h2>
      <button className="sheet-btn" onClick={copyTradeList}>📋 Copy missing & spares list</button>
      <button className="sheet-btn" onClick={downloadBackup}>💾 Download backup</button>
      <button className="sheet-btn" onClick={() => fileInput.current?.click()}>📥 Restore backup…</button>
      <input
        ref={fileInput}
        type="file"
        accept="application/json"
        hidden
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) void restore(f);
          e.target.value = "";
        }}
      />
      {status && <p style={{ marginTop: 8, fontSize: 13 }}>{status}</p>}
      {error && <p className="sheet-error">⚠ {error}</p>}
    </div>
  );
}
```

- [ ] **Step 2: Wire into `src/App.tsx`**

Add import: `import { ExportSheet } from "./components/ExportSheet";`
Below the other module-level constants, add:

```tsx
const sectionOrder = teams.map((t) => t.code);
const validKeys = new Set(allKeys);
```

Replace the `{overlay === "export" && null ...}` line with:

```tsx
{overlay === "export" && (
  <ExportSheet
    collection={collection}
    stickers={stickers}
    sectionOrder={sectionOrder}
    validKeys={validKeys}
    onRestore={(c) => setCollection(c)}
    onBackedUp={() => {
      localStorage.setItem(LAST_BACKUP_KEY, String(Date.now()));
      localStorage.setItem(CHANGES_KEY, "0");
    }}
    onClose={() => setOverlay("none")}
  />
)}
```

- [ ] **Step 3: Manual verification**

Run: `npm run dev`. Mark a few stickers. Expected: copy button puts `WC26 — Need: …` text on clipboard (paste into a text editor to confirm); download produces `wc26-backup-2026-06-11.json`; restoring that file after clearing some stickers brings them back; restoring a bogus `.json` shows a readable error and changes nothing. `npm test -- --run` and `npm run build` green.

- [ ] **Step 4: Commit**

```bash
git add src/components/ExportSheet.tsx src/App.tsx
git commit -m "feat: export sheet with trade list, backup download and restore"
```

---

### Task 12: PWA (offline + installable)

**Files:**
- Create: `public/icon.svg`
- Modify: `vite.config.ts`, `index.html`

- [ ] **Step 1: Install plugin**

```bash
npm install -D vite-plugin-pwa
```

- [ ] **Step 2: Create `public/icon.svg`**

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <rect width="512" height="512" rx="96" fill="#111111"/>
  <text x="256" y="320" font-family="Arial Black, sans-serif" font-size="240" font-weight="900"
        fill="#D4A24C" text-anchor="middle">26</text>
  <circle cx="256" cy="420" r="28" fill="#BEE3F2"/>
</svg>
```

- [ ] **Step 3: Generate PNG icons**

```bash
npx @vite-pwa/assets-generator --preset minimal-2023 public/icon.svg
```

Expected: PNG icons (incl. 192/512 and apple-touch-icon) written to `public/`. If the generator's output names differ, match them in Step 4's manifest.

- [ ] **Step 4: Add the plugin to `vite.config.ts`**

```ts
/// <reference types="vitest/config" />
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  base: "/wc26-stickers/",
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      manifest: {
        name: "WC26 Sticker Album",
        short_name: "WC26 Album",
        description: "Panini World Cup 2026 sticker collection tracker",
        display: "standalone",
        orientation: "portrait",
        background_color: "#ffffff",
        theme_color: "#ffffff",
        icons: [
          { src: "pwa-192x192.png", sizes: "192x192", type: "image/png" },
          { src: "pwa-512x512.png", sizes: "512x512", type: "image/png" },
          { src: "pwa-512x512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
        ],
      },
    }),
  ],
  test: {
    environment: "node",
  },
});
```

- [ ] **Step 5: Add apple-touch-icon link to `index.html` `<head>`**

```html
<link rel="apple-touch-icon" href="/wc26-stickers/apple-touch-icon-180x180.png">
```

(Adjust the filename to whatever Step 3 generated.)

- [ ] **Step 6: Verify**

Run: `npm run build && npm run preview`. Open the preview URL; in devtools → Application: manifest parses, service worker active. Reload with network throttled to offline: app still loads.

- [ ] **Step 7: Commit**

```bash
git add -A && git commit -m "feat: PWA manifest, icons, offline service worker"
```

---

### Task 13: GitHub repo + Pages deploy

**Files:**
- Create: `.github/workflows/deploy.yml`, `README.md`

- [ ] **Step 1: Create `.github/workflows/deploy.yml`**

```yaml
name: Deploy to GitHub Pages
on:
  push:
    branches: [main]
permissions:
  contents: read
  pages: write
  id-token: write
concurrency:
  group: pages
  cancel-in-progress: true
jobs:
  deploy:
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: npm
      - run: npm ci
      - run: npm test -- --run
      - run: npm run build
      - uses: actions/configure-pages@v5
      - uses: actions/upload-pages-artifact@v3
        with:
          path: dist
      - id: deployment
        uses: actions/deploy-pages@v4
```

- [ ] **Step 2: Create `README.md`**

```markdown
# WC26 Sticker Album

Personal Panini FIFA World Cup 2026 (NA edition) collection tracker.
Mobile-first PWA — page-flip album, per-team theming, need/have/spare tracking,
trade-list export, JSON backup/restore. Data lives in your browser (localStorage).

- **Spec:** docs/superpowers/specs/2026-06-11-wc26-sticker-tracker-design.md
- **Research:** RESEARCH.md
- Dev: `npm run dev` · Test: `npm test` · Build: `npm run build`
- Deploys to GitHub Pages on push to `main`.
- Regenerate sticker data: `node scripts/build-stickers.mjs` (see script header).
```

- [ ] **Step 3: Create the GitHub repo and push**

```bash
gh repo create wc26-stickers --public --source . --remote origin
git add .github README.md && git commit -m "ci: GitHub Pages deploy workflow + README"
git push -u origin main
```

**Repo name must match `base: "/wc26-stickers/"` in `vite.config.ts`** — if a different name is used, update `base` and the apple-touch-icon path first. (Ask Lucas before creating if he wants a different name or a private repo — note: GitHub Pages on private repos requires a paid plan, so public is the free path; the site contains no personal data.)

- [ ] **Step 4: Enable Pages via Actions**

```bash
gh api repos/{owner}/wc26-stickers/pages -X POST -f build_type=workflow || true
gh run watch
```

Expected: workflow green; site live at `https://<owner>.github.io/wc26-stickers/`.

- [ ] **Step 5: Verify on phone & finish**

Open the URL on the iPhone → confirm swipe, tap, theming feel right → Share → Add to Home Screen → launch standalone → enable airplane mode → app still opens. Lucas verifies the checklist against his physical album (first-session task from the spec).

- [ ] **Step 6: Final commit if anything changed**

```bash
git add -A && git commit -m "chore: post-deploy adjustments" || true
git push
```

---

## Verification checklist (whole-plan)

- [ ] `npm test -- --run` — all suites green (data integrity, collection, storage, tradeList, backup)
- [ ] `npm run build` — no TypeScript errors
- [ ] Manual on phone: swipe pages, theme changes, tap-cycle with undo, badge wall jump + long-press, trade list copy, backup download/restore, PWA install, offline launch
- [ ] Lucas verifies dataset against physical album; mismatches fixed in `src/data/*.json` only
