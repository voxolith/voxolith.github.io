import type * as PageTree from 'fumadocs-core/page-tree';
import { source } from './source';

// The generated API reference has hundreds of symbol pages, and every page embeds the sidebar's
// page tree (Next writes it again into each page's RSC payloads). So each page gets a trimmed
// tree: every API module collapses to a link to its page, except the module the page is in, which
// keeps its Functions / Classes / ... folders. Section tabs and navigation are unchanged.

const KIND_FOLDERS = new Set(['Functions', 'Classes', 'Interfaces', 'Types', 'Variables', 'Enums', 'Namespaces']);

function isModule(node: PageTree.Folder): boolean {
  return (
    !!node.index?.url.includes('/api/') &&
    node.children.some((c) => c.type === 'folder' && typeof c.name === 'string' && KIND_FOLDERS.has(c.name))
  );
}

const within = (url: string, prefix: string) => url === prefix || url.startsWith(`${prefix}/`);

/** The page tree for the page at `url` (a page URL as the loader gives it, without a trailing slash). */
export function treeFor(url: string): PageTree.Root {
  const full = source.getPageTree();
  let current = 'none';

  function trim(node: PageTree.Node): PageTree.Node {
    if (node.type !== 'folder') return node;
    if (isModule(node)) {
      const index = node.index!;
      if (within(url, index.url)) {
        current = index.url;
        return node;
      }
      return { type: 'page', name: node.name, url: index.url, $id: node.$id } satisfies PageTree.Item;
    }
    return { ...node, children: node.children.map(trim) };
  }

  const children = full.children.map(trim);
  // The sidebar memoises the tree by its root $id, so a different trim needs a different id.
  return { ...full, children, $id: `${full.$id ?? 'root'}:${current}` };
}
