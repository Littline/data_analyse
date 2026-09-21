import type { APIContext } from 'astro';
import { destroySession, SESSION_COOKIE } from '../../lib/auth';
import { json } from '../../lib/api';

export async function POST({ cookies }: APIContext) {
  destroySession(cookies.get(SESSION_COOKIE)?.value);
  cookies.delete(SESSION_COOKIE, { path: '/' });
  return json({ ok: true });
}

