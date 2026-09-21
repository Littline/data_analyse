/**
 * 评论存储：每篇文章一个 JSON 文件，放在 data/comments/ 下。
 *
 * 为什么用文件而不是数据库：和文章一样，「内容就是文件」，
 * 备份、迁移、查看都用同一种方式，不需要额外安装服务。
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import { createHash, randomUUID } from 'node:crypto';
import { writeAtomic } from './atomic';
import { isValidId, trimSlashes } from './ids';

export interface Comment {
  id: string;
  author: string;
  /** 邮箱只存不公开，仅后台可见 */
  email?: string;
  website?: string;
  body: string;
  createdAt: string;
  /** 访客 IP 的哈希值，用于排查滥用，不保存明文 */
  ipHash?: string;
}

export interface CommentInput {
  postId?: string;
  author?: string;
  email?: string;
  website?: string;
  body?: string;
  /** 蜜罐字段：正常用户看不到也填不了，填了说明是机器人 */
  nickname?: string;
}

export type CommentResult =
  | { ok: true; comment: Comment | null; skipped?: boolean }
  | { ok: false; errors: string[]; status: number };

const MAX_BODY = 2000;
const MAX_AUTHOR = 40;
const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000;
const RATE_LIMIT_MAX = 5;

/** 简单的内存限流：同一个人 10 分钟内最多 5 条 */
const recentPosts = new Map<string, number[]>();

export function commentsDir(): string {
  const custom = process.env.BLOG_COMMENTS_DIR;
  return custom ? path.resolve(custom) : path.resolve(process.cwd(), 'data', 'comments');
}

function fileFor(postId: string): string | null {
  if (!isValidId(postId)) return null;
  return path.join(commentsDir(), `${postId.replace(/\//g, '__')}.json`);
}

function hashIp(ip: string): string {
  const salt = process.env.COMMENT_SALT ?? 'astro-md-blog';
  return createHash('sha256').update(`${ip}|${salt}`).digest('hex').slice(0, 16);
}

function toOptionalString(value: unknown, max: number): string | undefined {
  if (typeof value !== 'string') return undefined;
  const text = value.trim().replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g, '');
  if (!text) return undefined;
  return text.slice(0, max);
}

function isEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function normalizeWebsite(value: string): string | null {
  const text = value.trim();
  if (/^https?:\/\/\S+$/i.test(text)) return text;
  if (/^[\w-]+(\.[\w-]+)+(\/\S*)?$/.test(text)) return `https://${text}`;
  return null;
}

export function validateComment(input: CommentInput) {
  const errors: string[] = [];
  const author = toOptionalString(input.author, MAX_AUTHOR) ?? '匿名';

  const body = typeof input.body === 'string' ? input.body.trim() : '';
  if (!body) {
    errors.push('评论内容不能为空');
  } else if (body.length > MAX_BODY) {
    errors.push(`评论内容过长（${body.length} 字），请控制在 ${MAX_BODY} 字以内`);
  }

  let email: string | undefined;
  const rawEmail = toOptionalString(input.email, 120);
  if (rawEmail) {
    if (!isEmail(rawEmail)) errors.push('邮箱格式不正确');
    else email = rawEmail;
  }

  let website: string | undefined;
  const rawWebsite = toOptionalString(input.website, 200);
  if (rawWebsite) {
    const normalized = normalizeWebsite(rawWebsite);
    if (!normalized) errors.push('网站地址格式不正确，请填写完整的网址');
    else website = normalized;
  }

  return { errors, data: { author, body, email, website } };
}

/** 读取某篇文章的评论，按时间正序 */
export async function listComments(postId: string): Promise<Comment[]> {
  const file = fileFor(postId);
  if (!file) return [];

  try {
    const raw = await fs.readFile(file, 'utf8');
    const parsed = JSON.parse(raw);
    const comments = Array.isArray(parsed?.comments) ? parsed.comments : [];

    return comments
      .filter((item: unknown): item is Comment => Boolean(item && typeof item === 'object'))
      .sort((a: Comment, b: Comment) => a.createdAt.localeCompare(b.createdAt));
  } catch {
    return [];
  }
}

