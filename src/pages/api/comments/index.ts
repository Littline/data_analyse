import type { APIContext } from 'astro';
import { addComment } from '../../../lib/comments';
import { getPost } from '../../../lib/posts';
import { json, readBody } from '../../../lib/api';

/**
 * 发表评论（对访客开放）
 * 返回的 comment 里不含邮箱等隐私字段
 */
export async function POST({ request, clientAddress }: APIContext) {
  const body = await readBody(request);

  try {
    const postId = String(body.postId ?? '').trim().replace(/^\/+|\/+$/g, '');
    const post = postId ? await getPost(postId) : null;

    if (!post) {
      return json({ errors: ['文章不存在或尚未公开，无法评论'] }, 404);
    }

    const result = await addComment(body, { ip: clientAddress });

    if (!result.ok) {
      return json({ errors: result.errors }, result.status);
    }

    return json({ ok: true, id: result.comment?.id ?? null }, 201);
  } catch (error) {
    return json({ errors: [`评论保存失败：${error.message}`] }, 500);
  }
}

