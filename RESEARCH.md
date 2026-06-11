# Panini World Cup 2026 Tracker — Research Findings
*Compiled 2026-06-11 from four parallel research passes: album structure, tournament visual identity, competing teams, and existing tracker apps.*

---

## 1. The Panini FIFA World Cup 2026 Album

### Structure
- **980 base stickers across 112 pages** — the largest Panini World Cup album ever (first 48-team World Cup).
- **48 team sections × 20 stickers each = 960 team stickers**, one full page per nation:
  - Sticker **1** = team badge/crest (**foil**)
  - Sticker **13** = team photo
  - Remaining 18 = player portraits
- **20 special stickers** (intro section: official emblem, mascots, trophy + FIFA Museum / World Cup history). Exact intro/museum split varies by source (9+11 vs 1+19) — verify against physical album.
- Plus **12 Coca-Cola promo stickers** (`C1`–`C12`, US bottle exclusives) and a `00` Panini logo sticker → **992 total trackable slots** in community trackers.
- Teams ordered in the album by World Cup group.

### Numbering scheme (key for data model)
- **Per-team codes, NOT sequential**: `ARG 1`–`ARG 20`, `MEX 1`–`MEX 20`, etc.
- Special section uses `FWC` codes (`FWC1`–`FWC19`/20).
- Model sticker IDs as `(team_code, number)`.

### Rarity / special types
- **Foils**: each team's badge (sticker 1) + intro emblem/mascot/trophy stickers.
- **North American parallels** (colored borders): Blue ~1:2, Red ~1:25, Purple ~1:200, Green (rarer), Orange (Amazon exclusive), Black (1-of-1).
- **International edition**: "Extra Sticker" inserts ~1:100 (Purple base + Bronze/Silver/Gold) — no album slot.
- **~14 stickers not in standard packs** — Coca-Cola bottle exclusives in the US; the hardest completion gap.

### Availability
- US release April 29, 2026; widely available (retail, Amazon, Panini America/iCollect) but high demand — biggest US Panini cycle ever.

### Sources
- https://www.checklistinsider.com/2026-panini-fifa-world-cup-sticker
- https://cardlines.com/a-guide-to-2026-panini-world-cup-soccer-stickers/
- https://scanini.app/albums/world-cup-2026
- https://colombiaone.com/2026/05/10/panini-world-cup-2026-album-exclusive-stickers/
- https://football-sticker-album.fandom.com/wiki/2026_FIFA_World_Cup_(Panini)

---

## 2. World Cup 2026 Visual Identity (for the app's design language)

### Core brand
- Emblem: bold stacked **"26"** numeral with photorealistic World Cup trophy; flat, geometric, modular — designed as a "container" re-skinned per host city.
- **Core palette is deliberately minimal**: black `#000000` / white `#FFFFFF` base, trophy gold `#B38C45`–`#D4A24C`, malachite green trophy base `#0E5A3C`. Vibrant city/team colors layer on top.
- **Typography**: heavy geometric/condensed display face (like the "26" numerals) + **Noto Sans** as official secondary font.

### "WE ARE 26" host-city system
- 16 host cities, each with its own color theme inside the shared "26" framework (e.g., Dallas green/teal, Houston blue, LA coastal blues, SF Golden Gate orange, Mexico City magenta `#E5007E`). No official published hex sheet — FIFA's digitalhub city-logo assets are the color-pick source.
- **This "one structure, many color skins" concept maps perfectly onto a per-team themed UI.**

### Mascots
- **Maple** (Canada) — red moose, goalkeeper (~`#EA1D25`)
- **Zayu** (Mexico) — jaguar, green kit (~`#006847`)
- **Clutch** (US) — blue bald eagle (~`#1F2C5C`)

### Panini album design
- Canada–US cover: predominantly **white** with scattered multicolored "26"s + emblem.
- **Sticker design: baby-blue background with a large "26" behind the player, recolored to each nation's colors** — strong precedent for the per-team theming idea.

### Suggested app palette
White/black base, gold `#D4A24C` accents, baby-blue (~`#BEE3F2`) sticker surfaces, one saturated hero color per team section, red/green/blue Trionda-ball accents.

### Sources
- https://www.fifa.com/en/articles/world-cup-2026-official-brand-unveiled-canada-mexico-usa-celebration-football-diversity
- https://news.sportslogos.net/2023/05/19/fifa-host-cities-roll-out-specific-branding-for-2026-world-cup/soccer/
- https://1000logos.net/world-cup-2026-logo/
- https://en.wikipedia.org/wiki/Maple,_Zayu_and_Clutch
- https://inside.fifa.com/media-releases/panini-america-canada-united-states-cover-world-cup-2026-sticker-collection

---

## 3. The 48 Teams (groups + theming colors)

Tournament: June 11 – July 19, 2026. Hosts: USA, Mexico, Canada. Debutants: Cape Verde, Curaçao, Jordan, Uzbekistan. Italy and Poland did not qualify; Haiti returns first time since 1974.

