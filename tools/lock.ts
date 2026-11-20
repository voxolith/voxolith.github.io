// Regenerate ci/bun.lock, the lockfile of the workspace root that CI assembles.
//
// The site has no lockfile of its own: its dependencies resolve from a workspace root, and the
// Pages workflow builds a throwaway one (ci/package.json, with renderer, engine and generators
// checked out beside the site). The workflow copies ci/bun.lock into that root before a plain
// `bun install`, so every locked version that still satisfies its range is kept, and a range
// changed since (here or in a sibling) just resolves afresh.
//
// This builds the same root in a temporary directory from the sibling checkouts' manifests
// (package.json files only: nothing is installed, and the real workspace root, its bun.lock and
// every node_modules are left alone) and writes the lockfile bun resolves for it.
//
//   bun run lock            # keep what ci/bun.lock pins, resolve only what changed
//   bun run lock --fresh    # ignore it: everything at the newest version its range allows
//   bun run lock --check    # exit 1 if ci/bun.lock is not what `bun run lock` would write

import { copyFileSync, existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";

const SITE = join(import.meta.dir, "..");
const WORKSPACE = join(SITE, "..");
const CI = join(SITE, "ci");
const LOCK = join(CI, "bun.lock");
const fresh = process.argv.includes("--fresh");
const check = process.argv.includes("--check");

/** The members' manifests, by path relative to the root, from the root manifest's `workspaces`. */
function manifests(patterns: readonly string[]): string[] {
  const found: string[] = [];
  for (const pattern of patterns) {
    if (pattern.endsWith("/*")) {
      const dir = pattern.slice(0, -2);
      if (!existsSync(join(WORKSPACE, dir))) throw new Error(`missing sibling checkout: ${join(WORKSPACE, dir)}`);
      for (const e of readdirSync(join(WORKSPACE, dir)).sort()) {
        if (existsSync(join(WORKSPACE, dir, e, "package.json"))) found.push(join(dir, e, "package.json"));
      }
    } else if (pattern.includes("*")) {
      throw new Error(`unsupported workspace pattern in ci/package.json: ${pattern}`);
    } else {
      if (!existsSync(join(WORKSPACE, pattern, "package.json"))) throw new Error(`missing sibling checkout: ${join(WORKSPACE, pattern)}`);
      found.push(join(pattern, "package.json"));
    }
  }
  return found;
}

const rootManifest = JSON.parse(readFileSync(join(CI, "package.json"), "utf8")) as { workspaces: string[] };
const root = mkdtempSync(join(tmpdir(), "voxolith-lock-"));
try {
  copyFileSync(join(CI, "package.json"), join(root, "package.json"));
  for (const m of manifests(rootManifest.workspaces)) {
    mkdirSync(dirname(join(root, m)), { recursive: true });
    copyFileSync(join(WORKSPACE, m), join(root, m));
  }
  if (!fresh && existsSync(LOCK)) copyFileSync(LOCK, join(root, "bun.lock"));

  const run = Bun.spawnSync(["bun", "install", "--lockfile-only"], { cwd: root, stdout: "inherit", stderr: "inherit" });
  if (run.exitCode !== 0) process.exit(run.exitCode ?? 1);

  const next = readFileSync(join(root, "bun.lock"), "utf8");
  const prev = existsSync(LOCK) ? readFileSync(LOCK, "utf8") : "";
  if (next === prev) {
    console.log("ci/bun.lock is up to date");
  } else if (check) {
    console.error("ci/bun.lock is out of date: run `bun run lock`");
    process.exitCode = 1;
  } else {
    writeFileSync(LOCK, next);
    console.log(`wrote ci/bun.lock${prev ? "" : " (new)"}`);
  }
} finally {
  rmSync(root, { recursive: true, force: true });
}
