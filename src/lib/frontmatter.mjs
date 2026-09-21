/**
 * Markdown 文章的 frontmatter 解析、校验与序列化。
 *
 * 这里刻意写成不依赖 Astro 的纯 JS 模块，因为两边都要用：
 *   - 网站运行时（写文章接口、页面渲染）
 *   - 命令行脚本 scripts/check-content.mjs
 */
import { load as parseYaml } from 'js-yaml';

/** 字段顺序：写回文件时保持稳定，diff 更干净 */
const FIELD_ORDER = [
  'title',
  'description',
  'pubDate',
  'updatedDate',
  'author',
  'tags',
  'category',
  'cover',
  'draft',
  'featured',
];

/** 把标题转成 URL 友好的 id；中文标题会返回空字符串，由调用方兜底 */
export function slugify(input) {
  return String(input ?? '')
    .normalize('NFKD')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

/**
 * 拆开 frontmatter 与正文。
 * 文件不以 --- 开头时，整体视为正文，frontmatter 为空对象。
 */
export function parseFrontmatter(raw) {
  const text = String(raw ?? '').replace(/^\uFEFF/, '');
  const match = /^---[ \t]*\r?\n([\s\S]*?)\r?\n---[ \t]*(?:\r?\n|$)/.exec(text);

  if (!match) {
    return { data: {}, body: text };
  }

  let data;
  try {
    data = parseYaml(match[1]);
  } catch (error) {
    throw new Error(`frontmatter 的 YAML 格式有误：${error.message}`);
  }

  if (data === null || data === undefined) data = {};
  if (typeof data !== 'object' || Array.isArray(data)) {
    throw new Error('frontmatter 必须是一组 key: value 形式的字段');
  }

  return { data, body: text.slice(match[0].length) };
}

function toDate(value) {
  if (value instanceof Date) {
    return Number.isNaN(value.valueOf()) ? null : value;
  }

  if (typeof value === 'number' && Number.isFinite(value)) {
    const date = new Date(value);
    return Number.isNaN(date.valueOf()) ? null : date;
  }

  if (typeof value === 'string') {
    const text = value.trim();
    if (!text) return null;

    // 按 UTC 解释无时区的日期，保证「2026-09-21」写进去、读出来还是同一天
    const dateOnly = /^(\d{4})-(\d{1,2})-(\d{1,2})$/.exec(text);
    if (dateOnly) {
      return new Date(Date.UTC(+dateOnly[1], +dateOnly[2] - 1, +dateOnly[3]));
    }

    const withTime = /^(\d{4})-(\d{1,2})-(\d{1,2})[ T](\d{1,2}):(\d{2})(?::(\d{2}))?$/.exec(text);
    if (withTime) {
      return new Date(
        Date.UTC(
          +withTime[1],
          +withTime[2] - 1,
          +withTime[3],
          +withTime[4],
          +withTime[5],
          +(withTime[6] ?? 0),
        ),
      );
    }

    const parsed = new Date(text);
    return Number.isNaN(parsed.valueOf()) ? null : parsed;
  }

  return null;
}

function toBoolean(value) {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'number') return value !== 0;
  if (typeof value === 'string') {
    const text = value.trim().toLowerCase();
    if (['true', 'yes', 'y', '1', '是'].includes(text)) return true;
    if (['false', 'no', 'n', '0', '否', ''].includes(text)) return false;
  }
  return undefined;
}

function toOptionalString(value) {
  if (value === null || value === undefined) return undefined;
  if (typeof value === 'string') {
    const text = value.trim();
    return text === '' ? undefined : text;
  }
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  return undefined;
}

function toTags(value) {
  if (value === null || value === undefined || value === '') return [];

  const list = Array.isArray(value)
    ? value
    : String(value)
        .split(/[,，\n]/)
        .filter((item) => item.trim() !== '');

  const tags = [];
  for (const item of list) {
    const tag = toOptionalString(item);
    if (tag !== undefined && !tags.includes(tag)) tags.push(tag);
  }
  return tags;
}

/**
 * 校验并规范化 frontmatter。
 * 返回 { data, errors }，errors 为空数组时表示通过。
 */
