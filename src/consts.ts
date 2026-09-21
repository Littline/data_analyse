/**
 * 站点全局信息：改这里即可换站名、描述、导航、作者签名等。
 */
export const siteConfig = {
  title: '我的博客',
  /** 站点副标题，显示在首页 */
  tagline: '用 Markdown 写下的思考与记录',
  description: '一个基于 Astro 的 Markdown 博客，新增 md 文件即可自动更新。',
  author: '网站管理员',
  /** 展示日期时用的时区，写文章时按这个时区理解日期 */
  timeZone: 'Asia/Shanghai',
  /** 页脚备案/版权信息 */
  footerNote: '',
  /** 首页每页展示的文章数 */
  postsPerPage: 8,
};

export const navItems = [
  { href: '/', label: '首页' },
  { href: '/blog/', label: '文章' },
  { href: '/tags/', label: '标签' },
  { href: '/about/', label: '关于' },
];

export const socialLinks = [
  // { href: 'https://github.com/your-name', label: 'GitHub' },
  // { href: 'mailto:you@example.com', label: 'Email' },
];
