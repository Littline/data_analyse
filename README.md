# Astro Markdown 博客（自带网页写作后台）

一个基于 [Astro](https://astro.build/) 的博客，**内容就是 `src/content/blog/` 目录里的 Markdown 文件**。
有两种发文章的方式：

1. **在网页后台写**：打开 `/admin/`，填表单 → 保存 → 后端自动生成 md 文件 → 文章立刻出现在网站上；
2. **直接放 md 文件**：把 `.md` 文件复制到 `src/content/blog/`，刷新页面即可看到。

两种方式写的是同一批文件，可以随意混用。文章底部还带评论功能：访客可以直接留言，站长可以删除。

## 启动方式

### 环境要求

- Node.js **20 及以上**（推荐 20.19+ 或 22 LTS），用 `node -v` 查看版本
- 本项目在 Node v20.18.0 + npm 10.8.2 上完成构建、后台写作与权限验证

### 第一次启动

在项目根目录（本 README 所在目录）打开终端：

```bash
npm install     # ① 安装依赖，只需一次
npm run dev     # ② 启动开发服务器
```

终端会输出访问地址：

```text
  Local    http://localhost:4321/
```

打开 <http://localhost:4321/> 看网站，打开 <http://localhost:4321/admin/> 进写作后台。
这个终端窗口要保持开着，停止服务按 `Ctrl + C`。

下载依赖很慢时，可以改用国内镜像重装：

```bash
npm install --registry=https://registry.npmmirror.com
```

装到一半失败不用手动清理，重新执行 `npm install` 会续装。

### 以后每次启动

```bash
npm run dev
```

### 换端口 / 局域网访问

```bash
npm run dev -- --port 4000          # 换端口
npm run dev -- --host               # 手机等同一局域网设备也能访问
npm run dev -- --host --port 4000
```

### 正式运行（生产模式）

开发服务器适合写作和调试。要长期跑在自己电脑或服务器上，用构建后的版本：

```bash
npm run build      # 生成 dist/
npm start          # 启动正式服务，默认 http://localhost:4321
```

Windows PowerShell 下带密码启动：

```powershell
$env:ADMIN_PASSWORD='你的密码'; $env:PORT='4321'; npm start
```

Linux / macOS：

```bash
ADMIN_PASSWORD='你的密码' PORT=4321 npm start
```

## 用网页后台写文章

打开 <http://localhost:4321/admin/>，点「写新文章」：

| 界面上的东西 | 作用 |
| --- | --- |
| 标题 | 文章标题，必填 |
| 文件名 / 网址 | 决定文章网址，例如填 `my-first-post` 就是 `/blog/my-first-post/`；留空会按标题自动生成 |
| 摘要 | 列表页、搜索结果、RSS 里显示的一句话 |
| 发布日期 / 更新日期 | 更新日期留空时，改过内容会自动填成今天 |
| 标签 | 用逗号分隔，例如 `Astro, 教程`，保存后自动生成对应标签页 |
| 封面图 | 填 `/images/xxx.jpg`（图片放 `public/images/`）或图片外链 |
| 存为草稿 | 勾上就不对访客公开（见下面的「草稿」段） |
| 首页推荐 | 勾上会出现在首页「推荐阅读」 |
| 正文 | Markdown 正文，右侧实时预览，工具栏可以插入标题、加粗、链接、图片、代码块等 |

保存后会发生三件事：内容目录里生成 `src/content/blog/<文件名>.md`、页面顶部提示保存成功、
文章立刻可以通过 `/blog/<文件名>/` 访问（不需要重启服务，也不需要重新构建）。

后台首页能看到全部文章（包括草稿）、每篇的状态和操作按钮，支持**编辑**、**改文件名**、**删除**。
按 `Ctrl / ⌘ + S` 也可以直接保存。

### 草稿的可见性

- **设置了管理密码**：草稿只有登录后的管理员能看到，访客访问返回 404；
- **没有设置管理密码**：后台对所有人开放（所有人都算管理员），草稿也会被公开看到。

所以只要网站能被别人访问，就应该设置密码。

## 一定要看：设置管理密码

不设置密码时，**任何能访问 `/admin/` 的人都可以发布或删除你的文章**。

开发模式（`npm run dev`）可以写在项目根目录的 `.env` 文件里（参考 `.env.example`）：

```dotenv
ADMIN_PASSWORD=换成你自己的密码
```

正式运行（`npm start`）时用环境变量传入，见上面的「正式运行」。

设置之后：

- 打开 `/admin/` 会自动跳到登录页 `/admin/login/`，输入密码后才能进入；
- 所有写文章的接口都会校验登录状态，未登录返回 401；
- 登录状态保存在 Cookie 里，12 小时后过期，重启服务需要重新登录。

## 直接放 md 文件（另一种写法）

不想用后台时，直接把 Markdown 文件放进 `src/content/blog/` 就行，
`templates/test-post.md` 是一个现成的测试文件（它不在网站上，专门用来做实验）。

```text
src/content/blog/hello-world.md        ->  /blog/hello-world/
src/content/blog/notes/idea-2026.md    ->  /blog/notes/idea-2026/
```

文件名就是网址的一部分，**重命名文件等于换网址**，删除文件等于下线文章。
以 `_` 开头的文件（例如 `_old-post.md`）会被忽略，可以临时下线一篇文章而不删除内容。

### 一篇文章长什么样

```markdown
---
title: 文章标题
description: 一句话摘要，用于列表页、搜索摘要和 RSS
pubDate: 2026-09-21
updatedDate: 2026-09-25
author: 网站管理员
tags: [Astro, 教程]
category: 技术笔记
cover: /images/cover.jpg
draft: false
featured: false
---

正文从这里开始，使用标准 Markdown 语法。
```

| 字段 | 是否必填 | 说明 |
| --- | --- | --- |
| `title` | 必填 | 文章标题，最长 150 字 |
| `pubDate` | 必填 | 发布日期，写 `2026-09-21` 或 `2026-09-21 10:30:00` |
| `description` | 可选 | 摘要，不填会自动从正文截取 |
| `updatedDate` | 可选 | 更新日期，填了会在页面上显示 |
| `author` | 可选 | 不填使用站点默认作者 |
| `tags` | 可选 | 标签数组，会自动生成 `/tags/标签名/` 页面 |
| `category` | 可选 | 分类，仅用于展示 |
| `cover` | 可选 | 封面图，`/images/xxx.jpg` 或图片外链 |
| `draft` | 可选 | `true` = 草稿 |
| `featured` | 可选 | `true` = 首页「推荐阅读」 |

写错了不用怕，`npm run check` 会指出哪个文件哪个字段有问题，页面也不会因此崩溃。

### 图片放哪里

放进 `public/images/`，在 Markdown 里写 `![说明](/images/文件名.jpg)`。
运行期间新增的图片也能直接访问，不需要重新构建。

## 文章评论

每篇文章底部都有评论区：访客填昵称、邮箱（选填）、网址（选填）和内容就能留言，
提交后立即可见；站长登录后，每条评论旁边会出现「删除」按钮。

评论存放在 `data/comments/` 目录，**每篇文章一个 JSON 文件**（`hello-world.md` 对应
`data/comments/hello-world.json`），和文章一样是「文件即数据」，便于备份和迁移。

### 访客侧

- 昵称可留空，留空显示为「匿名」；邮箱只保存不公开，仅后台可见；网址会显示成链接（带 `nofollow`）。
- 内容限 2000 字，同一 IP **10 分钟内最多发 5 条**，超出会提示稍后再试。
- 表单带一个隐藏的蜜罐字段，机器人填了会被静默丢弃，不会写进文件。
- 昵称、邮箱、网址会记在浏览器本地，下次评论自动填好。

### 站长侧

- **在文章页删**：登录后在评论区每条留言右侧点「删除」。
- **在后台集中看**：打开 `/admin/comments/`，按文章分组查看所有评论（含访客邮箱），逐条删除。
- 文章**改名**时评论会跟着搬过去，**删除**文章时它的评论会一并清理。

### 关于评论的几个说明

- **未设置 `ADMIN_PASSWORD` 时**，所有人都是「管理员」，也就是任何访客都能删除评论 ——
  所以放到公网前务必设置密码。
- 评论数据默认**不进 Git**（`.gitignore` 里忽略了 `data/`），这样访客邮箱不会进版本库。
  想连评论一起备份到仓库，把 `.gitignore` 里的 `data/` 一行删掉即可。
- 备份时记得连 `data/comments/` 一起复制，否则评论会丢。

需要删除某条评论但找不到按钮时，直接编辑对应的 JSON 文件也有效（删掉那个对象即可）。

## 保存之后发生了什么

```text
网页表单  ──POST /api/posts──►  校验字段  ──►  写入 src/content/blog/xxx.md
                                                      │
浏览器刷新 ─────────── 页面按需读取该目录 ─────────────┘
```

站点是服务端渲染的：每次访问页面时都从内容目录读取 md 文件，因此后台保存完，刷新就能看到结果，
既不需要重启服务，也不需要等构建。渲染结果按「文件修改时间 + 大小」缓存，正常访问不会反复解析。

## 常用命令

| 命令 | 作用 |
| --- | --- |
| `npm run dev` | 开发模式，边写边看，改 md 或后台保存都立即生效 |
| `npm run build` | 构建生产版本到 `dist/`（`dist/server` + `dist/client`） |
| `npm start` | 启动构建后的正式服务 |
| `npm run check` | 体检内容：检查所有 md 的 frontmatter 是否合法 |
| `npm run new "标题"` | 命令行生成一篇新文章的 md 模板 |
| `npm run publish` | `check` + `build`，发布前跑一次 |

`npm run new` 的用法：

```bash
npm run new "我的第一篇博客" -- --tags Astro,教程
npm run new "My Post" -- --slug my-post --date 2026-09-21
npm run new "草稿标题" -- --draft
```

## 部署

因为后台需要写文件，本项目是**带后端的服务端渲染应用**，不能再当成纯静态站点托管。

```bash
npm install
npm run build
ADMIN_PASSWORD='你的密码' PORT=4321 npm start
```

- 可以跑在自己的电脑、局域网机器或 VPS 上，用 pm2、systemd、NSSM 等工具让它常驻；
- 前面可以放 Nginx 反向代理并配 HTTPS；
- 文章文件在 `src/content/blog/`，备份这个目录就等于备份全部内容；
- 想做「保存即上线」，最省事的方式就是让这个服务一直运行。

## 项目结构

```text
.
├─ astro.config.mjs         # 站点地址、Node 适配器（服务端渲染）
├─ package.json
├─ .env.example             # 环境变量示例（ADMIN_PASSWORD、PORT）
├─ public/                  # 静态资源
│  ├─ favicon.svg
│  ├─ robots.txt
│  └─ images/               # 文章配图放这里，用 /images/xxx.jpg 引用
├─ data/
│  └─ comments/             # ★ 评论数据：每篇文章一个 JSON 文件（不进 Git）
├─ scripts/
│  ├─ new-post.mjs          # npm run new
│  └─ check-content.mjs     # npm run check
└─ src/
   ├─ consts.ts             # 站名、描述、导航、时区
   ├─ middleware.ts         # 后台登录校验
   ├─ content/
   │  ├─ blog/              # ★ 文章目录：网页后台和手动放 md 都写到这里
   │  └─ pages/             # 独立页面，如 about.md
   ├─ lib/
   │  ├─ comments.ts        # 评论读取/新增/删除、限流、蜜罐
   │  ├─ frontmatter.mjs    # frontmatter 解析、校验、序列化
   │  ├─ posts.ts           # 读取/写入文章（含原子写入与渲染缓存）
   │  ├─ markdown.mjs       # Markdown → HTML（与 Astro 同一套管线）
   │  ├─ auth.ts            # 登录会话
   │  ├─ ids.ts             # 文章 id 规则
   │  ├─ atomic.ts          # 原子写入
   │  └─ api.ts             # 接口公共工具
   ├─ pages/
   │  ├─ index.astro / blog/ / tags/ / about.astro / 404.astro
   │  ├─ rss.xml.ts / sitemap.xml.ts / images/[...path].ts
   │  ├─ admin/             # 后台：文章列表、编辑器、评论管理、登录页
   │  └─ api/               # 接口：posts、comments、preview、login、logout
   ├─ components/           # 页头、页脚、文章卡片、目录、评论区、404
   ├─ layouts/
   └─ styles/global.css     # 全站样式（含后台样式）
```

## 接口一览（写脚本或对接其他工具时可用）

| 接口 | 方法 | 说明 |
| --- | --- | --- |
| `/api/posts` | POST | 新增文章，JSON 字段：`title`、`id`、`description`、`pubDate`、`updatedDate`、`tags`、`category`、`cover`、`draft`、`featured`、`body` |
| `/api/posts/<id>` | PUT | 修改文章（同时改 `id` 等于改文件名） |
| `/api/posts/<id>` | DELETE | 删除文章 |
| `/api/preview` | POST | 传 `{ body }`，返回渲染后的 HTML |
| `/api/comments` | POST | 发表评论（对访客开放），JSON 字段：`postId`、`author`、`email`、`website`、`body` |
| `/api/comments/<评论id>?postId=<文章id>` | DELETE | 删除评论（需要管理员登录） |
| `/api/login`、`/api/logout` | POST | 登录、退出 |

注意：请求请带上 `Content-Type: application/json`，否则会被 Astro 的 CSRF 防护拦下（返回 403）。

## 常见问题

**保存后页面没变化？**
先刷新页面（服务端渲染，刷新才会重新读取文件）。如果文章没出现，去 `/admin/` 看有没有红色提示 ——
frontmatter 有问题的文件会被跳过并列在那里。

**中文标题生成的文件名不好看？**
后台的「文件名 / 网址」框可以自己填英文；命令行用 `--slug my-post`。

**后台一点保存就提示登录失效？**
登录状态 12 小时过期，重新登录即可。重启服务后也需要重新登录。

**不小心删了文章？**
md 文件从内容目录删除后无法在界面恢复，如果用 Git 管理内容，可以用 `git checkout` 找回；
平时建议定期备份 `src/content/blog/`。

**怎么在发布前检查内容？**
`npm run check` 会检查所有 md 的 frontmatter，报错会指出文件和字段。

**评论被别人刷了怎么办？**
在文章页或后台 `/admin/comments/` 点「删除」即可。同一 IP 10 分钟最多 5 条的限制
会自动挡住大部分刷屏；真被盯上时可以考虑加验证码或改成先审后发（改 `src/lib/comments.ts`）。

**访客的邮箱会公开吗？**
不会。文章页只显示昵称、网址和内容，邮箱仅出现在后台评论管理页。

**开发时终端出现 `EBUSY` / `Duplicate id` 警告要紧吗？**
一般出现在保存文件的瞬间，服务会自己重试。如果一直刷，检查是否有两个 md 文件名重复 ——
重名会让它们指向同一个网址。

## 版本管理：每次更新都推送到远程仓库

远程仓库已配置为 `origin`（`https://github.com/Littline/data_analyse.git`），分支 `main`。
**约定：每次改动都提交并推送。**

```bash
git add -A
git commit -m "描述这次改了什么"
git push
```

如果 Git 提示仓库所有权问题（dubious ownership），先执行一次：

```bash
git config --global --add safe.directory F:/work/data_analyse/data_analyse
```

推送需要 GitHub 账号凭据。若提示需要登录，可以用 Personal Access Token 作为密码，
或先执行 `git config --global credential.helper manager` 让 Git 记住凭据。

## 环境与版本说明

本项目在 **Node v20.18.0 + npm 10.8.2** 上完成构建、网页写作、登录与权限验证。
安装依赖时可能看到几条来自间接依赖的 `EBADENGINE` 警告（例如 `chokidar@5`、`undici@8`
要求 Node 20.19+），实测不影响本项目功能；想彻底消除可升级到 Node 20.19+ 或 22 LTS。

另外，本版 Astro 的同源校验在带端口访问时，会把浏览器的 `Origin` 与不含端口的地址比较，
导致「没有 Content-Type 的 POST/DELETE」被误判为跨站请求而返回 403。项目里所有前端接口调用
都显式带上 `Content-Type: application/json` 来避开这个判断 —— 既保证浏览器端可用，
也没有降低 CSRF 防护（恶意网站无法伪造该请求头）。
