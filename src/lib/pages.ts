/** 独立页面（src/content/pages/*.md）的读取 */
import fs from 'node:fs/promises';
import path from 'node:path';
import { parseFrontmatter, validatePageData } from './frontmatter.mjs';

export interface PageData {
  title: string;
  description?: string;
  updatedDate?: Date;
}

export interface PageContent {
  data: PageData;
  body: string;
}

function pagesDir(): string {
  const dir = path.resolve(process.cwd(), 'src', 'content', 'pages');
  return process.env.BLOG_PAGES_DIR ? path.resolve(process.env.BLOG_PAGES_DIR) : dir;
}

export async function getPage(name: string): Promise<PageContent | null> {
  if (!/^[a-z0-9_-]+$/i.test(name)) return null;

  try {
    const raw = await fs.readFile(path.join(pagesDir(), `${name}.md`), 'utf8');
    const { data, body } = parseFrontmatter(raw);
    const result = validatePageData(data);

    if (result.errors.length > 0) {
      console.warn(`[content] ${name}.md 的 frontmatter 有问题：${result.errors.join('；')}`);
      return null;
    }

    return { data: result.data, body };
  } catch {
    return null;
  }
}

