# WC26 Panini Sticker Tracker — Design Spec

**Date:** 2026-06-11
**Status:** Approved by Lucas (design conversation, this date)
**Companion research:** [`RESEARCH.md`](../../../RESEARCH.md) (album structure, team colors, brand identity, existing-app patterns)

## Purpose

A personal-use, mobile-first web app for Lucas to track his Panini FIFA World Cup 2026 sticker collection (North American edition). Used primarily **while opening packs, phone in hand**. The defining quality goal is **immersion**: the app is a digital twin of the physical album, with each team's page themed in that nation's colors.

## Scope

**In scope:**
- Track all 992 album slots of the NA edition: 48 teams × 20 stickers, FWC intro/special section (20), Coca-Cola exclusives (12, codes C1–C12), Panini `00` sticker
- Three states per sticker: **need** (default) / **have** / **spare**
- Page-flip album navigation + badge-wall jump menu
- Per-team color theming
- Global "missing & spares" plain-text export for trading (clipboard)
- Backup export/import (JSON file)
- Offline-capable PWA, deployed free as a static site

**Out of scope (YAGNI):**
- Parallels, inserts, and non-album collectibles
- Exact duplicate counts (spare is a boolean state, not a counter)
- Accounts, sync, multi-user, swap matchmaking
- Per-team filtered trade lists (global list only)
- Native iOS app

## Tech Stack

- **Vite + React + TypeScript**, single-page app
- CSS custom properties for the theming system
- CSS scroll-snap for page swiping
- PWA: manifest + service worker (offline after first load)
- State persistence: `localStorage`
- Hosting: GitHub Pages, auto-deployed via GitHub Actions on push
- Tests: Vitest for state logic

## Architecture

### Data model — two layers, deliberately decoupled

**1. Static album data** (baked into the build):
- `stickers.json` — all 992 entries:
  `{ code: string, num: number, name: string, type: "player" | "badge" | "team_photo" | "special" }`
  - Seeded from the open-source community dataset (phegde19/2026-World-Cup-Sticker-Tracker, cross-checked with ryandeering/wc-2026-sticker-tracker for foil flags), verified against the football-sticker-album fandom wiki.
- `teams.json` — 48 teams + special sections:
  `{ code: string, name: string, group: "A".."L" | null, flag: string, colors: { primary, secondary, accent }, page: number }`
  - Colors from the table in RESEARCH.md §3.

**2. Collection state** (browser localStorage):
- A single flat map: `{ "BRA-7": "have", "ARG-10": "spare", ... }` — absent key = "need".
- Written to localStorage on every change. No save button.
- Backup = this map serialized to a downloadable JSON file; import validates shape before overwriting.
- The trading text and all completion stats are derived from this map on demand.

**Decoupling guarantee:** correcting album data (typos, checklist errors) and redeploying never touches collection state. Keys are `code-num`, stable across data fixes.

### Components (single-purpose, independently testable)

| Component | Responsibility |
|---|---|
| `App` | Routing (album ↔ jump menu overlay), theme provider, persistence wiring |
| `AlbumPager` | Horizontal scroll-snap pager in album order: FWC intro → Coca-Cola → Group A → … → Group L; remembers last page |
| `TeamPage` | One team's themed page: header (flag, name, group, x/20 progress), 4×5 slot grid |
| `StickerSlot` | Single tappable cell; renders need/have/spare/foil states; fires state-cycle events |
| `BadgeWall` | Jump-menu overlay: 48 crests grouped A–L + special sections; tap = jump, long-press = quick stats |
| `ExportSheet` | Missing & spares clipboard text, backup download, restore import |

State logic (cycle transitions, counts, export text generation, import validation) lives in plain TypeScript modules separate from components, so it is unit-testable without rendering.

## Visual Design

### Base design language (per official WC26 brand)
- White background, near-black text, trophy-gold `#D4A24C` accents
- Heavy condensed display font for numbers/headers (evoking the "26" emblem); clean sans (e.g., Noto Sans) for body
- Sticker slots on a baby-blue tint (~`#BEE3F2`), matching Panini's sticker background

### Per-team theming (the heart of the app)
- Each team page sets `--team-primary`, `--team-secondary`, `--team-accent` from `teams.json`
- Everything responds: header gradient, filled slots, progress bar, status-bar tint
- Colors crossfade during page swipes
- Special themes: FWC intro pages in black/white/gold; Coca-Cola page in Coke red

### Slot states
- **Need** — dashed outline, empty, gray slot number (unfilled album spot)
- **Have** — filled with team primary, white number; "stick" scale-in animation on tap
- **Spare** — filled + gold corner badge
- **Foil** (each team's badge slot 1 + FWC specials) — shimmer/metallic treatment

### Completion
- Team at 20/20: gold page frame + gold glow ring on its badge-wall crest
- Home/album header shows overall progress (e.g., 412/992)

### Layout
- Portrait, one-thumb reach: header info top, 4×5 slot grid in lower two-thirds
- Slim bottom bar: jump-menu button + export button
- Desktop: centered phone-width column

## Interactions

- **Tap slot:** cycles need → have → spare → need; undo toast after each change ("BRA 7 ✓ have — undo")
- **Swipe left/right:** previous/next album page (scroll-snap)
- **Badge wall:** grid icon opens overlay; tap crest to jump; long-press for quick stats
- **Export sheet:**
  - "Copy trade list" → clipboard text, format:
    `WC26 — Need: ARG 3, 7, 19 · BRA 2, 11 · …` / `Spares: MEX 5, POR 13 · …`
  - "Download backup" → JSON file of collection state
  - "Restore backup" → file picker, validates before applying

## Edge Cases & Error Handling

- **Storage wipe protection:** after every 10th change, if no recent export, nudge "last backup was N days ago"
- **Import validation:** malformed/wrong-shape JSON is rejected with a message; never partially applied
- **Checklist uncertainty:** FWC intro breakdown and Coca-Cola numbering had conflicting sources (see RESEARCH.md open questions). Seed from the 992-entry community dataset; Lucas verifies against the physical album in the first session. Mismatches are data fixes (edit JSON, redeploy), never code fixes, and never touch collection state.
- **Mis-taps:** undo toast on every change

## Testing Strategy

- **Unit tests (Vitest):** state cycle transitions, completion counts (per team + overall), trade-list text generation, backup import validation — everything that guards collection data
- **Manual verification on the actual phone:** theming, swipe feel, animations, PWA install, offline behavior

## Deployment

- Git repo (init this project directory)
- GitHub Actions workflow: build + deploy to GitHub Pages on every push to `main`
- Lucas adds the URL to his iPhone home screen ("Add to Home Screen" → standalone PWA)

## Decisions Log (from design conversation)

| Decision | Choice |
|---|---|
| Primary usage context | Phone in hand while opening packs |
| Duplicate handling | Three states (need/have/spare), no counts |
| Edition | North American (992 slots incl. Coca-Cola) |
| Entry pattern | Album-style team pages (immersion over speed) |
| Navigation | Page-flip album + badge-wall jump menu (B+C combo) |
| Trade list | Global missing & spares text export |
| Hosting | Free static site (GitHub Pages), PWA |
| Stack | Vite + React + TypeScript |
| Model usage | Fable 5 for design/planning; may switch to Sonnet for execution |
