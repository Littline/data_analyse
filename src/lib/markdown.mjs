/**
 * Markdown 渲染：直接复用 Astro 内部同款的 markdown 处理管线，
 * 这样「网页里看到的预览」和「博客页面上的正文」渲染结果完全一致
 * （包括代码高亮、标题锚点、GFM 表格等）。
 */
import { createMarkdownProcessor } from '@astrojs/markdown-remark';

export const markdownOptions = {
  gfm: true,
  smartypants: false,
  shikiConfig: {
    themes: {
      light: 'github-light',
      dark: 'github-dark',
    },
    wrap: true,
  },
};

let processorPromise;

function getProcessor() {
  processorPromise ??= createMarkdownProcessor(markdownOptions);
  return processorPromise;
}

/** 把 Markdown 正文渲染成 HTML，并返回标题列表（用于自动生成目录） */
export async function renderMarkdown(body = '') {
  const processor = await getProcessor();
  const { code, metadata } = await processor.render(String(body ?? ''));

  return {
    html: code,
    headings: (metadata?.headings ?? []).map((heading) => ({
      depth: heading.depth,
      slug: heading.slug,
      text: heading.text,
    })),
  };
}
