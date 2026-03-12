import type { Context } from 'hono';
import type { AppEnv } from '../types';

export function ok<T>(c: Context<AppEnv>, data: T, status = 200, message = 'ok') {
  return c.json(
    {
      success: true,
      message,
      data
    },
    status
  );
}

export function fail(
  c: Context<AppEnv>,
  status: number,
  message: string,
  code = 'BAD_REQUEST',
  details?: unknown
) {
  return c.json(
    {
      success: false,
      error: {
        code,
        message,
        details
      }
    },
    status
  );
}
