import { createGetUrl } from 'fumadocs-core/source';

export const appName = 'Voxolith';
export const siteUrl = 'https://voxolith.github.io';
export const tagline = 'WebGPU voxel engine for the browser';
export const description =
  'Open-source WebGPU voxel engine for the browser: raymarched worlds with shadows, lights and weather, procedural generators, and .vox and .mca support.';

export const docsRoute = '/docs';
export const docsImageRoute = '/og/docs';
export const docsContentRoute = '/llms.mdx/docs';

export const gitConfig = {
  user: 'voxolith',
  repo: 'voxolith.github.io',
  branch: 'main',
};

/** The live apps, each its own GitHub Pages site under this domain. Also feeds the sitemap. */
export const demos = [
  {
    title: 'World',
    href: '/examples/world/',
    image: '/shots/world.webp',
    text: 'A generated valley: terrain, a river with animated water, a village and a forest, a lamp to carry and a day/night toggle.',
  },
  {
    title: 'Valley',
    href: '/examples/valley/',
    image: '/shots/valley.webp',
    text: 'The same valley in 2 cm or 1 cm voxels: refined models drawn as instances, the ground streamed in chunks.',
  },
  {
    title: 'Nightwood',
    href: '/examples/nightwood/',
    image: '/shots/nightwood.webp',
    text: 'A misty forest at night in 2 cm or 1 cm voxels: moonlight through the canopy, a lit cottage and fireflies. Look around; fog sets the view distance.',
  },
  {
    title: 'Demolition Shot',
    href: '/demolition-shot/',
    image: '/shots/demolition-shot.webp',
    text: 'Aim, release, watch it crumble. A mobile voxel demolition game, installable as a PWA.',
  },
  {
    title: 'Creature',
    href: '/examples/creature/',
    image: '/shots/creature.webp',
    text: 'Rigged, animated rats from the creature generator. Tap to wound one, tap again to sever a limb.',
  },
  {
    title: 'Swarm',
    href: '/examples/swarm/',
    image: '/shots/swarm.webp',
    text: 'Hundreds of animated rats sharing a pose cache and a budgeted crowd stamper, with a live cost overlay.',
  },
  {
    title: 'Viewer',
    href: '/viewer/',
    image: '/shots/viewer.webp',
    text: 'Open MagicaVoxel .vox files and Minecraft .mca regions, or build models from the generators.',
  },
] as const;

/** Every live page outside this site, for the sitemap. */
export const appPages = [
  '/viewer/',
  '/editor/',
  '/demolition-shot/',
  '/examples/',
  '/examples/hello-vox/',
  '/examples/orbit/',
  '/examples/minecraft-region/',
  '/examples/world/',
  '/examples/valley/',
  '/examples/nightwood/',
  '/examples/creature/',
  '/examples/swarm/',
  '/examples/instances/',
  '/examples/rigged/',
];

const getContentUrl = createGetUrl(docsContentRoute);

export function getPageMarkdownUrl(page: { slugs: string[]; locale?: string }) {
  const segments = [...page.slugs, 'content.md'];
  return { segments, url: getContentUrl(segments, page.locale) };
}

const getImageUrl = createGetUrl(docsImageRoute);

/**
 * Generated API pages below a module (one per exported symbol, hundreds of them) share the site's
 * social image rather than each rendering one; module and hand-written pages get their own.
 */
export function hasOwnImage(page: { slugs: string[] }) {
  const api = page.slugs.indexOf('api');
  return api === -1 || page.slugs.length - api <= 3;
}

export function getPageImageUrl(page: { slugs: string[]; locale?: string }) {
  const segments = [...page.slugs, 'image.png'];
  return { segments, url: getImageUrl(segments, page.locale) };
}
