/**
 * HTTP client for /api/sn (docs/ARCHITECTURE.md §17.5).
 * Unlike the legacy ApiService it keeps the backend error `code` (mapped to Vietnamese via sn.errors.<CODE>)
 * and sends an Idempotency-Key on every command (POST).
 */
import axios, { AxiosError, AxiosRequestConfig } from "axios";

export const SN_TOKEN_KEY = "sn_access_token";

export class SnApiError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
    readonly details?: Record<string, unknown>,
    readonly body?: any
  ) {
    super(message);
  }
}

const http = axios.create({ baseURL: "/api/sn", timeout: 20000 });

http.interceptors.request.use(config => {
  const token = localStorage.getItem(SN_TOKEN_KEY);
  if (token) config.headers = { ...(config.headers as any), Authorization: `Bearer ${token}` } as any;
  return config;
});

export const newIdempotencyKey = (): string =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(16).slice(2)}`;

type Listener = (err: SnApiError) => void;
const unauthorizedListeners: Listener[] = [];
export const onUnauthorized = (fn: Listener) => unauthorizedListeners.push(fn);

async function request<T>(config: AxiosRequestConfig): Promise<T> {
  try {
    const res = await http.request(config);
    return res.data?.payload as T;
  } catch (e) {
    const err = e as AxiosError<any>;
    const status = err.response?.status ?? 0;
    const body = err.response?.data ?? {};
    const code = body.code || (status === 401 ? "UNAUTHORIZED" : status === 0 ? "NETWORK_ERROR" : `HTTP_${status}`);
    const apiError = new SnApiError(status, code, body.message || err.message, body.details, body);
    if (status === 401 && code !== "INVALID_CREDENTIALS") unauthorizedListeners.forEach(fn => fn(apiError));
    throw apiError;
  }
}

export const snApi = {
  get: <T = any>(url: string, params?: Record<string, unknown>) => request<T>({ method: "GET", url, params }),
  /** Commands: one Idempotency-Key per user action; pass the same key when retrying the same action. */
  post: <T = any>(url: string, data?: unknown, idempotencyKey: string = newIdempotencyKey()) =>
    request<T>({ method: "POST", url, data, headers: { "Idempotency-Key": idempotencyKey } }),
  put: <T = any>(url: string, data?: unknown) => request<T>({ method: "PUT", url, data }),
  del: <T = any>(url: string) => request<T>({ method: "DELETE", url })
};
