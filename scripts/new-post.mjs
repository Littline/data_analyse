#!/usr/bin/env node
/**
 * 快速新建一篇文章：
 *   npm run new "文章标题"
 *   npm run new "文章标题" -- --tags Astro,教程 --draft
 *   npm run new "文章标题" -- --slug my-post --date 2026-09-21
 *
 * 不加参数直接运行时会进入交互式提问。
 */
import { mkdir, writeFile, access } from 'node:fs/promises';
import { createInterface } from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';
import path from 'node:path';

const BLOG_DIR = path.join(process.cwd(), 'src', 'content', 'blog');

function parseArgs(argv) {
  const flags = { tags: [], draft: false };
  const positional = [];

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];

    if (arg === '--') continue;

    if (arg === '--draft') {
      flags.draft = true;
    } else if (arg.startsWith('--tags=')) {
      flags.tags = splitTags(arg.slice('--tags='.length));
    } else if (arg === '--tags') {
      flags.tags = splitTags(argv[++i] ?? '');
    } else if (arg.startsWith('--slug=')) {
      flags.slug = arg.slice('--slug='.length);
    } else if (arg === '--slug') {
      flags.slug = argv[++i];
    } else if (arg.startsWith('--date=')) {
      flags.date = arg.slice('--date='.length);
    } else if (arg === '--date') {
      flags.date = argv[++i];
    } else if (arg.startsWith('--')) {
      console.warn(`忽略未知参数：${arg}`);
    } else {
      positional.push(arg);
    }
  }

  flags.title = positional.join(' ').trim();
  return flags;
}

function splitTags(value) {
  return value
    .split(/[,，]/)
    .map((tag) => tag.trim())
    .filter(Boolean);
}

function todayStamp() {
  const now = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  return {
    date: `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`,
    compact: `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}`,
  };
}

/** 生成 URL 友好的文件名：保留字母数字，其他字符转成连字符 */
function slugify(value) {
  return value
    .normalize('NFKD')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);
}

async function exists(filePath) {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function resolveFileName(baseSlug, compact) {
  const fallback = baseSlug || `post-${compact}-${Math.random().toString(36).slice(2, 6)}`;
  let candidate = fallback;
  let index = 2;

  while (await exists(path.join(BLOG_DIR, `${candidate}.md`))) {
    candidate = `${fallback}-${index}`;
    index += 1;
  }

  return `${candidate}.md`;
}

function buildTemplate({ title, date, tags, draft }) {
  const tagLine = `tags: [${tags.join(', ')}]`;

  return `---
title: ${title}
description: 一句话摘要，会用在列表页、搜索结果和 RSS 里。
pubDate: ${date}
${tagLine}
author: 网站管理员
draft: ${draft}
---

在这里写正文。支持标准 Markdown 语法：

## 小标题

段落之间记得留一个空行。

> 引用、代码块、表格、图片都可以直接用。

写好之后保存文件，本地开发服务器会自动刷新页面。
`;
}

async function main() {
  const flags = parseArgs(process.argv.slice(2));
  const stamp = todayStamp();
  const interactive = process.stdin.isTTY && process.stdout.isTTY;

  let title = flags.title;
  let tags = flags.tags;
  let draft = flags.draft;

  if ((!title || tags.length === 0) && interactive) {
    const rl = createInterface({ input, output });

    if (!title) {
      title = (await rl.question('文章标题：')).trim();
    }
    if (tags.length === 0) {
      tags = splitTags(await rl.question('标签（用逗号分隔，可留空）：'));
    }
    if (!flags.draft) {
      const answer = (await rl.question('先存为草稿？(y/N)：')).trim().toLowerCase();
      draft = answer === 'y' || answer === 'yes';
    }

    rl.close();
  }

  if (!title) {
    console.error('缺少文章标题。用法：npm run new "文章标题" -- --tags Astro,教程');
    process.exit(1);
  }

  const date = flags.date ?? stamp.date;
  const baseSlug = slugify(flags.slug ?? title);

  if (!baseSlug && !flags.slug) {
    console.log('提示：标题里没有可用的英文字符，已用日期时间戳当文件名。想自定义网址可加 --slug my-post');
  }

  const fileName = await resolveFileName(baseSlug, stamp.compact);

  await mkdir(BLOG_DIR, { recursive: true });

  const filePath = path.join(BLOG_DIR, fileName);
  await writeFile(filePath, buildTemplate({ title, date, tags, draft }), 'utf8');

  const id = fileName.replace(/\.md$/, '');
  console.log(`已创建：src/content/blog/${fileName}`);
  console.log(`访问地址：/blog/${id}/`);
  if (draft) {
    console.log('当前标记为草稿，正式构建时不会发布。发布前把 draft 改成 false。');
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
