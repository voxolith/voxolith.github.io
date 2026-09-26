// The docs layout (DocsLayout) is rendered by each page instead, with a page tree trimmed for that
// page (src/lib/tree.ts): the full tree, with every generated API symbol, is too big to embed in
// all of them.
export default function Layout({ children }: LayoutProps<'/docs'>) {
  return children;
}
