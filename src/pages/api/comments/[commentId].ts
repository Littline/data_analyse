import type { APIContext } from 'astro';
import { deleteComment } from '../../../lib/comments';
import { isAdmin } from '../../../lib/auth';
import { json } from '../../../lib/api';

/**
 * 删除评论：只有登录后的管理员可以操作。
 * 评论 id 在路径里，文章 id 用 ?postId=xxx 指定。
 */
export async function DELETE({ params, url, cookies }: APIContext) {
  if (!isAdmin(cookies)) {
    return json({ errors: ['只有管理员可以删除评论，请先登录'] }, 401);
  }

  const commentId = params.commentId ?? '';
  const postId = url.searchParams.get('postId') ?? '';

  try {
    const removed = await deleteComment(postId, commentId);
    return removed
      ? json({ ok: true, id: commentId })
      : json({ errors: ['没有找到这条评论，可能已经被删除'] }, 404);
  } catch (error) {
    return json({ errors: [`删除失败：${error.message}`] }, 500);
  }
}

