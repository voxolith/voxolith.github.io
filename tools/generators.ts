// Generator reference data for the docs: every registered entity generator's identity, roles,
// parameter specs with their defaults, scales, and each package's presets, read from the live
// generator objects, so the parameter tables can never drift from what the generators accept.
//
// Writes src/generated/generators.json (gitignored), which <GeneratorReference> renders.
// Imports the generator sources by path, so it needs the Voxolith workspace layout (locally the
// workspace folder, in CI the checkouts the Pages workflow assembles).
//
//   bun tools/generators.ts

import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const SITE = join(import.meta.dir, "..");
const GEN = join(SITE, "..", "generators");
const OUT = join(SITE, "src", "generated", "generators.json");

const { listGenerators, clearGenerators, getParam } = await import(join(SITE, "..", "engine", "src", "generator.ts"));

/** Package folder -> the function that registers its generators. */
const PACKAGES: Record<string, string> = {
  tree: "registerTreeGenerators",
  bush: "registerBushGenerators",
  grass: "registerGrassGenerators",
  rock: "registerRockGenerators",
  building: "registerBuildingGenerators",
  creature: "registerCreatureGenerators",
};

const hex = (c: number[]) =>
  "#" + c.slice(0, 3).map((v) => Math.round(Math.max(0, Math.min(1, v)) * 255).toString(16).padStart(2, "0")).join("");

/** Dotted paths of every `kind` leaf in a parameter object. */
function kindPaths(obj: unknown, prefix = ""): string[] {
  if (!obj || typeof obj !== "object") return [];
  return Object.entries(obj as Record<string, unknown>).flatMap(([k, v]) =>
    k === "kind" && typeof v === "string" ? [prefix + k] : kindPaths(v, `${prefix}${k}.`),
  );
}

const packages: Record<string, unknown> = {};
for (const [dir, register] of Object.entries(PACKAGES)) {
  const mod = await import(join(GEN, dir, "src", "index.ts"));
  const pkg = await Bun.file(join(GEN, dir, "package.json")).json();
  clearGenerators();
  mod[register]();
  const presets: Record<string, unknown> = mod.PRESETS ?? {};
  const generators = listGenerators().map((g: any) => ({
    id: g.id,
    name: g.name,
    version: g.version,
    description: g.description ?? "",
    scales: g.scales ?? [],
    looseRoles: g.looseRoles ?? [],
    roles: g.roles.map((r: any) => ({ id: r.id, name: r.name, color: hex(r.color), material: r.material?.kind ?? r.material ?? null })),
    params: g.params.map((s: any) => ({ ...s, default: getParam(g.defaults, s.path) })),
    // A preset belongs to a generator when it defines every parameter path and agrees with the
    // generator's defaults on any `kind` field (tree presets are broadleaf or conifer).
    presets: Object.entries(presets)
      .filter(([, p]) => g.params.every((s: any) => getParam(p, s.path) !== undefined))
      .filter(([, p]) => kindPaths(g.defaults).every((k) => getParam(p, k) === getParam(g.defaults, k)))
      .map(([name, p]) => ({ name, values: Object.fromEntries(g.params.map((s: any) => [s.path, getParam(p, s.path)])) })),
  }));
  packages[dir] = { name: pkg.name, version: pkg.version, description: pkg.description ?? "", generators };
  console.log(`${pkg.name.padEnd(24)} ${generators.map((g: any) => `${g.id} (${g.params.length} params, ${g.presets.length} presets)`).join(", ")}`);
}
clearGenerators();

mkdirSync(join(SITE, "src", "generated"), { recursive: true });
writeFileSync(OUT, JSON.stringify({ packages }, null, 2) + "\n");
console.log(`wrote ${OUT.slice(SITE.length + 1)}`);
