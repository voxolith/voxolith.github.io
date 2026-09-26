# AGENTS.md: voxolith.github.io

The Voxolith website and documentation at https://voxolith.github.io/: a Fumadocs site built as a
static Next.js export into `out/` (not `dist/`). `.github/workflows/pages.yml` publishes it on every
push to `main`, and nightly. It owns the domain root, so its `robots.txt` and `sitemap.xml` also
cover the apps, which are separate Pages sites (`appPages` in `src/lib/shared.ts`).

## Commands

```sh
bun run dev          # http://localhost:3000 (inside the workspace: `bun run dev docs` from the root)
bun run typecheck
bun run build        # regenerates the API reference and generator pages first (prebuild)
bun run links        # after a build: every internal link resolves
bun run previews     # regenerate the generator contact sheets in public/generators/
bun tools/api/run.ts --coverage   # undocumented exports; keep it at 0
```

The API reference and the generator pages need the sibling repos checked out: renderer, engine,
generators.

## Map

- `content/docs/`: the docs, as Fumadocs root folders:
  - `(guide)`: getting started, tutorial, manual, examples, troubleshooting, credits;
  - `renderer`, `engine`, `generators`: each package's own section;
  - `meta.json` files order the pages.
- `content/docs/*/api/`: **generated** by TypeDoc (`tools/api/`, its own TypeScript 6 install,
  since TypeDoc can't run on TS 7). Never edit it: fix the doc comment in the source repo.
- `tools/generators.ts`: renders each generator's live ParamSpecs, defaults, presets and roles
  into its page. `tools/previews.ts`: contact sheets. `tools/check-links.ts`: the link checker.
- `src/lib/shared.ts`: the site name, the demos on the landing page, and `appPages` (sitemap).
  `src/lib/tree.ts`: trims the page tree per page (it keeps the export small).
- `public/shots/`: example screenshots (960 × 540 webp).
- `next.config.mjs`: `turbopack.root` points at the workspace root when the site is in the
  workspace; `agentRules: false` stops Next writing its own AGENTS.md or CLAUDE.md here.

## Rules

- The site is the source of truth for documentation. READMEs in the other repos stay short and
  link here.
- A new example page gets:
  - an `.mdx` under `(guide)/examples/` and an entry in its `meta.json`;
  - a screenshot in `public/shots/`;
  - its URL in `appPages`.
- Credits: every paper an idea came from is on the page that uses it, under References, and on
  `/docs/credits/`, with a checked DOI.
- Keep `bun run links` at 0 broken, and the API coverage at 0 undocumented.

## Working in the Voxolith repos

- **Layout.** Every Voxolith repo is checked out side by side under one bun workspace root, and
  depends on its siblings as `"workspace:*"`. Run `bun install` from that root, never inside a
  repo. [CONTRIBUTING](https://github.com/voxolith/.github/blob/main/CONTRIBUTING.md) lists
  which siblings each repo needs.
- **Toolchain: bun only.** There is no npm or node step anywhere. It is TypeScript 7 and Vite 8;
  scripts run `tsc`, `vite` and `bun tools/x.ts`. Use current dependency versions.
- **`tsconfig.base.json` is byte-identical in every repo**, because consumers compile the
  renderer's and engine's sources under their own flags. Change it everywhere or nowhere.
- **WebGPU, not WebGL.** Dev servers are HTTPS (`@vitejs/plugin-basic-ssl`), because WebGPU needs a
  secure context. Checks cannot see pixels: anything that changes what is drawn must be looked
  at in a WebGPU browser, with a before/after screenshot in the pull request.
- **Docs live on the site** ([voxolith.github.io](https://voxolith.github.io/docs/), repo
  `voxolith.github.io`). READMEs stay short and link there. The API reference is generated from
  the sources, so doc comments are published content: every exported symbol has a `/** */`, and
  entry files open with `@packageDocumentation`.
- **Credit research.** When an idea comes from a paper, cite it (authors, title, venue, DOI) in
  the code comment, in the docs (the page's References and `/docs/credits/`) and in the commit
  body. Check the citation against the paper or DataCite; don't cite from memory.
- **Prose.** British spelling in prose and comments (`colour`, `normalise`); identifiers follow the
  web platform (`lightColor`). "Voxolith" is capitalised in prose; lowercase is only for the
  wordmark.
- **Commits.** History is linear and read as prose:
  - The subject says what is now true, in plain words: no `feat:` prefixes, no trailing full
    stop, about 70 characters at most.
  - The body says why, what it costs and what it deliberately does not do, wrapped at about 72
    columns.
  - One change per commit. AI-assisted commits keep their `Co-Authored-By` trailer.
  - Pull requests are squash-merged or rebased; there are no merge commits.
  - Don't push, tag or publish unless asked.
- **Community files** (CONTRIBUTING with the AI policy, CODE_OF_CONDUCT, SECURITY, templates) live
  once in `voxolith/.github` and apply org-wide; don't copy them in here.
- **CI's job names are required checks** on `main` (rulesets). Renaming a job breaks merging.
