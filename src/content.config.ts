import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

/**
 * 这个文件只做一件事：告诉 Astro「src/content/ 下的目录是内容集合」，
 * 避免它自己去推断并打印弃用警告。
 *
 * 本站的文章并不通过 astro:content 读取 —— 页面和写文章接口都用
 * src/lib/posts.ts 在运行时直接读文件，frontmatter 的解析与校验也在
 * src/lib/frontmatter.mjs 里。所以这里的 schema 故意保持空对象：
 * 既不重复那套规则，也不会因为字段差异而报错。
 */
const blog = defineCollection({
  loader: glob({ base: './src/content/blog', pattern: '**/*.md' }),
  schema: z.object({}),
});

const pages = defineCollection({
  loader: glob({ base: './src/content/pages', pattern: '**/*.md' }),
  schema: z.object({}),
});

export const collections = { blog, pages };

