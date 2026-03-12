import { Hono } from 'hono';
import { cors } from 'hono/cors';
import type { AppEnv } from './types';
import authRoutes from './routes/auth';
import adminRoutes from './routes/admin';
import workerRoutes from './routes/worker';
import customerRoutes from './routes/customer';
import { fail, ok } from './utils/response';

const app = new Hono<AppEnv>();

app.use('/api/*', async (c, next) => {
  const requestOrigin = c.req.header('Origin');
  const allowedOrigin = c.env.FRONTEND_ORIGIN || requestOrigin || '*';

  return cors({
    origin: allowedOrigin,
    allowHeaders: ['Content-Type', 'Authorization'],
    allowMethods: ['GET', 'POST', 'PUT', 'OPTIONS'],
    exposeHeaders: ['Content-Length'],
    maxAge: 86400
  })(c, next);
});

app.get('/', (c) =>
  ok(c, {
    name: 'game-service-platform-api',
    status: 'ok'
  })
);

app.route('/api', authRoutes);
app.route('/api/admin', adminRoutes);
app.route('/api/worker', workerRoutes);
app.route('/api/customer', customerRoutes);

app.notFound((c) => fail(c, 404, '接口不存在。', 'NOT_FOUND'));

app.onError((error, c) => {
  console.error(error);
  return fail(c, 500, '服务器内部错误。', 'INTERNAL_SERVER_ERROR');
});

export default app;
