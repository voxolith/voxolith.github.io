// Render the generator contact sheets and copy them into public/generators/ as WebP, for the
// generator pages. The sheets come from each generator's own `preview` script (gen-kit's CPU
// renderer), which writes gitignored PNGs in generators/<name>/previews/; the WebP copies here
// are committed, since CI has no ImageMagick and rendering them on every build is slow.
// Re-run after a generator's look changes.
//
//   bun tools/previews.ts            every sheet
//   bun tools/previews.ts tree rock  only these generators

import { existsSync, mkdirSync } from "node:fs";
import { join } from "node:path";

const SITE = join(import.meta.dir, "..");
const GEN = join(SITE, "..", "generators");
const OUT = join(SITE, "public", "generators");

/**
 * generator -> preview rounds to render (each writes previews/<round>.png). Terrain's preview
 * takes [size] [seed] instead of a round and always writes map.png, so its round is "" -> map.
 */
const SHEETS: Record<string, string[]> = {
  tree: ["species", "seasons"],
  bush: ["species"],
  grass: ["species"],
  rock: ["species", "seeds"],
  building: ["species", "closeup"],
  creature: ["species", "clips", "cut"],
  terrain: [""],
};

const only = process.argv.slice(2);
mkdirSync(OUT, { recursive: true });
for (const [g, rounds] of Object.entries(SHEETS)) {
  if (only.length && !only.includes(g)) continue;
  for (const round of rounds) {
    const r = Bun.spawnSync(["bun", "tools/preview.ts", ...(round ? [round] : [])], { cwd: join(GEN, g), stdout: "pipe", stderr: "pipe" });
    const name = round || "map";
    const png = join(GEN, g, "previews", `${name}.png`);
    if (r.exitCode !== 0 || !existsSync(png)) {
      console.error(`FAIL ${g} ${name}: ${new TextDecoder().decode(r.stderr).trim().split("\n").pop()}`);
      process.exitCode = 1;
      continue;
    }
    const webp = join(OUT, `${g}-${name}.webp`);
    const m = Bun.spawnSync(["magick", png, "-resize", "1600x>", "-quality", "85", webp]);
    if (m.exitCode !== 0) {
      console.error(`FAIL ${g} ${name}: magick could not convert ${png}`);
      process.exitCode = 1;
      continue;
    }
    console.log(`${g}-${name}.webp  ${(Bun.file(webp).size / 1024).toFixed(0)} KB`);
  }
}
