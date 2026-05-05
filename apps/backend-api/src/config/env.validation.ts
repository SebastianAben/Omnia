type AppEnv = "local" | "staging" | "production";
type LogLevel = "debug" | "info" | "warn" | "error";

export type ValidatedEnvironment = {
  APP_ENV: AppEnv;
  PORT: string;
  PUBLIC_API_URL: string;
  CORS_ORIGINS: string;
  DATABASE_URL: string;
  REDIS_URL: string;
  JWT_SECRET: string;
  JWT_EXPIRES_IN: string;
  REFRESH_TOKEN_SECRET?: string;
  SHOPEE_CLIENT_ID?: string;
  SHOPEE_CLIENT_SECRET?: string;
  SHOPEE_REDIRECT_URI?: string;
  SENTRY_DSN?: string;
  LOG_LEVEL: LogLevel;
};

const validAppEnvs = new Set<AppEnv>(["local", "staging", "production"]);
const validLogLevels = new Set<LogLevel>(["debug", "info", "warn", "error"]);

function requireString(
  config: Record<string, unknown>,
  key: keyof ValidatedEnvironment,
): string {
  const value = config[key];
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new Error(`Missing required environment variable: ${key}`);
  }

  return value.trim();
}

function optionalString(
  config: Record<string, unknown>,
  key: keyof ValidatedEnvironment,
): string | undefined {
  const value = config[key];
  if (value === undefined || value === null || value === "") {
    return undefined;
  }

  if (typeof value !== "string") {
    throw new Error(`Environment variable ${key} must be a string`);
  }

  return value.trim();
}

export function validateEnvironment(
  config: Record<string, unknown>,
): ValidatedEnvironment {
  const appEnv = requireString(config, "APP_ENV");
  const port = requireString(config, "PORT");
  const logLevel = requireString(config, "LOG_LEVEL");
  const parsedPort = Number(port);

  if (!validAppEnvs.has(appEnv as AppEnv)) {
    throw new Error("APP_ENV must be one of: local, staging, production");
  }

  if (!Number.isInteger(parsedPort) || parsedPort < 1 || parsedPort > 65535) {
    throw new Error("PORT must be a valid TCP port");
  }

  if (!validLogLevels.has(logLevel as LogLevel)) {
    throw new Error("LOG_LEVEL must be one of: debug, info, warn, error");
  }

  return {
    APP_ENV: appEnv as AppEnv,
    PORT: String(parsedPort),
    PUBLIC_API_URL: requireString(config, "PUBLIC_API_URL"),
    CORS_ORIGINS: requireString(config, "CORS_ORIGINS"),
    DATABASE_URL: requireString(config, "DATABASE_URL"),
    REDIS_URL: requireString(config, "REDIS_URL"),
    JWT_SECRET: requireString(config, "JWT_SECRET"),
    JWT_EXPIRES_IN: requireString(config, "JWT_EXPIRES_IN"),
    REFRESH_TOKEN_SECRET: optionalString(config, "REFRESH_TOKEN_SECRET"),
    SHOPEE_CLIENT_ID: optionalString(config, "SHOPEE_CLIENT_ID"),
    SHOPEE_CLIENT_SECRET: optionalString(config, "SHOPEE_CLIENT_SECRET"),
    SHOPEE_REDIRECT_URI: optionalString(config, "SHOPEE_REDIRECT_URI"),
    SENTRY_DSN: optionalString(config, "SENTRY_DSN"),
    LOG_LEVEL: logLevel as LogLevel,
  };
}
