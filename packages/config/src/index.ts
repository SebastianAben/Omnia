export type AppEnvironment = "local" | "preview" | "staging" | "production";

export interface PublicRuntimeConfig {
  appEnv: AppEnvironment;
  apiBaseUrl: string;
  syncStatusPollIntervalMs: number;
  sentryDsn?: string;
}

export interface BackendRuntimeConfig {
  appEnv: AppEnvironment;
  port: number;
  publicApiUrl: string;
  corsOrigins: string[];
  databaseUrl: string;
  redisUrl: string;
  jwtSecret: string;
  jwtExpiresIn: string;
  refreshTokenSecret: string;
  refreshTokenExpiresIn: string;
  logLevel: string;
}

type EnvRecord = Record<string, string | undefined>;

export function getPublicRuntimeConfig(env: EnvRecord): PublicRuntimeConfig {
  return {
    appEnv: readAppEnv(env.NEXT_PUBLIC_APP_ENV),
    apiBaseUrl: readRequired(
      env.NEXT_PUBLIC_API_BASE_URL,
      "NEXT_PUBLIC_API_BASE_URL",
    ),
    syncStatusPollIntervalMs: Number(
      env.NEXT_PUBLIC_SYNC_STATUS_POLL_INTERVAL_MS ?? 15000,
    ),
    sentryDsn: env.NEXT_PUBLIC_SENTRY_DSN || undefined,
  };
}

export function getBackendRuntimeConfig(env: EnvRecord): BackendRuntimeConfig {
  return {
    appEnv: readAppEnv(env.APP_ENV),
    port: Number(env.PORT ?? 4000),
    publicApiUrl: readRequired(env.PUBLIC_API_URL, "PUBLIC_API_URL"),
    corsOrigins: parseCommaSeparatedList(env.CORS_ORIGINS),
    databaseUrl: readRequired(env.DATABASE_URL, "DATABASE_URL"),
    redisUrl: readRequired(env.REDIS_URL, "REDIS_URL"),
    jwtSecret: readRequired(env.JWT_SECRET, "JWT_SECRET"),
    jwtExpiresIn: env.JWT_EXPIRES_IN ?? "15m",
    refreshTokenSecret: readRequired(
      env.REFRESH_TOKEN_SECRET,
      "REFRESH_TOKEN_SECRET",
    ),
    refreshTokenExpiresIn: env.REFRESH_TOKEN_EXPIRES_IN ?? "30d",
    logLevel: env.LOG_LEVEL ?? "info",
  };
}

function readRequired(value: string | undefined, key: string): string {
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }

  return value;
}

function readAppEnv(value: string | undefined): AppEnvironment {
  if (
    value === "local" ||
    value === "preview" ||
    value === "staging" ||
    value === "production"
  ) {
    return value;
  }

  return "local";
}

function parseCommaSeparatedList(value: string | undefined): string[] {
  if (!value) {
    return [];
  }

  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}
