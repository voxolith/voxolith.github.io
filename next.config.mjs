import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createMDX } from 'fumadocs-mdx/next';

// Inside the local Voxolith workspace, dependencies are installed from the workspace root and
// live outside this repo, where Turbopack would not look. Point its root there when this site is
// one of the root's workspaces; a standalone checkout (CI) keeps its own folder.
const here = dirname(fileURLToPath(import.meta.url));
const parent = join(here, '..', 'package.json');
const inWorkspace =
  existsSync(parent) && (JSON.parse(readFileSync(parent, 'utf8')).workspaces ?? []).includes('voxolith.github.io');

const withMDX = createMDX();

/**
 * A static export for GitHub Pages: `next build` writes out/, which the Pages
 * workflow publishes at https://voxolith.github.io/. The apps (viewer, editor,
 * examples, demolition-shot) are separate Pages sites under their own paths.
 *
 * @type {import('next').NextConfig}
 */
const config = {
  output: 'export',
  trailingSlash: true,
  images: { unoptimized: true },
  reactStrictMode: true,
  turbopack: { root: inWorkspace ? join(here, '..') : here },
  // Don't write AGENTS.md / CLAUDE.md into the repo on `next dev`.
  agentRules: false,
};

export default withMDX(config);
