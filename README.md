<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/voxolith/.github/main/profile/lockup-dark.svg">
    <img alt="Voxolith — WebGPU voxel engine" src="https://raw.githubusercontent.com/voxolith/.github/main/profile/lockup.svg" width="420">
  </picture>
</p>

# voxolith.github.io

The Voxolith website and documentation, served at <https://voxolith.github.io/>. Built with
[Fumadocs](https://fumadocs.dev) as a static [Next.js export](https://nextjs.org/docs/app/guides/static-exports)
and published by `.github/workflows/pages.yml` on every push to `main`.

The apps are separate GitHub Pages sites on the same domain, deployed from their own repos:
[/viewer/](https://voxolith.github.io/viewer/), [/editor/](https://voxolith.github.io/editor/),
[/examples/](https://voxolith.github.io/examples/),
[/demolition-shot/](https://voxolith.github.io/demolition-shot/). This site owns the root, so its
`robots.txt` and `sitemap.xml` cover them too (`appPages` in `src/lib/shared.ts`).

## Develop

Inside the local Voxolith workspace, install from the workspace root and start it with
`bun run dev docs`; `next.config.mjs` then points Turbopack at the root's `node_modules`. On its
own (as in CI) it is an ordinary project:

```sh
bun install
bun run dev          # http://localhost:3000
bun run typecheck
bun run build        # static site in out/
bun run start        # serve out/
```

Links to the apps (`/viewer/`, `/examples/`, ...) are 404 locally: those pages live in other repos.

## Layout

| path | what |
|---|---|
| `content/docs/(guide)/` | the Guide section (`/docs/...`): getting started, tutorial, manual, examples, troubleshooting |
| `content/docs/{renderer,engine,generators}/` | one section per package: concept pages, then `api/` |
| `content/docs/*/api/` | **generated** API reference (`bun run api`, TypeDoc); gitignored |
| `src/generated/generators.json` | **generated** generator data (`bun run generators`); gitignored |
| `src/components/generator.tsx` | `<GeneratorReference id="..." />`: parameter, preset and role tables from that data |
| `src/app/(home)/page.tsx` | the landing page |
| `src/lib/shared.ts` | site name, description, the demo cards and the app pages for the sitemap |
| `src/app/sitemap.ts`, `robots.ts` | crawler files, generated at build |
| `public/shots/` | demo screenshots (1280x720 captures, 960 px WebP) |
| `public/generators/` | generator contact sheets (`bun run previews`, WebP, committed) |
| `src/brand/`, `public/brand/`, `public/favicon*` | **generated** by `bun run sync` in `voxolith/branding`; don't edit here |

Each section is a Fumadocs root folder (`"root": true` in its `meta.json`), which is what the
sidebar's section switcher lists. `(guide)` is a group folder, so its pages have no prefix.

Fumadocs' colours are mapped onto the brand tokens in `src/app/global.css`. The theme is stored
under `voxolith-theme`, the same key the apps use, so the choice carries across the domain.

## Generated reference

`bun run dev` and `bun run build` first run `bun run reference`:

- `bun run api` runs TypeDoc over every package's `exports` entry points into
  `content/docs/<section>/api/`. TypeDoc needs the classic TypeScript compiler API (TS 6 at most)
  and the workspace is on TS 7, so it has its own install in `tools/api/`. Doc comments in the
  packages are the content: `bun tools/api/run.ts --coverage` lists every undocumented export.
- `bun run generators` reads every registered generator's roles, parameter specs, defaults and
  presets into `src/generated/generators.json`.

Both read the sibling repos, so they need the Voxolith workspace layout; CI checks the packages out
alongside. `bun run links` checks every internal link in `out/` after a build.

## License

[MIT](LICENSE)
