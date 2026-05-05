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

const defaultApiBaseUrl = "http://localhost:4000/api/v1";

const localHostnames = new Set(["localhost", "127.0.0.1", "::1"]);

export const getApiBaseUrl = () => {
  const configuredBaseUrl =
    process.env.NEXT_PUBLIC_API_BASE_URL ?? defaultApiBaseUrl;

  if (typeof window === "undefined") {
    return configuredBaseUrl;
  }

  const pageHostname = window.location.hostname;
  if (localHostnames.has(pageHostname)) {
    return configuredBaseUrl;
  }

  try {
    const apiUrl = new URL(configuredBaseUrl);
    if (localHostnames.has(apiUrl.hostname)) {
      apiUrl.hostname = pageHostname;
      return apiUrl.toString().replace(/\/$/, "");
    }
  } catch {
    return configuredBaseUrl;
  }

  return configuredBaseUrl;
};

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
