/** API 路由的公共小工具 */

export function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
    },
  });
}

/** 同时兼容 JSON 与表单提交 */
export async function readBody(request: Request): Promise<Record<string, any>> {
  const contentType = request.headers.get('content-type') ?? '';

  try {
    if (contentType.includes('application/json')) {
      const data = await request.json();
      return data && typeof data === 'object' ? data : {};
    }

    if (contentType.includes('form')) {
      const form = await request.formData();
      return Object.fromEntries(form.entries());
    }
  } catch {
    // 解析失败按空对象处理，交给上层报「字段缺失」
  }

  return {};
}

