import { siteConfig } from '../consts';
import type { Post } from '../lib/posts';

/** 中文日期：2026年9月21日 */
export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: siteConfig.timeZone,
  }).format(date);
}

/** 机器可读日期：2026-09-21 */
export function isoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

/** 精确到分钟的日期时间：2026/9/21 14:05 */
export function formatDateTime(date: Date): string {
  return new Intl.DateTimeFormat('zh-CN', {
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: siteConfig.timeZone,
  }).format(date);
}

/** 相对时间：刚刚 / 3 分钟前 / 2 天前 / 具体日期 */
export function relativeTime(date: Date): string {
  const diff = Date.now() - date.valueOf();
  const minute = 60 * 1000;
  const hour = 60 * minute;
  const day = 24 * hour;

  if (diff < minute) return '刚刚';
  if (diff < hour) return `${Math.floor(diff / minute)} 分钟前`;
  if (diff < day) return `${Math.floor(diff / hour)} 小时前`;
  if (diff < 30 * day) return `${Math.floor(diff / day)} 天前`;

  return formatDateTime(date);
}

/** 文章 id 转成 URL 路径片段（逐段编码，保留 / 分组） */
export function postIdPath(id: string): string {
  return id
    .split('/')
    .filter(Boolean)
    .map((segment) => encodeURIComponent(segment))
    .join('/');
}

/** 文章网址，按需对每一段做 URL 编码 */
export function postUrl(post: Pick<Post, 'id'>): string {
  return `/blog/${postIdPath(post.id)}/`;
}

export function tagUrl(tag: string): string {
  return `/tags/${encodeURIComponent(tag)}/`;
}

/** 参数可能已经被解码过，容错处理一次 */
export function decodePathParam(value: string): string {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

/** 摘要：优先用 frontmatter 里的 description，否则从正文截取 */
export function excerptOf(post: Pick<Post, 'data' | 'body'>, length = 120): string {
  if (post.data.description) return post.data.description;

  const plain = (post.body ?? '')
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/[#>*_`~\-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  return plain.length > length ? `${plain.slice(0, length)}…` : plain;
}

/** 阅读时长：中文按 350 字/分钟，英文按 200 词/分钟 */
export function readingTime(body = ''): number {
  const cjk = body.match(/[\u4e00-\u9fa5\u3040-\u30ff\uac00-\ud7af]/g)?.length ?? 0;
  const words =
    body.replace(/[\u4e00-\u9fa5\u3040-\u30ff\uac00-\ud7af]/g, ' ').match(/[A-Za-z0-9]+/g)?.length ?? 0;

  return Math.max(1, Math.round(cjk / 350 + words / 200));
}
