import type { APIContext } from 'astro';
import {
  createSession,
  SESSION_COOKIE,
  sessionMaxAgeSeconds,
  verifyPassword,
} from '../../lib/auth';
import { json, readBody } from '../../lib/api';

export async function POST({ request, cookies }: APIContext) {
  const body = await readBody(request);

  if (!verifyPassword(body.password)) {
    return json({ errors: ['密码不正确'] }, 401);
  }

  cookies.set(SESSION_COOKIE, createSession(), {
    path: '/',
    httpOnly: true,
    sameSite: 'lax',
    maxAge: sessionMaxAgeSeconds,
  });

  return json({ ok: true });
}

