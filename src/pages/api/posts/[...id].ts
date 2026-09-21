import type { APIContext } from 'astro';
import { deletePost, updatePost } from '../../../lib/posts';
import { json, readBody } from '../../../lib/api';
import { decodePathParam, postUrl } from '../../../utils/format';

/** 修改文章：重新写回 md 文件（允许同时改文件名） */
export async function PUT({ params, request }: APIContext) {
  const originalId = decodePathParam(params.id ?? '');

  try {
    const body = await readBody(request);
    const result = await updatePost(originalId, body);

    if (!result.ok) {
      return json({ errors: result.errors }, result.status ?? 400);
    }

    return json({ ok: true, id: result.post.id, url: postUrl(result.post) });
  } catch (error) {
    return json({ errors: [`保存失败：${error.message}`] }, 500);
  }
}

/** 删除文章：移除对应的 md 文件 */
export async function DELETE({ params }: APIContext) {
  const id = decodePathParam(params.id ?? '');

  try {
    const removed = await deletePost(id);
    return removed ? json({ ok: true, id }) : json({ errors: [`没有找到文章：${id}`] }, 404);
  } catch (error) {
    return json({ errors: [`删除失败：${error.message}`] }, 500);
  }
}

