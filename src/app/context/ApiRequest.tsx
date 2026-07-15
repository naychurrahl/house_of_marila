export interface apiData {
  url: string;
  method?: 'GET' | 'POST' | 'OPTIONS' | 'PUT' | 'DELETE';
  body?: any;
  headers?: object;
}

export const baseUrl = import.meta.env.VITE_API_URL || 'https://marila.com';

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

  const options: RequestInit = {
    method: needsOverride ? 'POST' : method,
    headers: isFormData
      ? {
          ...headers,
          ...(needsOverride && { 'X-HTTP-Method-Override': method }),
        }
      : {
          'Content-Type': 'application/json',
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
