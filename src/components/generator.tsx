import { readFileSync } from 'node:fs';
import { join } from 'node:path';

// Renders a generator's reference from src/generated/generators.json, which tools/generators.ts
// writes from the live generator objects. Read at build time (the site is a static export), and
// read from disk rather than imported so a typecheck does not need the generated file.

interface Spec {
  path: string;
  label: string;
  kind: 'number' | 'int' | 'bool' | 'enum';
  min?: number;
  max?: number;
  step?: number;
  options?: string[];
  group?: string;
  help?: string;
  default: unknown;
}
interface Generator {
  id: string;
  name: string;
  version: string;
  description: string;
  scales: number[];
  looseRoles: string[];
  roles: { id: string; name: string; color: string; material: string | null }[];
  params: Spec[];
  presets: { name: string; values: Record<string, unknown> }[];
}
interface Data {
  packages: Record<string, { name: string; version: string; description: string; generators: Generator[] }>;
}

let cache: Data | null = null;
function data(): Data {
  cache ??= JSON.parse(readFileSync(join(process.cwd(), 'src', 'generated', 'generators.json'), 'utf8')) as Data;
  return cache;
}

function find(id: string): Generator | undefined {
  for (const p of Object.values(data().packages)) {
    const g = p.generators.find((x) => x.id === id);
    if (g) return g;
  }
}

function show(v: unknown): string {
  if (typeof v === 'number') return Number.isInteger(v) ? String(v) : String(+v.toFixed(4));
  if (typeof v === 'boolean') return v ? 'yes' : 'no';
  if (v === undefined || v === null) return '-';
  return String(v);
}

function range(s: Spec): string {
  if (s.kind === 'bool') return 'yes / no';
  if (s.kind === 'enum') return (s.options ?? []).join(', ');
  const step = s.kind === 'number' && s.step !== undefined ? `, step ${show(s.step)}` : '';
  return `${show(s.min)} to ${show(s.max)}${step}`;
}

function groups(params: Spec[]): [string, Spec[]][] {
  const out = new Map<string, Spec[]>();
  for (const s of params) {
    const g = s.group ?? 'Parameters';
    out.set(g, [...(out.get(g) ?? []), s]);
  }
  return [...out];
}

const cell = 'border-b border-fd-border px-3 py-2 align-top text-left';

/** The parameters, presets and roles of one generator. */
export function GeneratorReference({ id }: { id: string }) {
  const g = find(id);
  if (!g) throw new Error(`GeneratorReference: no generator "${id}" in src/generated/generators.json`);
  return (
    <div className="not-prose flex flex-col gap-8 my-6">
      <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-1 text-sm">
        <dt className="text-fd-muted-foreground">Id</dt>
        <dd>
          <code>{g.id}</code>
        </dd>
        <dt className="text-fd-muted-foreground">Version</dt>
        <dd>{g.version}</dd>
        <dt className="text-fd-muted-foreground">Scales</dt>
        <dd>10{g.scales.map((s) => `, ${s}`).join('')} voxels per metre</dd>
      </dl>

      <section>
        <h3 className="font-semibold text-lg mb-3">Parameters</h3>
        {groups(g.params).map(([group, specs]) => (
          <div key={group} className="mb-6 overflow-x-auto">
            <h4 className="font-medium mb-2">{group}</h4>
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="text-fd-muted-foreground">
                  <th className={cell}>Parameter</th>
                  <th className={cell}>Path</th>
                  <th className={cell}>Range</th>
                  <th className={cell}>Default</th>
                </tr>
              </thead>
              <tbody>
                {specs.map((s) => (
                  <tr key={s.path}>
                    <td className={cell}>
                      <div className="font-medium">{s.label}</div>
                      {s.help && <div className="text-fd-muted-foreground">{s.help}</div>}
                    </td>
                    <td className={cell}>
                      <code>{s.path}</code>
                    </td>
                    <td className={cell}>{range(s)}</td>
                    <td className={cell}>{show(s.default)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))}
      </section>

      {g.presets.length > 0 && (
        <section className="overflow-x-auto">
          <h3 className="font-semibold text-lg mb-3">Presets</h3>
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="text-fd-muted-foreground">
                <th className={cell}>Parameter</th>
                {g.presets.map((p) => (
                  <th key={p.name} className={cell}>
                    {p.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {g.params.map((s) => (
                <tr key={s.path}>
                  <td className={cell}>{s.label}</td>
                  {g.presets.map((p) => (
                    <td key={p.name} className={cell}>
                      {show(p.values[s.path])}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}

      <section>
        <h3 className="font-semibold text-lg mb-3">Roles</h3>
        <p className="text-sm text-fd-muted-foreground mb-3">
          Voxel values are these roles, in this order (value 1 is the first). The colours are the defaults; a host maps
          each role to a palette slot and can restyle it.
        </p>
        <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3 text-sm">
          {g.roles.map((r, i) => (
            <li key={r.id} className="flex items-center gap-3">
              <span
                className="inline-block size-5 rounded border border-fd-border shrink-0"
                style={{ background: r.color }}
                aria-hidden
              />
              <span className="text-fd-muted-foreground w-6 text-right">{i + 1}</span>
              <span>
                {r.name} <code className="text-xs">{r.id}</code>
                {r.material && <span className="text-fd-muted-foreground"> ({r.material})</span>}
                {g.looseRoles.includes(r.id) && <span className="text-fd-muted-foreground"> · may float when refined</span>}
              </span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
