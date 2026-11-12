import { env } from '@/config/env.js';

/**
 * Shared HTTP client. ALL modules must use this instead of calling fetch directly.
 *
 * Backend contract:
 *   success: { success: true,  message, data }
 *   error:   { success: false, message, error: { code, details } }
 *
 * On success, request() resolves with the `data` payload.
 * On failure, it throws an ApiError.
 */

export class ApiError extends Error {
  constructor(message, { status = 0, code = 'UNKNOWN_ERROR', details = null } = {}) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

const buildUrl = (path) => `${env.apiBaseUrl}/${String(path).replace(/^\/+/, '')}`;

const parseJson = async (response) => {
  try {
    return await response.json();
  } catch {
    return null;
  }
};

/**
 * @param {string} path  e.g. "/health"
 * @param {object} [options]
 * @param {string} [options.method]
 * @param {object} [options.body]      JSON body (sent as application/json)
 * @param {FormData} [options.formData] multipart/form-data body (browser sets boundary)
 * @param {object} [options.headers]   extra headers (e.g. Authorization)
 * @param {AbortSignal} [options.signal]
 */
export async function request(path, { method = 'GET', body, formData, headers = {}, signal } = {}) {
  const finalHeaders = { Accept: 'application/json', ...headers };
  let payload;

  if (formData) {
    // Do NOT set Content-Type: the browser adds the multipart boundary.
    payload = formData;
  } else if (body !== undefined) {
    finalHeaders['Content-Type'] = 'application/json';
    payload = JSON.stringify(body);
  }

  let response;
  try {
    response = await fetch(buildUrl(path), { method, headers: finalHeaders, body: payload, signal });
  } catch (error) {
    if (error?.name === 'AbortError') throw error;
    throw new ApiError('Unable to reach the server. Please try again.', { code: 'NETWORK_ERROR' });
  }

  const json = await parseJson(response);

  if (!response.ok || !json || json.success !== true) {
    throw new ApiError(json?.message || 'Something went wrong. Please try again.', {
      status: response.status,
      code: json?.error?.code || 'UNEXPECTED_RESPONSE',
      details: json?.error?.details ?? null,
    });
  }

  return json.data;
}

export const api = {
  get: (path, options) => request(path, { ...options, method: 'GET' }),
  post: (path, body, options) => request(path, { ...options, method: 'POST', body }),
  put: (path, body, options) => request(path, { ...options, method: 'PUT', body }),
  patch: (path, body, options) => request(path, { ...options, method: 'PATCH', body }),
  delete: (path, options) => request(path, { ...options, method: 'DELETE' }),
  /** Multipart upload support (prepared only; no upload feature yet). */
  postForm: (path, formData, options) => request(path, { ...options, method: 'POST', formData }),
};
