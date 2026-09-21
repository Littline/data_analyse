import fs from 'node:fs/promises';
import path from 'node:path';
import {
  parseFrontmatter,
  serializePost,
  validatePostData,
} from './frontmatter.mjs';
import { renderMarkdown } from './markdown.mjs';
import { writeAtomic } from './atomic';
import { idFromTitle, isValidId } from './ids';
import { deleteCommentsForPost, renameComments } from './comments';

export interface PostData {
  title: string;
  description?: string;
  pubDate: Date;
  updatedDate?: Date;
  author?: string;
  tags: string[];
  category?: string;
  cover?: string;
  draft: boolean;
  featured: boolean;
}

export interface Post {
  /** 相对内容目录的路径（去扩展名），也就是网址里的那段 */
  id: string;
  data: PostData;
  /** Markdown 正文（不含 frontmatter） */
  body: string;
  filePath: string;
  mtimeMs: number;
}

export interface ProblemFile {
  id: string;
  message: string;
}

export interface SaveInput {
  id?: string;
  title?: string;
  description?: string;
  pubDate?: string;
  updatedDate?: string;
  author?: string;
  tags?: string | string[];
  category?: string;
  cover?: string;
  draft?: boolean;
  featured?: boolean;
  body?: string;
}

export type SaveResult =
  | { ok: true; post: Post }
  | { ok: false; errors: string[]; status?: number };

/** 文章目录：默认 src/content/blog，可用环境变量 BLOG_CONTENT_DIR 覆盖 */
export function contentDir(): string {
  const custom = process.env.BLOG_CONTENT_DIR;
  return custom ? path.resolve(custom) : path.resolve(process.cwd(), 'src', 'content', 'blog');
}

function toFilePath(id: string): string {
  if (!isValidId(id)) throw new Error(`非法的文章 id：${id}`);

  const dir = contentDir();
  const filePath = path.resolve(dir, `${id}.md`);
  const relative = path.relative(dir, filePath);

  if (relative.startsWith('..') || path.isAbsolute(relative)) {
    throw new Error(`文章路径越界：${id}`);
  }

  return filePath;
}

async function walk(dir: string): Promise<string[]> {
  let entries;
  try {
    entries = await fs.readdir(dir, { withFileTypes: true });
  } catch (error) {
    if (error.code === 'ENOENT') return [];
    throw error;
  }

  const files: string[] = [];
  for (const entry of entries) {
    // 以 _ 或 . 开头的文件/目录不参与构建，可用于临时下线某篇文章
    if (entry.name.startsWith('_') || entry.name.startsWith('.')) continue;

    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await walk(full)));
    } else if (entry.isFile() && /\.md$/i.test(entry.name)) {
      files.push(full);
    }
  }
  return files;
}

function toId(filePath: string, root: string): string {
  return path
    .relative(root, filePath)
    .replace(/\\/g, '/')
    .replace(/\.md$/i, '');
}

async function readPostFile(filePath: string, root: string): Promise<Post> {
  const [raw, stat] = await Promise.all([fs.readFile(filePath, 'utf8'), fs.stat(filePath)]);
  const { data: frontmatter, body } = parseFrontmatter(raw);
  const { data, errors } = validatePostData(frontmatter);

  if (errors.length > 0) {
    throw new Error(errors.join('；'));
  }

  return {
    id: toId(filePath, root),
    data,
    body,
    filePath,
    mtimeMs: stat.mtimeMs,
  };
}

