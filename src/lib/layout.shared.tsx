import type { BaseLayoutProps } from 'fumadocs-ui/layouts/shared';
import { appName } from './shared';

export function baseOptions(): BaseLayoutProps {
  return {
    nav: {
      title: (
        <span className="inline-flex items-center gap-2 font-bold">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/brand/logo-mark.svg" alt="" width={22} height={22} />
          {appName.toLowerCase()}
        </span>
      ),
    },
    githubUrl: 'https://github.com/voxolith',
    links: [
      // The docs sidebar has the section switcher, so these four are for the top bar only.
      { text: 'Guide', url: '/docs/', active: 'url', on: 'nav' },
      { text: 'Renderer', url: '/docs/renderer/', active: 'nested-url', on: 'nav' },
      { text: 'Engine', url: '/docs/engine/', active: 'nested-url', on: 'nav' },
      { text: 'Generators', url: '/docs/generators/', active: 'nested-url', on: 'nav' },
      { text: 'Examples', url: '/examples/', external: true },
      { text: 'Viewer', url: '/viewer/', external: true },
    ],
  };
}
