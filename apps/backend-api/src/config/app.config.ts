import { registerAs } from "@nestjs/config";

import type { ValidatedEnvironment } from "./env.validation";

function splitCorsOrigins(value: string): string[] {
  return value
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);
}

export const appConfig = registerAs("app", () => {
  const env = process.env as unknown as ValidatedEnvironment;

  return {
    appEnv: env.APP_ENV,
    port: Number(env.PORT),
    publicApiUrl: env.PUBLIC_API_URL,
    corsOrigins: splitCorsOrigins(env.CORS_ORIGINS),
    databaseUrl: env.DATABASE_URL,
    redisUrl: env.REDIS_URL,
    jwtSecret: env.JWT_SECRET,
    jwtExpiresIn: env.JWT_EXPIRES_IN,
    refreshTokenSecret: env.REFRESH_TOKEN_SECRET,
    shopeeWebhookSecret: env.SHOPEE_WEBHOOK_SECRET,
    shopeeMockMode: env.SHOPEE_MOCK_MODE === "true",
    shopeeWebhookMaxSkewSeconds: Number(env.SHOPEE_WEBHOOK_MAX_SKEW_SECONDS),
    logLevel: env.LOG_LEVEL,
    version: process.env.npm_package_version ?? "0.1.0",
  };
});
