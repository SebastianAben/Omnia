export interface ApiResponse<TData = unknown, TMeta = unknown> {
  success: boolean;
  message?: string;
  data?: TData;
  meta?: TMeta;
  error?: {
    code: string;
    details?: unknown;
  };
}

export function createSuccessResponse<TData, TMeta = unknown>(
  data: TData,
  message?: string,
  meta?: TMeta,
): ApiResponse<TData, TMeta> {
  return {
    success: true,
    message,
    data,
    meta,
  };
}

export function createErrorResponse(
  code: string,
  message: string,
  details?: unknown,
): ApiResponse {
  return {
    success: false,
    message,
    error: {
      code,
      details,
    },
  };
}

export function parseCommaSeparatedList(value: string | undefined): string[] {
  if (!value) {
    return [];
  }

  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}