| Team | Group | Primary colors (hex approx) |
|---|---|---|
| Mexico (host) | A | #006847, #FFFFFF, #CE1126 |
| South Africa | A | #FFB612, #007749 |
| South Korea | A | #CD2E3A, #0F0F0F |
| Czech Republic | A | #D7141A, #FFFFFF, #11457E |
| Canada (host) | B | #FF0000, #FFFFFF |
| Bosnia and Herzegovina | B | #002F6C, #FECB00 |
| Qatar | B | #8A1538, #FFFFFF |
| Switzerland | B | #DA291C, #FFFFFF |
| Brazil | C | #FFDF00, #009739, #002776 |
| Morocco | C | #C1272D, #006233 |
| Haiti | C | #00209F, #D21034 |
| Scotland | C | #0D1B52, #FFFFFF |
| United States (host) | D | #FFFFFF, #002868, #BF0A30 |
| Paraguay | D | #D52B1E, #FFFFFF, #0038A8 |
| Australia | D | #FFCD00, #00843D |
| Turkey | D | #E30A17, #FFFFFF |
| Germany | E | #FFFFFF, #000000, #DD0000, #FFCE00 |
| Curaçao | E | #002B7F, #F9E814 |
| Ivory Coast | E | #FF8200, #FFFFFF, #009A44 |
| Ecuador | E | #FFDD00, #034EA2, #ED1C24 |
| Netherlands | F | #FF6600, #21468B |
| Japan | F | #002984, #FFFFFF |
| Sweden | F | #FFCD00, #006AA7 |
| Tunisia | F | #E70013, #FFFFFF |
| Belgium | G | #ED2939, #000000, #FAE042 |
| Egypt | G | #CE1126, #FFFFFF, #000000 |
| Iran | G | #FFFFFF, #239F40, #DA0000 |
| New Zealand | G | #FFFFFF, #000000 |
| Spain | H | #AA151B, #F1BF00, #1F2A44 |
| Cape Verde | H | #003893, #FFFFFF, #CF2027 |
| Saudi Arabia | H | #006C35, #FFFFFF |
| Uruguay | H | #7BAFD4, #000000 |
| France | I | #21304D, #FFFFFF, #EF4135 |
| Senegal | I | #00853F, #FDEF42, #E31B23 |
| Iraq | I | #007A3D, #FFFFFF, #CE1126, #000000 |
| Norway | I | #BA0C2F, #FFFFFF, #00205B |
| Argentina | J | #75AADB, #FFFFFF |
| Algeria | J | #FFFFFF, #006233 |
| Austria | J | #ED2939, #FFFFFF |
| Jordan | J | #FFFFFF, #CE1126, #007A3D |
| Portugal | K | #E42518, #046A38 |
| DR Congo | K | #007FFF, #CE1021, #F7D618 |
| Uzbekistan | K | #FFFFFF, #0099B5, #1EB53A |
| Colombia | K | #FCD116, #003893, #CE1126 |
| England | L | #FFFFFF, #002366 |
| Croatia | L | #FF0000, #FFFFFF, #171796 |
| Ghana | L | #FFFFFF, #CE1126, #FCD116, #006B3F |
| Panama | L | #DA121A, #FFFFFF, #072357 |

### Sources
- https://en.wikipedia.org/wiki/2026_FIFA_World_Cup
- https://www.fifa.com/en/tournaments/mens/worldcup/canadamexicousa2026/articles/world-cup-2026-who-has-qualified

---

## 4. Existing Tracker Apps & Data Sources

### Table-stakes features (seen in every tool)
- **Tri-state per sticker**: missing / owned / duplicate — with **duplicate count** (integer, not boolean)
- **Completion %** overall and per team ("Brazil 14/20")
- **Generated missing/swaps lists** in copy-paste form (people share these in WhatsApp groups — most-used trading artifact)
- Filters: missing-only, incomplete teams, not-started teams
- Persistence (localStorage or cloud) + CSV export

### Dominant UX patterns
- **Grid of numbered cells you tap to toggle** (tap cycles missing → owned → duplicate, or +/- counters)
- One section per team, header with flag + `x/20` progress
- Pinned special sections (FWC, Coca-Cola) at top, teams grouped A–L
- Search/jump by code ("MEX 7") or player name
- Rapid-entry mode for pack opening (type numbers in sequence)
- Foils visually distinguished

### Machine-readable checklist data (seed candidates)
1. **phegde19/2026-World-Cup-Sticker-Tracker** (GitHub) — `src/data/stickers.json`: flat JSON of all **992 stickers** with `{Code, Name, Team, Country}`. Most directly reusable.
2. **ryandeering/wc-2026-sticker-tracker** (GitHub) — richer typed model (`album.ts`: code, section, type enum, foil flag, page/slot) + per-group squad rosters with player name/position/club.
3. paniniwm2026sticker.com — CSV export of full checklist.
4. Verification reference: football-sticker-album.fandom.com wiki + paninigroup.com pack contents.

### Notable existing apps
- **Panini Collectors** (official app): got/need/swaps, camera scan, cloud sync
- **LastSticker / Stickers Album Tracker / Stickermanager**: swap marketplaces
- **Scanini**: voice input during pack opening, trade matching
- Several small open-source trackers (Vue, Next.js, PWA, offline single-file HTML)

### Recommended approach for a simple personal app
JSON seed (from phegde19, verified against fandom wiki) + per-sticker integer count (0 = missing, 1 = owned, >1 = swaps) + tap-to-cycle grid grouped by team with progress bars + missing/swaps text export + localStorage persistence.

### Sources
- https://github.com/phegde19/2026-World-Cup-Sticker-Tracker
- https://github.com/ryandeering/wc-2026-sticker-tracker
- https://paniniwm2026sticker.com/world-cup-2026-sticker-checklist
- https://www.paninigroup.com/en/gb/panini-collectors-app
- https://scanini.app/

---

## Open questions to verify against the physical album
1. Exact breakdown of the 20 non-team stickers (intro vs FIFA Museum labeling).
2. Whether the 12–14 Coca-Cola exclusives are numbered within the 980 or are extra slots (community trackers use `C1`–`C12` + `00` → 992 total).
3. Whether Lucas has the **international or North American edition** (affects parallels, not base checklist).
