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
let refreshAccessToken: (() => Promise<string | undefined>) | undefined;

export function setAccessTokenRefresher(
  refresher: (() => Promise<string | undefined>) | undefined,
) {
  refreshAccessToken = refresher;
}

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

  let response = await fetch(`${getApiBaseUrl()}${path}`, {
    ...init,
    headers,
  });

  if (response.status === 401 && init.token && refreshAccessToken) {
    const nextToken = await refreshAccessToken();
    if (nextToken) {
      headers.set("Authorization", `Bearer ${nextToken}`);
      response = await fetch(`${getApiBaseUrl()}${path}`, {
        ...init,
        headers,
      });
    }
  }

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

export async function apiFetchText(
  path: string,
  init: RequestInit & { token?: string } = {},
): Promise<{
  filename?: string;
  rowCount?: number;
  rowLimit?: number;
  text: string;
  truncated: boolean;
}> {
  const headers = new Headers(init.headers);

  if (init.token) {
    headers.set("Authorization", `Bearer ${init.token}`);
  }

  let response = await fetch(`${getApiBaseUrl()}${path}`, {
    ...init,
    headers,
  });

  if (response.status === 401 && init.token && refreshAccessToken) {
    const nextToken = await refreshAccessToken();
    if (nextToken) {
      headers.set("Authorization", `Bearer ${nextToken}`);
      response = await fetch(`${getApiBaseUrl()}${path}`, {
        ...init,
        headers,
      });
    }
  }

  const text = await response.text();

  if (!response.ok) {
    throw new ApiClientError(`Request failed: ${response.status}`, response.status);
  }

  return {
    filename: parseContentDispositionFilename(
      response.headers.get("content-disposition"),
    ),
    rowCount: parseNonNegativeInteger(response.headers.get("x-omnia-row-count")),
    rowLimit: parseNonNegativeInteger(response.headers.get("x-omnia-row-limit")),
    text,
    truncated: response.headers.get("x-omnia-truncated") === "true",
  };
}

function parseContentDispositionFilename(value: string | null) {
  if (!value) {
    return undefined;
  }

  const encodedMatch = /filename\*=UTF-8''(?<filename>[^;]+)/i.exec(value);
  if (encodedMatch?.groups?.filename) {
    try {
      return sanitizeDownloadFilename(
        decodeURIComponent(encodedMatch.groups.filename),
      );
    } catch {
      return undefined;
    }
  }

  const match = /filename="?(?<filename>[^";]+)"?/i.exec(value);
  return match?.groups?.filename
    ? sanitizeDownloadFilename(match.groups.filename)
    : undefined;
}

function sanitizeDownloadFilename(value: string) {
  return value.replace(/[\\/:*?"<>|]+/g, "-").trim() || undefined;
}

function parseNonNegativeInteger(value: string | null) {
  if (!value || !/^\d+$/.test(value)) {
    return undefined;
  }

  const parsed = Number(value);
  return Number.isSafeInteger(parsed) ? parsed : undefined;
}
