#!/usr/bin/env node
/**
 * 内容体检：检查 src/content/ 下所有 md 文件的 frontmatter 是否合法。
 *   npm run check
 *
 * 和网站运行时用的是同一套校验逻辑（src/lib/frontmatter.mjs），
 * 所以这里通过就意味着页面能正常渲染。
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import { parseFrontmatter, validatePageData, validatePostData } from '../src/lib/frontmatter.mjs';

const ROOT = process.cwd();
const BLOG_DIR = process.env.BLOG_CONTENT_DIR
  ? path.resolve(process.env.BLOG_CONTENT_DIR)
  : path.join(ROOT, 'src', 'content', 'blog');
const PAGES_DIR = process.env.BLOG_PAGES_DIR
  ? path.resolve(process.env.BLOG_PAGES_DIR)
  : path.join(ROOT, 'src', 'content', 'pages');

async function walk(dir) {
  let entries;
  try {
    entries = await fs.readdir(dir, { withFileTypes: true });
  } catch (error) {
    if (error.code === 'ENOENT') return [];
    throw error;
  }

  const files = [];
  for (const entry of entries) {
    if (entry.name.startsWith('_') || entry.name.startsWith('.')) continue;

    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) files.push(...(await walk(full)));
    else if (entry.isFile() && /\.md$/i.test(entry.name)) files.push(full);
  }
  return files;
}

async function checkDir(dir, validate, kind) {
  const files = await walk(dir);
  const problems = [];

  for (const file of files) {
    const relative = path.relative(ROOT, file).replace(/\\/g, '/');
    try {
      const { data } = parseFrontmatter(await fs.readFile(file, 'utf8'));
      const result = validate(data);
      if (result.errors.length > 0) {
        problems.push({ file: relative, messages: result.errors });
      }
    } catch (error) {
      problems.push({ file: relative, messages: [error.message] });
    }
  }

  return { kind, total: files.length, problems };
}

function printResult(result) {
  const label = result.kind === 'blog' ? '文章' : '页面';

  if (result.problems.length === 0) {
    console.log(`✓ ${label}：检查了 ${result.total} 个 md 文件，全部通过`);
    return 0;
  }

  console.error(`✗ ${label}：${result.problems.length}/${result.total} 个文件有问题\n`);
  for (const problem of result.problems) {
    console.error(`  ${problem.file}`);
    for (const message of problem.messages) {
      console.error(`    - ${message}`);
    }
  }
  console.error('');
  return result.problems.length;
}

const [blogResult, pageResult] = await Promise.all([
  checkDir(BLOG_DIR, validatePostData, 'blog'),
  checkDir(PAGES_DIR, validatePageData, 'pages'),
]);

const failures = printResult(blogResult) + printResult(pageResult);

if (failures > 0) {
  console.error('按上面的提示修好对应字段后重新运行 npm run check。');
  process.exit(1);
}

console.log('内容没有问题，可以放心构建或发布。');

