import type { Metadata, Viewport } from 'next';
import { Provider } from '@/components/provider';
import { appName, description, siteUrl, tagline } from '@/lib/shared';
import './global.css';

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: { default: `${appName}: ${tagline}`, template: `%s | ${appName}` },
  description,
  applicationName: appName,
  keywords: ['WebGPU', 'voxel engine', 'voxel', 'raymarching', 'WGSL', 'MagicaVoxel', 'Minecraft', 'procedural generation', 'TypeScript'],
  alternates: { canonical: '/' },
  icons: {
    icon: [
      { url: '/favicon.svg', type: 'image/svg+xml' },
      { url: '/favicon-32.png', sizes: '32x32', type: 'image/png' },
    ],
    apple: '/apple-touch-icon.png',
  },
  openGraph: {
    type: 'website',
    siteName: appName,
    url: '/',
    images: [{ url: '/brand/lockup-1280x640.png', width: 1280, height: 640, alt: 'Voxolith, WebGPU voxel engine' }],
  },
  twitter: { card: 'summary_large_image' },
  // Google Search Console ownership of https://voxolith.github.io/ (URL-prefix property).
  verification: { google: 'Plk9_lUdbmUbrXxd20iwtwlO-b139CmlsFP2_wXPIS0' },
};

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: dark)', color: '#151B29' },
    { media: '(prefers-color-scheme: light)', color: '#F6F4EE' },
  ],
};

export default function Layout({ children }: LayoutProps<'/'>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="flex flex-col min-h-screen">
        <Provider>{children}</Provider>
      </body>
    </html>
  );
}
