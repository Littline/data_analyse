import type { APIContext } from 'astro';
import { renderMarkdown } from '../../lib/markdown.mjs';
import { json, readBody } from '../../lib/api';

/** 编辑器右侧的实时预览：用与博客正文完全相同的渲染管线 */
export async function POST({ request }: APIContext) {
  const body = await readBody(request);

  try {
    const { html } = await renderMarkdown(String(body.body ?? ''));
    return json({ html });
  } catch (error) {
    return json({ errors: [`Markdown 渲染失败：${error.message}`] }, 400);
  }
}

