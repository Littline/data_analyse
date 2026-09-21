import type { APIContext } from 'astro';
import { createPost } from '../../../lib/posts';
import { json, readBody } from '../../../lib/api';
import { postUrl } from '../../../utils/format';

/** 新增文章：把网页表单的内容写成 src/content/blog/<id>.md */
export async function POST({ request }: APIContext) {
  const body = await readBody(request);

  try {
    const result = await createPost(body);

    if (!result.ok) {
      return json({ errors: result.errors }, result.status ?? 400);
    }

    return json({ ok: true, id: result.post.id, url: postUrl(result.post) }, 201);
  } catch (error) {
    return json({ errors: [`保存失败：${error.message}`] }, 500);
  }
}

