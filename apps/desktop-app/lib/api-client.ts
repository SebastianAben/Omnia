export type ApiEnvelope<T> = {
  success: boolean;
  message?: string;
  data: T;
  meta?: unknown;
  error?: {
    code: string;
    details?: unknown;
  };
};

const defaultApiBaseUrl = "http://localhost:3001/api/v1";

export const getApiBaseUrl = () =>
  process.env.NEXT_PUBLIC_API_BASE_URL ?? defaultApiBaseUrl;

export class ApiClientError extends Error {
  constructor(
    message: string,
    readonly status?: number,
    readonly code?: string,
  ) {
    super(message);
  }
}

export async function apiFetch<T>(
  path: string,
  init: RequestInit & { token?: string } = {},
): Promise<T> {
  const headers = new Headers(init.headers);
  headers.set("Content-Type", "application/json");

  if (init.token) {
    headers.set("Authorization", `Bearer ${init.token}`);
  }

  const response = await fetch(`${getApiBaseUrl()}${path}`, {
    ...init,
    headers,
  });

  const body = (await response
    .json()
    .catch(() => null)) as ApiEnvelope<T> | null;

  if (!response.ok || !body?.success) {
    throw new ApiClientError(
      body?.message ?? `Request failed: ${response.status}`,
      response.status,
      body?.error?.code,
    );
  }

  return body.data;
}
