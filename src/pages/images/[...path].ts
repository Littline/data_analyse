import fs from 'node:fs/promises';
import path from 'node:path';
import type { APIContext } from 'astro';

const MIME_TYPES: Record<string, string> = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.avif': 'image/avif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
};

/**
 * 运行时提供 /images/*：
 * 运行期间往 public/images/ 里新增的图片无需重新构建即可访问
 * （构建时已存在的图片由静态资源直接返回，不会走到这里）。
 */
export async function GET({ params }: APIContext) {
  const root = path.resolve(process.cwd(), 'public', 'images');
  const requested = decodeURIComponent(params.path ?? '');
  const target = path.resolve(root, requested);
  const relative = path.relative(root, target);

  if (!requested || relative.startsWith('..') || path.isAbsolute(relative)) {
    return new Response('Not Found', { status: 404 });
  }

  const extension = path.extname(target).toLowerCase();
  const contentType = MIME_TYPES[extension];
  if (!contentType) return new Response('Not Found', { status: 404 });

  try {
    const data = await fs.readFile(target);
    return new Response(data, {
      headers: { 'Content-Type': contentType, 'Cache-Control': 'public, max-age=60' },
    });
  } catch {
    return new Response('Not Found', { status: 404 });
  }
}

