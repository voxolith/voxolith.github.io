import { execFileSync } from 'node:child_process';
import { relative } from 'node:path';
import type { MetadataRoute } from 'next';
import { source } from '@/lib/source';
import { appPages, siteUrl } from '@/lib/shared';

export const dynamic = 'force-static';

const git = (...args: string[]) =>
  execFileSync('git', args, { encoding: 'utf8', maxBuffer: 64 << 20, stdio: ['ignore', 'pipe', 'ignore'] });

/**
 * The date of the last commit that touched each tracked file, keyed by its path from the repo
 * root. Empty when there is no history to read (no git, or a shallow clone, where every file
 * would wrongly carry the date of the one commit fetched): pages then go without `<lastmod>`.
 */
function commitDates(): { root: string; dates: Map<string, string> } {
  const dates = new Map<string, string>();
  try {
    const root = git('rev-parse', '--show-toplevel').trim();
    if (git('rev-parse', '--is-shallow-repository').trim() === 'true') return { root, dates };
    // Newest first, so the first date seen for a file is its latest.
    const log = git('-c', 'core.quotePath=false', 'log', '--format=%x00%cI', '--name-only', '--', 'content/docs', 'src/app/(home)');
    let date = '';
    for (const line of log.split('\n')) {
      if (line.startsWith('\0')) date = line.slice(1);
      else if (line && !dates.has(line)) dates.set(line, date);
    }
    return { root, dates };
  } catch {
    return { root: '', dates };
  }
}

// One sitemap for the whole domain: this site, its docs, and the app pages served from the
// other repos' Pages sites under the same origin (a sitemap at the root may list them all).
// The generated API reference (one page per exported symbol, hundreds of them) is left out:
// crawlers reach it through the links on the hand-written pages.
export default function sitemap(): MetadataRoute.Sitemap {
  const url = (path: string) => new URL(path, siteUrl).toString();
  const { root, dates } = commitDates();
  const lastModified = (file: string | undefined) => (file ? dates.get(relative(root, file)) : undefined);
  return [
    { url: url('/'), lastModified: dates.get('src/app/(home)/page.tsx'), priority: 1 },
    ...source
      .getPages()
      .filter((page) => !page.slugs.includes('api'))
      .map((page) => ({ url: url(`${page.url}/`), lastModified: lastModified(page.absolutePath), priority: 0.8 })),
    // The apps live in other repos; their dates are not known here.
    ...appPages.map((path) => ({ url: url(path), priority: 0.6 })),
  ];
}
