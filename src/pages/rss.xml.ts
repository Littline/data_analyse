import rss from '@astrojs/rss';
import type { APIContext } from 'astro';
import { siteConfig } from '../consts';
import { listPosts } from '../lib/posts';
import { excerptOf, postUrl } from '../utils/format';

export async function GET(context: APIContext) {
  const posts = await listPosts();

  return rss({
    title: siteConfig.title,
    description: siteConfig.description,
    site: context.site ?? context.url.origin,
    customData: '<language>zh-cn</language>',
    items: posts.map((post) => ({
      title: post.data.title,
      description: excerptOf(post, 200),
      pubDate: post.data.pubDate,
      link: postUrl(post),
      categories: post.data.tags,
      author: post.data.author ?? siteConfig.author,
    })),
  });
}

