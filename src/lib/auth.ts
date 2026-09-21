/**
 * 极简管理后台登录：
 *   - 环境变量 ADMIN_PASSWORD 未设置时，后台不校验（适合本机随手写文章）
 *   - 设置之后，/admin 与写文章接口都需要先登录，会话保存在内存里（重启服务后需重新登录）
 */
import { createHash, randomUUID, timingSafeEqual } from 'node:crypto';

export const SESSION_COOKIE = 'blog_session';
const SESSION_TTL_MS = 1000 * 60 * 60 * 12; // 12 小时
export const sessionMaxAgeSeconds = Math.floor(SESSION_TTL_MS / 1000);

const sessions = new Map<string, number>();

/** 管理密码：优先读运行时环境变量，其次读构建时注入的 .env */
function adminPassword(): string {
  return process.env.ADMIN_PASSWORD || (import.meta.env.ADMIN_PASSWORD as string | undefined) || '';
}

export function authEnabled(): boolean {
  return adminPassword() !== '';
}

function digest(value: string): Buffer {
  return createHash('sha256').update(value, 'utf8').digest();
}

export function verifyPassword(input: unknown): boolean {
  const expected = adminPassword();
  if (!expected) return true;
  if (typeof input !== 'string' || input === '') return false;

  // 先哈希再比较，长度一致的同时避免泄漏长度信息
  return timingSafeEqual(digest(input), digest(expected));
}

function cleanup(): void {
  const now = Date.now();
  for (const [token, expiry] of sessions) {
    if (expiry <= now) sessions.delete(token);
  }
}

export function createSession(): string {
  cleanup();
  const token = `${randomUUID()}${randomUUID()}`.replace(/-/g, '');
  sessions.set(token, Date.now() + SESSION_TTL_MS);
  return token;
}

export function isValidSession(token: string | undefined | null): boolean {
  if (!authEnabled()) return true;
  if (!token) return false;

  const expiry = sessions.get(token);
  if (!expiry) return false;

  if (expiry <= Date.now()) {
    sessions.delete(token);
    return false;
  }

  return true;
}

export function destroySession(token: string | undefined | null): void {
  if (token) sessions.delete(token);
}

/** 当前请求是否是已登录的管理员 */
export function isAdmin(cookies: { get(name: string): { value: string } | undefined }): boolean {
  return isValidSession(cookies.get(SESSION_COOKIE)?.value);
}
