import { createMiddleware } from 'hono/factory';
import { readAuthToken } from './auth';
import type { AppEnv, Role } from './types';
import { fail } from './utils/response';

export const authRequired = createMiddleware<AppEnv>(async (c, next) => {
  const authorization = c.req.header('Authorization') ?? '';

  if (!authorization.startsWith('Bearer ')) {
    return fail(c, 401, '缺少有效的认证令牌。', 'UNAUTHORIZED');
  }

  const token = authorization.slice('Bearer '.length).trim();

  if (!token) {
    return fail(c, 401, '缺少有效的认证令牌。', 'UNAUTHORIZED');
  }

  try {
    const payload = await readAuthToken(token, c.env.JWT_SECRET);
    c.set('authUser', {
      id: Number(payload.id),
      username: payload.username,
      role: payload.role,
      displayName: payload.displayName
    });
    await next();
  } catch {
    return fail(c, 401, '登录态已失效，请重新登录。', 'TOKEN_INVALID');
  }
});

export function requireRole(...roles: Role[]) {
  return createMiddleware<AppEnv>(async (c, next) => {
    const authUser = c.get('authUser');

    if (!authUser) {
      return fail(c, 401, '请先登录。', 'UNAUTHORIZED');
    }

    if (!roles.includes(authUser.role)) {
      return fail(c, 403, '当前账号无权访问该资源。', 'FORBIDDEN');
    }

    await next();
  });
}
