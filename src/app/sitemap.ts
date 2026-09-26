import type { MetadataRoute } from 'next';
import { source } from '@/lib/source';
import { appPages, siteUrl } from '@/lib/shared';

export const dynamic = 'force-static';

// One sitemap for the whole domain: this site, its docs, and the app pages served from the
// other repos' Pages sites under the same origin (a sitemap at the root may list them all).
export default function sitemap(): MetadataRoute.Sitemap {
  const url = (path: string) => new URL(path, siteUrl).toString();
  return [
    { url: url('/'), priority: 1 },
    ...source.getPages().map((page) => ({ url: url(`${page.url}/`), priority: 0.8 })),
    ...appPages.map((path) => ({ url: url(path), priority: 0.6 })),
  ];
}
