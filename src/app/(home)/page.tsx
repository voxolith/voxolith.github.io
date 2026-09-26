import Link from 'next/link';
import { appName, demos, description, siteUrl } from '@/lib/shared';

const features = [
  {
    title: 'Raymarched, not meshed',
    text: 'Every pixel walks a two-level brick index on the GPU. Worlds of 12800 x 2048 x 12800 voxels start at 5 MB and cost only what is there.',
  },
  {
    title: 'Light and weather',
    text: 'Soft shadows, ambient occlusion, a sun and moon, up to 32 shadowed point lights, fog, clouds, rain, snow and animated water.',
  },
  {
    title: 'Instances',
    text: 'Upload a model once and draw it anywhere, at any heading and fractional position, with a palette of its own.',
  },
  {
    title: 'Generators',
    text: 'Deterministic, seedable trees, bushes, grass, rocks, buildings, rigged creatures and terrain, at 10, 50 or 100 voxels per metre.',
  },
  {
    title: 'Animation',
    text: 'Skeletal rigs and clips baked into voxels, crowds with a pose cache, and damage that opens fur onto flesh and bone.',
  },
  {
    title: 'Formats',
    text: 'Full MagicaVoxel .vox read and write (scene graph, materials, animation), and Minecraft .mca regions.',
  },
];

const packages = [
  {
    name: '@voxolith/renderer',
    href: 'https://github.com/voxolith/renderer',
    text: 'The WebGPU raymarcher: storage, instances, lighting, atmosphere, cameras, .vox and .mca I/O.',
  },
  {
    name: '@voxolith/engine',
    href: 'https://github.com/voxolith/engine',
    text: 'Entities and colour roles, the generator contract, placement, streaming, input, animation and atmosphere.',
  },
  {
    name: '@voxolith/gen-*',
    href: 'https://github.com/voxolith/generators',
    text: 'The procedural generators and gen-kit, the toolkit and headless preview renderer they are written with.',
  },
];

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareSourceCode',
  name: appName,
  description,
  url: siteUrl,
  codeRepository: 'https://github.com/voxolith/renderer',
  programmingLanguage: ['TypeScript', 'WGSL'],
  runtimePlatform: 'WebGPU',
  license: 'https://opensource.org/license/mit',
};

export default function HomePage() {
  return (
    <main className="flex flex-col flex-1">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <section className="px-6 pt-20 pb-14 text-center max-w-4xl mx-auto">
        {/* Two images rather than a <picture>: they follow the site's theme toggle, not only the OS. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/brand/lockup.svg" alt="Voxolith, WebGPU voxel engine" width={420} className="mx-auto mb-10 dark:hidden" />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/brand/lockup-dark.svg" alt="Voxolith, WebGPU voxel engine" width={420} className="mx-auto mb-10 hidden dark:block" />
        <h1 className="text-4xl sm:text-5xl font-bold tracking-tight mb-6">A WebGPU voxel engine for the browser</h1>
        <p className="text-lg text-fd-muted-foreground mb-8">
          Voxolith raymarches large voxel worlds straight on the GPU, with soft shadows, lights, water and weather,
          and fills them with procedurally generated trees, rocks, buildings and animated creatures. Open source, MIT
          licensed, written in TypeScript and WGSL.
        </p>
        <div className="flex flex-wrap gap-3 justify-center">
          <Link href="/docs/" className="rounded-lg bg-fd-primary text-fd-primary-foreground px-5 py-2.5 font-medium">
            Get started
          </Link>
          <a href="/examples/" className="rounded-lg border border-fd-border bg-fd-secondary px-5 py-2.5 font-medium">
            Try the examples
          </a>
          <a
            href="https://github.com/voxolith"
            className="rounded-lg border border-fd-border bg-fd-secondary px-5 py-2.5 font-medium"
          >
            GitHub
          </a>
        </div>
      </section>

      <section className="px-6 pb-16 max-w-6xl mx-auto w-full">
        <h2 className="text-2xl font-semibold mb-2">Live demos</h2>
        <p className="text-fd-muted-foreground mb-6">
          They run in your browser and need WebGPU: current Chrome or Edge, Safari 26+, or Firefox with WebGPU enabled.
        </p>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {demos.map((d) => (
            <a
              key={d.href}
              href={d.href}
              className="group rounded-xl border border-fd-border bg-fd-card overflow-hidden hover:border-fd-primary transition-colors"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={d.image} alt={`${d.title}: screenshot`} loading="lazy" className="aspect-video w-full object-cover bg-fd-muted" />
              <div className="p-4">
                <h3 className="font-semibold mb-1 group-hover:text-fd-primary">{d.title}</h3>
                <p className="text-sm text-fd-muted-foreground">{d.text}</p>
              </div>
            </a>
          ))}
        </div>
      </section>

      <section className="px-6 pb-16 max-w-6xl mx-auto w-full">
        <h2 className="text-2xl font-semibold mb-6">What it does</h2>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f) => (
            <div key={f.title} className="rounded-xl border border-fd-border bg-fd-card p-5">
              <h3 className="font-semibold mb-2">{f.title}</h3>
              <p className="text-sm text-fd-muted-foreground">{f.text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="px-6 pb-16 max-w-6xl mx-auto w-full">
        <h2 className="text-2xl font-semibold mb-6">Packages</h2>
        <div className="grid gap-5 md:grid-cols-3">
          {packages.map((p) => (
            <a key={p.name} href={p.href} className="rounded-xl border border-fd-border bg-fd-card p-5 hover:border-fd-primary">
              <code className="font-semibold">{p.name}</code>
              <p className="text-sm text-fd-muted-foreground mt-2">{p.text}</p>
            </a>
          ))}
        </div>
      </section>

      <section className="px-6 pb-20 max-w-3xl mx-auto text-center">
        <h2 className="text-2xl font-semibold mb-3">Built with AI assistance</h2>
        <p className="text-fd-muted-foreground">
          Almost all of Voxolith&apos;s code is written with Claude, then directed, reviewed and run by a human.
          Contributions are welcome, AI-assisted ones included. See{' '}
          <Link href="/docs/contributing/" className="underline">
            contributing
          </Link>
          .
        </p>
      </section>
    </main>
  );
}
