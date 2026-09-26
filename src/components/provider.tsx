'use client';
import SearchDialog from '@/components/search';
import { RootProvider } from 'fumadocs-ui/provider/next';
import { type ReactNode } from 'react';

// The theme is stored under the same key as the apps' toggle (branding/web/theme.ts), so a choice
// made here carries over to /viewer/, /examples/ and the rest: they share this origin. "system"
// reads as "no choice" to the apps, which then follow the OS as this site does. data-theme drives
// the brand tokens; the class drives Fumadocs' dark: variants.
export function Provider({ children }: { children: ReactNode }) {
  return (
    <RootProvider
      search={{ SearchDialog }}
      theme={{ attribute: ['class', 'data-theme'], storageKey: 'voxolith-theme', defaultTheme: 'system' }}
    >
      {children}
    </RootProvider>
  );
}
