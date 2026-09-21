/** 文章 id / 文件名的规则，posts 与 comments 共用 */
import { slugify } from './frontmatter.mjs';

/**
 * 允许的 id：字母、数字、下划线、连字符、点，以及中日韩等文字；
 * 支持用 / 分组（例如 2026/hello）。其它字符一律拒绝，杜绝路径穿越。
 */
const ID_PATTERN = /^[\p{L}\p{N}._-]+(?:\/[\p{L}\p{N}._-]+)*$/u;

export function isValidId(id: string): boolean {
  if (!id || id.length > 200) return false;
  if (!ID_PATTERN.test(id)) return false;
  return id.split('/').every((segment) => segment !== '.' && segment !== '..');
}

/** 由标题推导文件名：中文标题退回 post-日期时间 的形式 */
export function idFromTitle(title: string, now = new Date()): string {
  const slug = slugify(title);
  if (slug) return slug;

  const pad = (value: number) => String(value).padStart(2, '0');
  const stamp = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}-${pad(now.getHours())}${pad(now.getMinutes())}`;
  return `post-${stamp}`;
}

/** 去掉首尾斜杠 */
export function trimSlashes(value: string): string {
  return String(value ?? '').trim().replace(/^\/+|\/+$/g, '');
}

