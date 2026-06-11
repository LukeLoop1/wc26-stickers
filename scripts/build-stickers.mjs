// Transforms the raw community checklist into src/data/stickers.json.
// Output entry: { code, num, name, type }
//   code: section code ("ARG", "FWC", "CC", ...)  num: number within section
//   The Panini "00" sticker becomes { code: "FWC", num: 0 } so it lives on the intro page.
//
// NOTE: The Coca-Cola section uses code "CC" (not "C") with 12 stickers — dataset-accurate.
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
  if (code === "FWC" || code === "CC") type = "special";
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