export async function countComments(postId: string): Promise<number> {
  return (await listComments(postId)).length;
}

/** 后台用：把 data/comments 下所有评论读出来 */
export async function listAllComments(): Promise<Array<{ postId: string; comments: Comment[] }>> {
  const dir = commentsDir();
  let entries;

  try {
    entries = await fs.readdir(dir, { withFileTypes: true });
  } catch {
    return [];
  }

  const groups: Array<{ postId: string; comments: Comment[] }> = [];

  for (const entry of entries) {
    if (!entry.isFile() || !entry.name.endsWith('.json')) continue;

    try {
      const parsed = JSON.parse(await fs.readFile(path.join(dir, entry.name), 'utf8'));
      const postId = typeof parsed?.postId === 'string' ? parsed.postId : entry.name.replace(/\.json$/, '').replace(/__/g, '/');
      const comments: Comment[] = Array.isArray(parsed?.comments) ? parsed.comments : [];
      if (comments.length > 0) groups.push({ postId, comments });
    } catch {
      // 坏掉的文件跳过
    }
  }

  return groups.sort((a, b) => b.comments.length - a.comments.length);
}

async function writeComments(postId: string, comments: Comment[]): Promise<void> {
  const file = fileFor(postId);
  if (!file) throw new Error(`非法的文章 id：${postId}`);

  if (comments.length === 0) {
    await fs.rm(file, { force: true });
    return;
  }

  await writeAtomic(file, `${JSON.stringify({ postId, comments }, null, 2)}\n`);
}

/** 发表评论 */
export async function addComment(
  input: CommentInput,
  meta: { ip?: string } = {},
): Promise<CommentResult> {
  const postId = trimSlashes(input.postId ?? '');
  if (!isValidId(postId)) {
    return { ok: false, errors: ['文章不存在'], status: 404 };
  }

  // 蜜罐被填：直接假装成功，不写入任何内容
  if (toOptionalString(input.nickname, 100)) {
    return { ok: true, comment: null, skipped: true };
  }

  const ipHash = hashIp(meta.ip ?? 'unknown');
  const now = Date.now();
  const history = (recentPosts.get(ipHash) ?? []).filter((time) => now - time < RATE_LIMIT_WINDOW_MS);

  if (history.length >= RATE_LIMIT_MAX) {
    return { ok: false, errors: ['评论太频繁了，请过几分钟再试'], status: 429 };
  }

  const { errors, data } = validateComment(input);
  if (errors.length > 0) return { ok: false, errors, status: 400 };

  const comment: Comment = {
    id: randomUUID(),
    author: data.author,
    body: data.body,
    createdAt: new Date().toISOString(),
    ipHash,
    ...(data.email ? { email: data.email } : {}),
    ...(data.website ? { website: data.website } : {}),
  };

  const comments = await listComments(postId);
  comments.push(comment);
  await writeComments(postId, comments);

  recentPosts.set(ipHash, [...history, now]);
  return { ok: true, comment };
}

export async function deleteComment(postId: string, commentId: string): Promise<boolean> {
  const comments = await listComments(postId);
  const next = comments.filter((comment) => comment.id !== commentId);

  if (next.length === comments.length) return false;

  await writeComments(postId, next);
  return true;
}

/** 文章改名时，把评论一起搬过去 */
export async function renameComments(fromPostId: string, toPostId: string): Promise<void> {
  const comments = await listComments(fromPostId);
  if (comments.length === 0) return;

  await writeComments(toPostId, comments);
  await writeComments(fromPostId, []);
}

/** 文章删除时，一并删除它的评论 */
export async function deleteCommentsForPost(postId: string): Promise<void> {
  await writeComments(postId, []);
}

