# WC26 Sticker Album

Personal Panini FIFA World Cup 2026 (NA edition) collection tracker.
Mobile-first PWA — page-flip album, per-team theming, need/have/spare tracking,
trade-list export, JSON backup/restore. Data lives in your browser (localStorage).

- **Spec:** docs/superpowers/specs/2026-06-11-wc26-sticker-tracker-design.md
- **Research:** RESEARCH.md
- Dev: `npm run dev` · Test: `npm test` · Build: `npm run build`
- Deploys to GitHub Pages on push to `main`.
- Regenerate sticker data: `node scripts/build-stickers.mjs` (see script header).
