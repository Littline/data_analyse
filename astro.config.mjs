// @ts-check
import { defineConfig } from 'astro/config';
import node from '@astrojs/node';
import { markdownOptions } from './src/lib/markdown.mjs';

// 部署后请把 site 改成你的真实域名，RSS 与 sitemap 会使用它生成绝对地址
const SITE = 'https://example.com';

export default defineConfig({
  site: SITE,
  trailingSlash: 'ignore',
  // 服务端渲染：写文章接口需要真实的后端来落盘 md 文件、并让页面立刻读到新内容
  output: 'server',
  adapter: node({ mode: 'standalone' }),
  markdown: markdownOptions,
  devToolbar: {
    enabled: false,
  },
});
