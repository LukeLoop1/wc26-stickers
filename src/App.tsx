import { useState } from "react";
import stickersData from "./data/stickers.json";
import teamsData from "./data/teams.json";
import type { Collection, Sticker, Team } from "./lib/types";
import { cycle } from "./lib/collection";
import { TeamPage } from "./components/TeamPage";

const stickers = stickersData as unknown as Sticker[];
const teams = teamsData as unknown as Team[];

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
