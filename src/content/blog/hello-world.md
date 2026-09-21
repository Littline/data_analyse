---
title: 欢迎来到我的博客
description: 这是第一篇示例文章，说明如何通过新增 Markdown 文件来发布内容。
pubDate: 2026-09-21
tags: [公告, 使用指南]
author: 网站管理员
featured: true
---

这是一篇示例文章。它能出现在网站上，只是因为有人把 `hello-world.md` 这个文件放进了
`src/content/blog/` 目录 —— 没有数据库，内容就是文件本身。

## 怎么发布一篇新文章

有两种方式，用哪种都可以：

**方式一：在网页后台写**

打开 `/admin/`，点「写新文章」，填标题、正文，保存即可。
后端会把内容写成 `src/content/blog/<文件名>.md`，刷新页面就能看到。

**方式二：直接放 Markdown 文件**

1. 复制本文件，或者运行 `npm run new "文章标题"` 生成模板；
2. 修改文件顶部的 frontmatter（标题、日期、标签）；
3. 用 Markdown 写正文；
4. 保存，刷新浏览器就能看到效果。

文件名决定了网址：`src/content/blog/hello-world.md` 对应 `/blog/hello-world/`。
想换网址就重命名文件，想让文章下线就删除文件。

## 支持的写法

常用的 Markdown 语法都可以直接用，包括代码块：

```bash
npm run dev      # 启动本地预览，改 md 文件即时生效
npm run build    # 构建生产版本到 dist/
npm start        # 启动正式服务
```

> 引用块、表格、图片、任务列表都是支持的，样式已经配好，写内容时不用管 HTML。

### 写作时值得注意的两点

- **frontmatter 必须合法**：`title` 和 `pubDate` 是必填项，写错时文章会被跳过，
  后台首页和 `npm run check` 都会指出是哪个文件、哪个字段。
- **草稿用 `draft: true`**：设置管理密码后，只有登录后台的人能看到草稿，访客访问返回 404。

想深入了解 frontmatter 的每个字段，可以看 [Markdown 写作指南](/blog/markdown-writing-guide/)。