/** 列出全部文章（默认不含草稿），按发布日期倒序 */
export async function listPosts(options: { includeDrafts?: boolean } = {}): Promise<Post[]> {
  const { includeDrafts = false } = options;
  const root = contentDir();
  const files = await walk(root);

  const posts: Post[] = [];
  for (const filePath of files) {
    try {
      const post = await readPostFile(filePath, root);
      if (includeDrafts || !post.data.draft) posts.push(post);
    } catch {
      // 单个文件有问题不应该拖垮整站，交给 listProblems() 在后台提示
    }
  }

  return posts.sort((a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf());
}

/** 扫描 frontmatter 有问题的文件，供管理后台提示 */
export async function listProblems(): Promise<ProblemFile[]> {
  const root = contentDir();
  const files = await walk(root);
  const problems: ProblemFile[] = [];

  for (const filePath of files) {
    try {
      await readPostFile(filePath, root);
    } catch (error) {
      problems.push({ id: toId(filePath, root), message: error.message });
    }
  }

  return problems;
}

export async function getPost(id: string, options: { includeDrafts?: boolean } = {}): Promise<Post | null> {
  const { includeDrafts = false } = options;
  if (!isValidId(id)) return null;

  try {
    const post = await readPostFile(toFilePath(id), contentDir());
    if (!includeDrafts && post.data.draft) return null;
    return post;
  } catch {
    return null;
  }
}

export async function getPostProblem(id: string): Promise<string | null> {
  if (!isValidId(id)) return `非法的文章 id：${id}`;
  try {
    await readPostFile(toFilePath(id), contentDir());
    return null;
  } catch (error) {
    return error.message;
  }
}

/** 原始文件内容，供编辑器回填表单 */
export async function getPostSource(id: string): Promise<{ id: string; raw: string } | null> {
  if (!isValidId(id)) return null;
  try {
    const filePath = toFilePath(id);
    const raw = await fs.readFile(filePath, 'utf8');
    return { id, raw };
  } catch {
    return null;
  }
}

async function resolveTargetId(input: SaveInput): Promise<string> {
  const provided = (input.id ?? '').trim().replace(/^\/+|\/+$/g, '');
  const candidate = provided || idFromTitle(input.title ?? '');

  if (!isValidId(candidate)) {
    throw Object.assign(new Error('文件名只能用中文、英文字母、数字、下划线、连字符和 /（用于分组）'), {
      userError: true,
    });
  }

  return candidate;
}

export async function createPost(input: SaveInput): Promise<SaveResult> {
  const { data, errors } = validatePostData(input);

  let id: string;
  try {
    id = await resolveTargetId(input);
  } catch (error) {
    return { ok: false, errors: [error.message], status: 400 };
  }

  if (errors.length > 0) return { ok: false, errors, status: 400 };

  const filePath = toFilePath(id);
  try {
    await fs.access(filePath);
    return { ok: false, errors: [`文件已存在：src/content/blog/${id}.md，请换一个文件名`], status: 409 };
  } catch {
    // 文件不存在，可以创建
  }

  await writeAtomic(filePath, serializePost(data, input.body ?? ''));
  const post = await getPost(id, { includeDrafts: true });

  return post ? { ok: true, post } : { ok: false, errors: ['保存失败：写入后无法读取该文件'], status: 500 };
}

export async function updatePost(originalId: string, input: SaveInput): Promise<SaveResult> {
  if (!isValidId(originalId)) {
    return { ok: false, errors: [`找不到文章：${originalId}`], status: 404 };
  }

  const originalPath = toFilePath(originalId);
  try {
    await fs.access(originalPath);
  } catch {
    return { ok: false, errors: [`找不到文章：${originalId}`], status: 404 };
  }

  const { data, errors } = validatePostData(input);

  let id: string;
  try {
    id = await resolveTargetId(input);
  } catch (error) {
    return { ok: false, errors: [error.message], status: 400 };
  }

  if (errors.length > 0) return { ok: false, errors, status: 400 };

  const nextPath = toFilePath(id);

  if (id !== originalId) {
    try {
      await fs.access(nextPath);
      return { ok: false, errors: [`文件已存在：src/content/blog/${id}.md，请换一个文件名`], status: 409 };
    } catch {
      // 目标文件不存在，可以改名
    }
  }

  await writeAtomic(nextPath, serializePost(data, input.body ?? ''));

  if (id !== originalId) {
    await fs.rm(originalPath, { force: true });
    renderCache.delete(originalPath);
    // 文章换了网址，把它的评论一起搬过去
    await renameComments(originalId, id);
  }

  renderCache.delete(nextPath);

  const post = await getPost(id, { includeDrafts: true });
  return post ? { ok: true, post } : { ok: false, errors: ['保存失败：写入后无法读取该文件'], status: 500 };
}

export async function deletePost(id: string): Promise<boolean> {
  if (!isValidId(id)) return false;

  try {
    const filePath = toFilePath(id);
    await fs.rm(filePath);
    renderCache.delete(filePath);
    // 文章没了，它下面的评论也一并清理
    await deleteCommentsForPost(id);
    return true;
  } catch {
    return false;
  }
}

type Rendered = Awaited<ReturnType<typeof renderMarkdown>>;

/** 按「文件修改时间 + 大小」缓存渲染结果，避免每次请求都重新渲染 */
const renderCache = new Map<string, { key: string; value: Rendered }>();

export async function renderPost(post: Post): Promise<Rendered> {
  const key = `${post.mtimeMs}:${post.body.length}`;
  const cached = renderCache.get(post.filePath);

  if (cached && cached.key === key) return cached.value;

  const value = await renderMarkdown(post.body);
  renderCache.set(post.filePath, { key, value });
  return value;
}

export { renderMarkdown };
