import type { APIContext } from 'astro';
import { listPosts } from '../lib/posts';
import { isoDate, postUrl, tagUrl } from '../utils/format';

function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/** 动态站点地图：文章变动后立刻反映，不需要重新构建 */
export async function GET(context: APIContext) {
  const origin = context.site ?? context.url.origin;
  const posts = await listPosts();

  const tags = [...new Set(posts.flatMap((post) => post.data.tags))].sort((a, b) =>
    a.localeCompare(b, 'zh-CN'),
  );

  const entries = [
    { loc: new URL('/', origin).href },
    { loc: new URL('/blog/', origin).href },
    { loc: new URL('/tags/', origin).href },
    { loc: new URL('/about/', origin).href },
    ...posts.map((post) => ({
      loc: new URL(postUrl(post), origin).href,
      lastmod: isoDate(post.data.updatedDate ?? post.data.pubDate),
    })),
    ...tags.map((tag) => ({ loc: new URL(tagUrl(tag), origin).href })),
  ];

  const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries
  .map(
    (entry) =>
      `  <url><loc>${escapeXml(entry.loc)}</loc>${
        entry.lastmod ? `<lastmod>${entry.lastmod}</lastmod>` : ''
      }</url>`,
  )
  .join('\n')}
</urlset>
`;

  return new Response(body, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'no-store',
    },
  });
}

