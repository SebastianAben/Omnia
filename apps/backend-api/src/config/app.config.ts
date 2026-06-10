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
    host: env.HOST,
    publicApiUrl: env.PUBLIC_API_URL,
    corsOrigins: splitCorsOrigins(env.CORS_ORIGINS),
    databaseUrl: env.DATABASE_URL,
    redisUrl: env.REDIS_URL,
    jwtSecret: env.JWT_SECRET,
    jwtExpiresIn: env.JWT_EXPIRES_IN,
    refreshTokenSecret: env.REFRESH_TOKEN_SECRET,
    refreshTokenExpiresIn: env.REFRESH_TOKEN_EXPIRES_IN,
    llmProvider: env.LLM_PROVIDER,
    llmApiKey: env.LLM_API_KEY ?? "",
    llmModel: env.LLM_MODEL,
    llmTimeoutMs: Number(env.LLM_TIMEOUT_MS),
    llmInsightTtlMinutes: Number(env.LLM_INSIGHT_TTL_MINUTES),
    llmMaxInsights: Number(env.LLM_MAX_INSIGHTS),
    llmMaxContextRows: Number(env.LLM_MAX_CONTEXT_ROWS),
    llmGenerationCooldownMinutes: Number(env.LLM_GENERATION_COOLDOWN_MINUTES),
    logLevel: env.LOG_LEVEL,
    version: process.env.npm_package_version ?? "0.1.0",
  };
});
