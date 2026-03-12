import { sign, verify } from 'hono/jwt';
import type { AuthUser, JwtPayload } from './types';

export async function sha256Hex(input: string) {
  const bytes = new TextEncoder().encode(input);
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  const hashArray = Array.from(new Uint8Array(digest));
  return hashArray.map((item) => item.toString(16).padStart(2, '0')).join('');
}

export async function createAuthToken(user: AuthUser, secret: string) {
  const now = Math.floor(Date.now() / 1000);
  const payload: JwtPayload = {
    ...user,
    iat: now,
    exp: now + 60 * 60 * 24 * 7
  };

  return sign(payload, secret);
}

export async function readAuthToken(token: string, secret: string) {
  const payload = await verify(token, secret);
  return payload as unknown as JwtPayload;
}
