---
title: 这是一篇草稿
description: 演示 draft 字段的作用：本地可见，正式构建时自动隐藏。
pubDate: 2026-09-22
tags: [公告]
draft: true
---

这篇文章的 frontmatter 里写了 `draft: true`，所以：

- 登录后台后，你能在列表页和文章页看到它，标题旁边会有「草稿」标记；
- 没登录的访客看不到它：文章页返回 404，列表页、标签页和 RSS 里也不会出现。

写完了把 `draft: true` 改成 `false`（或者直接在后台取消勾选「存为草稿」），就正式发布了。
