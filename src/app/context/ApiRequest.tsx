export interface apiData {
  url: string;
  method?: 'GET' | 'POST' | 'OPTIONS' | 'PUT' | 'DELETE';
  body?: any;
  headers?: object;
}

export const baseUrl = import.meta.env.VITE_API_URL || "https://marila.alwaysdata.net";

const TOKEN_KEY = 'marila_token';

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken(): void {
  localStorage.removeItem(TOKEN_KEY);
}

export async function ApiRequest({
  url,
  method = 'GET',
  body = null,
  headers = {},
}: apiData) {
  if (!url) {
    throw new Error('Requires a url');
  }

  const isFormData = body instanceof FormData;
  const needsOverride =
    isFormData && ['PUT', 'PATCH', 'DELETE'].includes(method);

  const token = getToken();
  const authHeader = token ? { Authorization: `Bearer ${token}` } : {};

  const options: RequestInit = {
    method: needsOverride ? 'POST' : method,
    headers: isFormData
      ? {
          ...headers,
          ...authHeader,
          ...(needsOverride && { 'X-HTTP-Method-Override': method }),
        }
      : {
          'Content-Type': 'application/json',
          ...authHeader,
          ...headers,
        },
    credentials: 'include',
  };

  if (body && method !== 'GET') {
    options.body = isFormData
      ? body
      : typeof body === 'string'
        ? body
        : JSON.stringify(body);
  }

  const response = await fetch(url, options);

  let result;
  const contentType = response.headers.get('content-type');

  if (contentType && contentType.includes('application/json')) {
    result = await response.json();
  } else {
    result = await response.text();
  }

  if (!response.ok) {
    throw new Error(result?.error || result?.message || `Request failed with status ${response.status}`);
  }

  return result;
}