export function validatePostData(input = {}) {
  const source = input && typeof input === 'object' ? input : {};
  const errors = [];
  const data = {};

  // title：必填
  const title = toOptionalString(source.title);
  if (!title) {
    errors.push('title：必须填写文章标题');
  } else if (title.length > 150) {
    errors.push(`title：标题过长（${title.length} 字），请控制在 150 字以内`);
  }
  data.title = title ?? '';

  // description：可选
  const description = toOptionalString(source.description);
  if (description && description.length > 400) {
    errors.push(`description：摘要过长（${description.length} 字），请控制在 400 字以内`);
  }
  if (description) data.description = description;

  // pubDate：必填
  const pubDate = toDate(source.pubDate);
  if (!pubDate) {
    errors.push('pubDate：日期格式不正确，请写成 2026-09-21 或 2026-09-21 10:30:00');
  } else {
    data.pubDate = pubDate;
  }

  // updatedDate：可选
  if (source.updatedDate !== undefined && source.updatedDate !== null && source.updatedDate !== '') {
    const updatedDate = toDate(source.updatedDate);
    if (!updatedDate) {
      errors.push('updatedDate：日期格式不正确，请写成 2026-09-21 或 2026-09-21 10:30:00');
    } else {
      data.updatedDate = updatedDate;
    }
  }

  const author = toOptionalString(source.author);
  if (author) data.author = author;

  data.tags = toTags(source.tags);

  const category = toOptionalString(source.category);
  if (category) data.category = category;

  const cover = toOptionalString(source.cover);
  if (cover) data.cover = cover;

  data.draft = toBoolean(source.draft) === true;
  data.featured = toBoolean(source.featured) === true;

  return { data, errors };
}

/** 校验单页（about.md 这类）的 frontmatter */
export function validatePageData(input = {}) {
  const source = input && typeof input === 'object' ? input : {};
  const errors = [];
  const data = {};

  const title = toOptionalString(source.title);
  if (!title) errors.push('title：必须填写页面标题');
  data.title = title ?? '';

  const description = toOptionalString(source.description);
  if (description) data.description = description;

  if (source.updatedDate !== undefined && source.updatedDate !== null && source.updatedDate !== '') {
    const updatedDate = toDate(source.updatedDate);
    if (updatedDate) data.updatedDate = updatedDate;
  }

  return { data, errors };
}

function pad(value, length = 2) {
  return String(value).padStart(length, '0');
}

/** 以 UTC 分量写回日期：整点日期写成 2026-09-21，带时间的写成 2026-09-21 10:30:00 */
export function formatYamlDate(date) {
  const base = `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())}`;
  const hours = date.getUTCHours();
  const minutes = date.getUTCMinutes();
  const seconds = date.getUTCSeconds();

  if (hours === 0 && minutes === 0 && seconds === 0) return base;
  return `${base} ${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
}

/** 需要时给字符串加引号，避免 YAML 把标题里的冒号、井号当成语法 */
function quote(value) {
  const text = String(value);
  const risky =
    /^[\s\-?:,[\]{}#&*!|>'"%@`]/.test(text) ||
    /[:#]\s/.test(text) ||
    /\s$/.test(text) ||
    /^(true|false|null|yes|no|on|off|~)$/i.test(text) ||
    /^-?\d+(\.\d+)?$/.test(text);

  return risky ? JSON.stringify(text) : text;
}

/** 把校验后的数据与正文合成完整的 Markdown 文本 */
export function serializePost(data, body = '') {
  const lines = ['---'];

  for (const field of FIELD_ORDER) {
    const value = data[field];

    if (field === 'tags') {
      if (Array.isArray(value) && value.length > 0) {
        lines.push(`tags: [${value.map(quote).join(', ')}]`);
      }
      continue;
    }

    if (field === 'draft' || field === 'featured') {
      lines.push(`${field}: ${value === true ? 'true' : 'false'}`);
      continue;
    }

    if (field === 'pubDate' || field === 'updatedDate') {
      if (value instanceof Date) lines.push(`${field}: ${formatYamlDate(value)}`);
      continue;
    }

    if (value === undefined || value === null || value === '') continue;
    lines.push(`${field}: ${quote(value)}`);
  }

  lines.push('---', '');

  const text = String(body ?? '').replace(/^\s*\n+/, '').replace(/\s+$/, '');
  return `${lines.join('\n')}\n${text}\n`;
}
