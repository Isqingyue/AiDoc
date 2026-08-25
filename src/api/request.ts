const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL as string | undefined)?.replace(/\/$/, "") ?? "";
let accessToken: string | null = null;
let globalErrorHandler: ((error: ApiError) => void) | null = null;

interface ErrorPayload {
  detail?: string;
  message?: string;
  code?: string;
}

export interface RequestOptions extends Omit<RequestInit, "body"> {
  body?: BodyInit | object | null;
  fallbackMessage?: string;
  skipUnauthorizedHandler?: boolean;
}

export class ApiError extends Error {
  readonly status: number;
  readonly code?: string;

  constructor(message: string, status: number, code?: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
  }
}

export function setAccessToken(token: string | null): void {
  accessToken = token;
}

export function setGlobalApiErrorHandler(handler: ((error: ApiError) => void) | null): () => void {
  globalErrorHandler = handler;
  return () => {
    if (globalErrorHandler === handler) globalErrorHandler = null;
  };
}

function buildUrl(path: string): string {
  if (/^https?:\/\//.test(path)) return path;
  return `${API_BASE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}

function isSerializableBody(body: RequestOptions["body"]): body is object {
  return body !== null
    && typeof body === "object"
    && !(body instanceof FormData)
    && !(body instanceof Blob)
    && !(body instanceof URLSearchParams)
    && !(body instanceof ArrayBuffer);
}

async function parseError(response: Response, fallbackMessage: string): Promise<ApiError> {
  let payload: ErrorPayload = {};
  try {
    payload = await response.json() as ErrorPayload;
  } catch {
    // 非 JSON 错误响应使用统一回退文案。
  }
  return new ApiError(payload.detail ?? payload.message ?? fallbackMessage, response.status, payload.code);
}

async function openResponse(path: string, options: RequestOptions): Promise<Response> {
  const {
    body,
    fallbackMessage = "请求失败",
    headers,
    skipUnauthorizedHandler = false,
    ...init
  } = options;
  const requestHeaders = new Headers(headers);
  const serializable = isSerializableBody(body);

  if (serializable && !requestHeaders.has("Content-Type")) {
    requestHeaders.set("Content-Type", "application/json");
  }
  if (accessToken && !requestHeaders.has("Authorization")) {
    requestHeaders.set("Authorization", `Bearer ${accessToken}`);
  }

  let response: Response;
  try {
    response = await fetch(buildUrl(path), {
      ...init,
      credentials: init.credentials ?? "include",
      headers: requestHeaders,
      body: serializable ? JSON.stringify(body) : body as BodyInit | null | undefined,
    });
  } catch (reason) {
    if (reason instanceof DOMException && reason.name === "AbortError") throw reason;
    const error = new ApiError("网络连接失败，请检查服务状态。", 0);
    globalErrorHandler?.(error);
    throw error;
  }

  if (!response.ok) {
    const error = await parseError(response, fallbackMessage);
    if ((error.status === 401 && !skipUnauthorizedHandler) || error.status >= 500) {
      globalErrorHandler?.(error);
    }
    throw error;
  }
  return response;
}

export async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const response = await openResponse(path, options);
  if (response.status === 204) return undefined as T;

  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) return response as T;
  return response.json() as Promise<T>;
}

export async function* streamJsonLines<T>(
  path: string,
  options: RequestOptions = {},
): AsyncGenerator<T> {
  const response = await openResponse(path, options);
  if (!response.body) throw new ApiError('服务未返回可读取的数据流。', response.status);

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  try {
    while (true) {
      const { done, value } = await reader.read();
      buffer += decoder.decode(value, { stream: !done });
      const lines = buffer.split('\n');
      buffer = lines.pop() ?? '';

      for (const line of lines) {
        if (line.trim()) yield JSON.parse(line) as T;
      }

      if (done) break;
    }

    if (buffer.trim()) yield JSON.parse(buffer) as T;
  } finally {
    reader.releaseLock();
  }
}

export function get<T>(path: string, options?: Omit<RequestOptions, "method" | "body">): Promise<T> {
  return request<T>(path, { ...options, method: "GET" });
}

export function post<T>(path: string, body?: RequestOptions["body"], options?: Omit<RequestOptions, "method" | "body">): Promise<T> {
  return request<T>(path, { ...options, method: "POST", body });
}

export function patch<T>(path: string, body: object, options?: Omit<RequestOptions, "method" | "body">): Promise<T> {
  return request<T>(path, { ...options, method: "PATCH", body });
}

export function put<T>(path: string, body: object, options?: Omit<RequestOptions, "method" | "body">): Promise<T> {
  return request<T>(path, { ...options, method: "PUT", body });
}

export function remove<T = void>(path: string, options?: Omit<RequestOptions, "method" | "body">): Promise<T> {
  return request<T>(path, { ...options, method: "DELETE" });
}
