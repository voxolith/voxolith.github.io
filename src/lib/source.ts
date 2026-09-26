import { llms, loader } from 'fumadocs-core/source';
import { lucideIconsPlugin } from 'fumadocs-core/source/plugins/lucide-icons';
import { docsContentRoute, docsImageRoute, docsRoute } from './shared';
import { defineDocs } from 'fumadocs-mdx/macro';
import { metaSchema, pageSchema } from 'fumadocs-core/source/schema';

const docs = defineDocs({
  dir: 'content/docs',
  docs: {
    schema: pageSchema,
    postprocess: {
      includeProcessedMarkdown: true,
    },
  },
  meta: {
    schema: metaSchema,
  },
});

export const source = loader({
  baseUrl: docsRoute,
  source: docs.toFumadocsSource(),
  // Section tabs (the root folders' meta.json `icon`) name lucide icons.
  plugins: [lucideIconsPlugin()],
  // Every page embeds the page tree (and Next writes it again into each page's RSC payloads), so
  // keep it to what the sidebar shows: generated API symbol pages are listed on their module's
  // page, not in the tree, and must not come back through the fallback tree.
  pageTree: { generateFallback: false, noRef: true },
});

export const docsLlms = llms(source, {
  renderPage: async (page) => `# ${page.data.title} (${page.url})

${await page.data.getText('processed')}`,
});

export { docsImageRoute, docsContentRoute };
