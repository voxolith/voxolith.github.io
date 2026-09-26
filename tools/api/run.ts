// Generate the API reference from the package sources: one TypeDoc run per package, its
// entry points taken from the package's "exports" map, rendered to MDX by
// typedoc-plugin-markdown into content/docs/<section>/api/<package>/.
//
// The output is generated and gitignored; `bun run api` in the site (and prebuild/predev)
// runs this. It reads the sibling repos, so it needs the Voxolith workspace layout: locally
// the workspace folder, in CI the checkouts the Pages workflow assembles.
//
//   bun tools/api/run.ts               every package
//   bun tools/api/run.ts renderer      only packages whose name contains "renderer"
//   bun tools/api/run.ts --coverage    also list every undocumented export

import { Application, LogLevel, ReflectionKind, type ProjectReflection } from "typedoc";
import { existsSync, mkdirSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from "node:fs";
import { dirname, join, relative } from "node:path";

const SITE = join(import.meta.dir, "..", "..");
const WORKSPACE = join(SITE, "..");
const DOCS = join(SITE, "content", "docs");

interface Pkg {
  /** Folder relative to the workspace. */
  dir: string;
  /** Docs section (a root folder under content/docs). */
  section: "renderer" | "engine" | "generators";
  /** Folder name under <section>/api/; empty for a section that documents one package. */
  slug: string;
}

const PACKAGES: Pkg[] = [
  { dir: "renderer", section: "renderer", slug: "" },
  { dir: "engine", section: "engine", slug: "" },
  { dir: "generators/kit", section: "generators", slug: "gen-kit" },
  ...["tree", "bush", "grass", "rock", "building", "creature", "terrain"].map(
    (g): Pkg => ({ dir: `generators/${g}`, section: "generators", slug: `gen-${g}` }),
  ),
];

const argv = process.argv.slice(2);
const coverage = argv.includes("--coverage");
const only = argv.filter((a) => !a.startsWith("--"));

/** Entry points from package.json "exports": subpath -> source file. */
function entries(pkgDir: string): { name: string; subpath: string; file: string }[] {
  const pkg = JSON.parse(readFileSync(join(pkgDir, "package.json"), "utf8"));
  const exp: Record<string, string> = typeof pkg.exports === "string" ? { ".": pkg.exports } : pkg.exports;
  return Object.entries(exp).map(([subpath, file]) => ({
    name: subpath === "." ? pkg.name : `${pkg.name}/${subpath.replace(/^\.\//, "")}`,
    subpath,
    file: join(pkgDir, file),
  }));
}

function commonDir(files: string[]): string {
  const parts = files.map((f) => f.split("/").slice(0, -1));
  const first = parts[0];
  let n = 0;
  while (n < first.length && parts.every((p) => p[n] === first[n])) n++;
  return first.slice(0, n).join("/");
}

const KIND_TITLES: Record<string, string> = {
  classes: "Classes", interfaces: "Interfaces", functions: "Functions", variables: "Variables",
  "type-aliases": "Types", enumerations: "Enums", namespaces: "Namespaces",
};
const KIND_ORDER = ["functions", "classes", "interfaces", "type-aliases", "variables", "enumerations", "namespaces"];

/**
 * Sidebar metadata for the generated tree: a module folder lists its kind folders (Functions,
 * Classes, ...) in a fixed order, and a folder of modules lists them with the package's own module
 * first. The whole tree is large, so the site trims it per page (src/lib/tree.ts): only the current
 * module keeps its symbols in the sidebar.
 */
function writeFolderMeta(dir: string, title: string, first?: string) {
  const subdirs = readdirSync(dir).filter((d) => statSync(join(dir, d)).isDirectory());
  const kinds = KIND_ORDER.filter((k) => subdirs.includes(k));
  if (kinds.length) {
    for (const k of kinds) writeFileSync(join(dir, k, "meta.json"), JSON.stringify({ title: KIND_TITLES[k] }, null, 2) + "\n");
    writeFileSync(join(dir, "meta.json"), JSON.stringify({ title, pages: kinds }, null, 2) + "\n");
    return;
  }
  const modules = subdirs.sort((a, b) => (a === first ? -1 : b === first ? 1 : a.localeCompare(b)));
  for (const m of modules) {
    const index = join(dir, m, "index.mdx");
    const t = existsSync(index) ? /^title: "(.*)"$/m.exec(readFileSync(index, "utf8"))?.[1] ?? m : m;
    writeFolderMeta(join(dir, m), t);
  }
  writeFileSync(join(dir, "meta.json"), JSON.stringify({ title, pages: modules }, null, 2) + "\n");
}

/** Every file under dir with the extension. */
function walk(dir: string, ext: string): string[] {
  if (!existsSync(dir)) return [];
  return readdirSync(dir).flatMap((e) => {
    const p = join(dir, e);
    return statSync(p).isDirectory() ? walk(p, ext) : p.endsWith(ext) ? [p] : [];
  });
}

const yaml = (s: string) => JSON.stringify(s); // a JSON string is a valid YAML scalar

/** The site URL a content file is served at: content/docs/a/b/index.mdx -> /docs/a/b/. */
function urlOf(file: string): string {
  const rel = relative(DOCS, file).replace(/\.mdx$/, "").replace(/(^|\/)index$/, "");
  const path = rel.split("/").filter((seg) => !/^\(.*\)$/.test(seg)).join("/"); // (group) folders add nothing
  return `/docs/${path ? path + "/" : ""}`;
}

/** Relative links between generated pages ("../interfaces/Foo.mdx#bar") become site URLs. */
function absoluteLinks(file: string, src: string): string {
  return src.replace(/\]\(((?!https?:|#|\/)[^)\s]+?\.mdx)(#[^)\s]*)?\)/g, (_m, target: string, hash = "") =>
    `](${urlOf(join(dirname(file), target))}${hash})`,
  );
}

/**
 * typedoc-plugin-markdown writes a page title as the first "# ..." line. Fumadocs wants it in
 * frontmatter (it renders the title itself), so move it there, with the first paragraph as the
 * description.
 */
function toFumadocs(file: string, fallbackTitle: string) {
  const src = absoluteLinks(file, readFileSync(file, "utf8"));
  const lines = src.split("\n");
  const h = lines.findIndex((l) => l.startsWith("# "));
  let title = fallbackTitle;
  if (h >= 0) {
    title = lines[h].slice(2).replace(/\\/g, "").trim();
    lines.splice(h, 1);
  }
  let body = lines.join("\n").trim();
  // The summary is the first prose paragraph before the first heading: it becomes the page
  // description (shown under the title, and the meta description), so drop it from the body.
  const intro = body.split(/\n#{2,} /)[0];
  const para = intro
    .split(/\n\s*\n/)
    .find((p) => p.trim() && !/^(```|[#|<>\-*!])/.test(p.trim()) && !/^(Defined in|Re-exports|Renames and re-exports)\b/.test(p.trim()));
  let description = "";
  if (para) {
    description = para
      .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1") // [text](link) -> text
      .replace(/[`*_\\]/g, "")
      .replace(/\s+/g, " ")
      .trim();
    if (description.length > 300) description = description.slice(0, 297).replace(/\s+\S*$/, "") + "...";
    else body = body.replace(para, "").replace(/\n{3,}/g, "\n\n").trim();
  }
  const front = ["---", `title: ${yaml(title)}`, ...(description ? [`description: ${yaml(description)}`] : []), "---", ""];
  writeFileSync(file, front.join("\n") + "\n" + body + "\n");
}

let undocumented = 0;
const report: string[] = [];

function collectUndocumented(project: ProjectReflection) {
  const kinds =
    ReflectionKind.Function | ReflectionKind.Class | ReflectionKind.Interface | ReflectionKind.TypeAlias |
    ReflectionKind.Variable | ReflectionKind.Enum;
  const seen = new Set<string>();
  for (const r of project.getReflectionsByKind(kinds)) {
    const has =
      !!r.comment?.summary.length ||
      ("signatures" in r && (r as any).signatures?.some((s: any) => s.comment?.summary.length));
    if (has) continue;
    const src = (r as any).sources?.[0];
    const where = src ? `${src.fileName}:${src.line}` : "";
    const key = `${r.getFullName()} ${where}`;
    if (seen.has(key)) continue;
    seen.add(key);
    undocumented++;
    if (coverage) report.push(`  ${ReflectionKind.singularString(r.kind).padEnd(10)} ${r.getFullName().padEnd(48)} ${where}`);
  }
}

for (const p of PACKAGES) {
  if (only.length && !only.some((o) => p.dir.includes(o) || p.slug.includes(o))) continue;
  const pkgDir = join(WORKSPACE, p.dir);
  if (!existsSync(join(pkgDir, "package.json"))) {
    console.warn(`skip ${p.dir}: not found`);
    continue;
  }
  const out = join(DOCS, p.section, "api", p.slug);
  // A single-package section owns all of api/; a multi-package one only its own folder.
  rmSync(out, { recursive: true, force: true });
  const ents = entries(pkgDir);

  const app = await Application.bootstrapWithPlugins({
    entryPoints: ents.map((e) => e.file),
    out,
    tsconfig: join(pkgDir, "tsconfig.json"),
    plugin: ["typedoc-plugin-markdown"],
    // Sources compile under TS 7 in their own repos; this is only a reader. `?raw` shader
    // imports and TS-7-only details must not stop it.
    skipErrorChecking: true,
    readme: "none",
    excludePrivate: true,
    excludeInternal: true,
    excludeExternals: true,
    disableSources: false,
    // {path} is relative to the git repository root (generators/, not generators/kit/).
    sourceLinkTemplate: `https://github.com/voxolith/${p.dir.split("/")[0]}/blob/main/{path}#L{line}`,
    gitRevision: "main",
    logLevel: LogLevel.Warn,
    validation: { notExported: false, invalidLink: false, notDocumented: false },
    // typedoc-plugin-markdown
    outputFileStrategy: "members",
    fileExtension: ".mdx",
    entryFileName: "index",
    hideBreadcrumbs: true,
    hidePageHeader: true,
    useCodeBlocks: true,
    expandParameters: true,
    parametersFormat: "table",
    interfacePropertiesFormat: "table",
    classPropertiesFormat: "table",
    typeAliasPropertiesFormat: "table",
    enumMembersFormat: "table",
    sanitizeComments: true,
    pageTitleTemplates: { index: "{projectName}", module: "{name}", member: "{name}" },
  } as any);

  const project = await app.convert();
  if (!project) {
    console.error(`FAIL ${p.dir}: TypeDoc could not convert it`);
    process.exitCode = 1;
    continue;
  }
  // TypeDoc names each module by its path from the entry points' common folder ("index",
  // "worker/index", "core"). Give each a short folder slug (the package's own name for ".",
  // else the subpath), and title its page with the import path.
  const base = commonDir(ents.map((e) => e.file));
  const titles = new Map<string, string>();
  const pkgShort = (JSON.parse(readFileSync(join(pkgDir, "package.json"), "utf8")).name as string).split("/").pop()!;
  for (const child of project.children ?? []) {
    const e = ents.find((x) => relative(base, x.file).replace(/\.ts$/, "").replace(/(^|\/)index$/, "") === child.name.replace(/(^|\/)index$/, ""));
    if (!e) continue;
    const slug = e.subpath === "." ? pkgShort : e.subpath.replace(/^\.\//, "");
    child.name = slug;
    titles.set(slug, e.name);
  }
  mkdirSync(out, { recursive: true });
  await app.generateOutputs(project);
  collectUndocumented(project);

  const files = walk(out, ".mdx");
  const pkgName = JSON.parse(readFileSync(join(pkgDir, "package.json"), "utf8")).name as string;
  for (const f of files) toFumadocs(f, pkgName);
  // Module index pages: the import path as the title.
  for (const [slug, title] of titles) {
    const f = join(out, slug, "index.mdx");
    if (existsSync(f)) writeFileSync(f, readFileSync(f, "utf8").replace(/^title: .*$/m, `title: ${yaml(title)}`));
  }
  // The package index lists its modules; call it what it is.
  const top = join(out, "index.mdx");
  if (existsSync(top) && titles.size > 1) writeFileSync(top, readFileSync(top, "utf8").replace(/^title: .*$/m, `title: ${yaml(p.slug ? pkgName : "API reference")}`));
  writeFolderMeta(out, p.slug ? pkgName : "API reference", pkgShort);
  console.log(`${pkgName.padEnd(26)} ${files.length} page${files.length === 1 ? "" : "s"}  -> ${relative(SITE, out)}`);
}

// Section-level api folders: an index listing the packages.
for (const section of ["renderer", "engine", "generators"] as const) {
  const dir = join(DOCS, section, "api");
  if (!existsSync(dir)) continue;
  if (section !== "generators") continue; // single-package sections wrote their own meta
  const pkgs = readdirSync(dir)
    .filter((d) => statSync(join(dir, d)).isDirectory())
    .sort((a, b) => (a === "gen-kit" ? -1 : b === "gen-kit" ? 1 : a.localeCompare(b)));
  writeFileSync(join(dir, "meta.json"), JSON.stringify({ title: "API reference", pages: pkgs }, null, 2) + "\n");
}

if (coverage && report.length) console.log("\nundocumented exports:\n" + report.join("\n"));
console.log(`\n${undocumented} undocumented export${undocumented === 1 ? "" : "s"}`);
