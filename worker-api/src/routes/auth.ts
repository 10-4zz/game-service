import { Hono } from 'hono';
import { createAuthToken, sha256Hex } from '../auth';
import { getUserByUsername } from '../db';
import type { AppEnv } from '../types';
import { authRequired } from '../middleware';
import { fail, ok } from '../utils/response';
import { isNonEmptyString, toTrimmedString } from '../utils/validation';

const authRoutes = new Hono<AppEnv>();

authRoutes.post('/login', async (c) => {
  const body = await c.req.json().catch(() => ({}));
  const username = toTrimmedString(body.username);
  const password = toTrimmedString(body.password);

  if (!isNonEmptyString(username) || !isNonEmptyString(password)) {
    return fail(c, 400, '请输入账号和密码。');
  }

  const user = await getUserByUsername(c.env.DB, username);

  if (!user || !user.is_active) {
    return fail(c, 401, '账号或密码错误。', 'LOGIN_FAILED');
  }

  const passwordHash = await sha256Hex(password);

  if (passwordHash !== user.password_hash) {
    return fail(c, 401, '账号或密码错误。', 'LOGIN_FAILED');
  }

  const authUser = {
    id: user.id,
    username: user.username,
    role: user.role,
    displayName: user.display_name
  };

  const token = await createAuthToken(authUser, c.env.JWT_SECRET);

  return ok(c, {
    token,
    user: authUser
  });
});

authRoutes.post('/logout', async (c) => ok(c, { loggedOut: true }));

authRoutes.get('/me', authRequired, async (c) => ok(c, c.get('authUser')));

export default authRoutes;
