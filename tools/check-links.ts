// Check every internal link in the built site (out/) resolves to a page or file. Links into the
// apps (/viewer/, /editor/, /examples/, /demolition-shot/) are other Pages sites on the same
// domain and are not checked. Run after `bun run build`.
//
//   bun tools/check-links.ts

import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const OUT = join(import.meta.dir, "..", "out");
const APPS = ["/viewer/", "/editor/", "/examples/", "/demolition-shot/"];

if (!existsSync(OUT)) {
  console.error("no out/: run `bun run build` first");
  process.exit(2);
}

function walk(dir: string): string[] {
  return readdirSync(dir).flatMap((e) => {
    const p = join(dir, e);
    return statSync(p).isDirectory() ? walk(p) : p.endsWith(".html") ? [p] : [];
  });
}

function resolves(path: string): boolean {
  const p = join(OUT, decodeURIComponent(path));
  if (existsSync(p) && statSync(p).isFile()) return true;
  return existsSync(join(p, "index.html")) || existsSync(`${p}.html`);
}

const broken = new Map<string, Set<string>>();
let checked = 0;
for (const file of walk(OUT)) {
  const page = "/" + relative(OUT, file).replace(/index\.html$/, "");
  const html = readFileSync(file, "utf8");
  for (const [, href] of html.matchAll(/href="([^"]+)"/g)) {
    if (!href.startsWith("/") || href.startsWith("//")) continue;
    const path = href.split("#")[0].split("?")[0];
    if (!path || APPS.some((a) => path.startsWith(a))) continue;
    checked++;
    if (!resolves(path)) {
      if (!broken.has(path)) broken.set(path, new Set());
      broken.get(path)!.add(page);
    }
  }
}

for (const [path, pages] of broken) {
  const from = [...pages];
  console.log(`BROKEN ${path}\n  from ${from.slice(0, 3).join(", ")}${from.length > 3 ? ` and ${from.length - 3} more` : ""}`);
}
console.log(`${checked} internal links checked, ${broken.size} broken target${broken.size === 1 ? "" : "s"}`);
process.exit(broken.size ? 1 : 0);
