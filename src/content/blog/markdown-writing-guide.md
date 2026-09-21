---
title: Markdown 写作指南：frontmatter 字段与常用语法
description: 整理本博客支持的全部 frontmatter 字段、Markdown 语法示例，以及写作时的排版建议。
pubDate: 2026-09-18
updatedDate: 2026-09-20
tags: [教程, Markdown]
category: 使用指南
featured: true
---

这篇文章把写文章时会用到的字段和语法集中整理了一遍，需要的时候可以直接回来查。

## frontmatter 字段一览

每个 Markdown 文件必须以三短横线包裹的 frontmatter 开头：

```markdown
---
title: 文章标题
description: 一句话摘要，会用在列表页、搜索结果和 RSS 里
pubDate: 2026-09-18
updatedDate: 2026-09-20
author: 张三
tags: [教程, Markdown]
category: 使用指南
cover: /images/cover.jpg
draft: false
featured: true
---
```

| 字段 | 是否必填 | 说明 |
| --- | --- | --- |
| `title` | 必填 | 文章标题，最长 150 字 |
| `description` | 可选 | 摘要，最长 400 字；不填会从正文自动截取 |
| `pubDate` | 必填 | 发布日期，`2026-09-18` 或 `2026-09-18 10:30:00` |
| `updatedDate` | 可选 | 最后更新日期，填了会在正文上方显示 |
| `author` | 可选 | 不填使用站点默认作者 |
| `tags` | 可选 | 标签数组，会自动生成标签页 |
| `category` | 可选 | 分类，仅用于展示 |
| `cover` | 可选 | 封面图路径，支持 `/images/xxx.jpg` 或图片外链 |
| `draft` | 可选 | 设为 `true` 时不对访客公开，只有登录后台的人能看到 |
| `featured` | 可选 | 设为 `true` 会进入首页「推荐阅读」 |

> 日期写成 `2026-09-18` 这种格式时，YAML 会把它识别成日期对象，不需要加引号。

## 常用语法

### 文本与列表

**加粗**、*斜体*、~~删除线~~、`行内代码` 都可以正常使用。

1. 有序列表
2. 第二条

- 无序列表
- 另一条
  - 支持嵌套

- [x] 已完成的任务
- [ ] 未完成的任务

### 代码块

在开头的三个反引号后面写上语言名，就会自动高亮：

```js
const posts = await getCollection('blog');
console.log(`共 ${posts.length} 篇文章`);
```

### 图片与链接

图片建议放在 `public/images/` 目录，然后用绝对路径引用：

```markdown
![图片说明](/images/example.jpg)
```

站内链接直接写路径即可：`[回到首页](/blog/)`。

### 表格

上面的 frontmatter 表格就是标准写法，注意第二行必须是分隔行 `| --- | --- |`。

## 排版建议

- 一个文件只写一个 `#` 一级标题就够了，正文的小节从 `##` 开始，目录会自动根据 `##` 和 `###` 生成。
- 段落之间留一个空行，Markdown 才会把它拆成两段。
- 中英文混排时，在中文和英文之间留一个空格会更易读，这是排版习惯而非语法要求。
