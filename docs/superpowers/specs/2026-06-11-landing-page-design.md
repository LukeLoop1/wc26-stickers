# Landing Page ("Midnight Gold") — Design Addendum

**Date:** 2026-06-11 · **Status:** Approved by Lucas (visual mockup, option A)
**Extends:** `2026-06-11-wc26-sticker-tracker-design.md`

## Concept

A dark "album cover" home screen shown on launch: near-black stage, metallic-gold "26" hero, overall progress ring, 12 tappable group rings, FWC/CC chips, one-tap Continue button. Approved mockup: "Midnight Gold" (`.superpowers/brainstorm/97806-1781181251/content/landing-style.html`, choice A).

## Behavior

- **App gains `view: "home" | "album"` state.** Launch always shows `home`. The album keeps its own last-page persistence — Continue resumes exactly where the user left off.
- **Hero:** gold-gradient "26" (text treatment, NOT the official FIFA emblem — IP), subtitle "WORLD CUP ALBUM".
- **Overall ring:** SVG ring showing collected/992 with count in the center; gold stroke.
- **Continue button:** gold gradient, label `▶ Continue — {flag} {team name} {have}/{total}` for the persisted current page's team; tap → `view = "album"`.
- **Group rings (12, grid 4×3):** letter A–L centered, progress = owned/80 across the group's 4 teams. Each group has a fixed accent color (palette below); the ring stroke turns **gold when the group is 100% complete**. Tap → open BadgeWall overlay **auto-scrolled to that group**.
- **FWC / CC chips:** show `🏆 FWC x/20` and `🥤 CC x/12`; tap → enter album directly at page 0 / page 1.
- **Bottom bar:** gains a 🏠 button (→ `view = "home"`). Bar is visible in both views.
- **BadgeWall:** gains optional `scrollToGroup` prop; when set, the group's section scrolls into view on mount. Jumping from the wall also sets `view = "album"`.
- **theme-color meta:** `#0d0d0d` while `view === "home"`; existing per-team behavior in album view.

## Group accent palette

A `#26d07c` · B `#ff5d5d` · C `#ffd34d` · D `#5da9ff` · E `#c77dff` · F `#ff9f45` · G `#4dd6c4` · H `#f06292` · I `#9ccc65` · J `#ba8bf5` · K `#64b5f6` · L `#ef5350` · complete → `#d4a24c` (gold)

## Components & files

- New: `src/components/LandingPage.tsx` (hero, overall ring, continue, group rings, chips), `src/components/ProgressRing.tsx` (small reusable SVG ring: `{ pct, size, stroke, color, label?, sublabel? }`)
- Modify: `src/App.tsx` (view state, home button, wiring), `src/components/BadgeWall.tsx` (`scrollToGroup`), `src/index.css` (landing styles, dark section)
- No data/storage changes. Group progress derived from existing `teams`, `stickersByCode`, `collection`.

## Out of scope

Animations beyond ring stroke transition; streaks/stats; reordering groups; remembering view across launches (always launch home).
