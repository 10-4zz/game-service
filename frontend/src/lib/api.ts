import type { ApiResponse, AuthUser } from '../types';

const TOKEN_KEY = 'game-service-platform-token';

export class ApiRequestError extends Error {
  status: number;
  code?: string;

  constructor(message: string, status: number, code?: string) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

export function getApiBase() {
  return (import.meta.env.VITE_API_BASE as string | undefined)?.replace(/\/$/, '') || '';
}

export function getStoredToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function setStoredToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearStoredToken() {
  localStorage.removeItem(TOKEN_KEY);
}

async function request<T>(path: string, options: RequestInit = {}, token = getStoredToken()) {
  const headers = new Headers(options.headers);
  headers.set('Content-Type', 'application/json');
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(`${getApiBase()}${path}`, {
    ...options,
    headers
  });
  const payload = (await response.json().catch(() => null)) as ApiResponse<T> | null;

  if (!response.ok || !payload?.success) {
    const message = payload?.error?.message || '请求失败';
    throw new ApiRequestError(message, response.status, payload?.error?.code);
  }

  return payload.data;
}

export function apiGet<T>(path: string, token?: string) {
  return request<T>(path, { method: 'GET' }, token);
}

export function apiPost<T>(path: string, body?: unknown, token?: string) {
  return request<T>(
    path,
    {
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined
    },
    token
  );
}

export function apiPut<T>(path: string, body?: unknown, token?: string) {
  return request<T>(
    path,
    {
      method: 'PUT',
      body: body ? JSON.stringify(body) : undefined
    },
    token
  );
}

export function loginRequest(username: string, password: string) {
  return apiPost<{ token: string; user: AuthUser }>('/api/login', { username, password });
}

export function logoutRequest(token?: string) {
  return apiPost<{ loggedOut: boolean }>('/api/logout', undefined, token);
}
