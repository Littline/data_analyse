import { defineMiddleware } from 'astro:middleware';
import { authEnabled, isValidSession, SESSION_COOKIE } from './lib/auth';

/** 需要登录才能访问的路径前缀 */
const PROTECTED_PREFIXES = ['/admin', '/api/posts', '/api/preview'];

/** 例外：登录页与登录、退出接口本身不能被拦 */
const ALWAYS_ALLOWED = ['/admin/login', '/api/login', '/api/logout'];

function matches(pathname: string, prefix: string): boolean {
  return pathname === prefix || pathname.startsWith(`${prefix}/`);
}

export const onRequest = defineMiddleware((context, next) => {
  if (!authEnabled()) return next();

  const { pathname } = context.url;

  if (ALWAYS_ALLOWED.some((prefix) => matches(pathname, prefix))) return next();
  if (!PROTECTED_PREFIXES.some((prefix) => matches(pathname, prefix))) return next();
  if (isValidSession(context.cookies.get(SESSION_COOKIE)?.value)) return next();

  if (pathname.startsWith('/api/')) {
    return new Response(JSON.stringify({ errors: ['登录状态已失效，请重新登录'] }), {
      status: 401,
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
    });
  }

  const target = encodeURIComponent(`${pathname}${context.url.search}`);
  return context.redirect(`/admin/login/?next=${target}`);
});

