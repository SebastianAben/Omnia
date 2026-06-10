import { z } from "zod";

const envSchema = z.object({
  APP_ENV: z.enum(["local", "staging", "production"]),
  PORT: z.coerce.number().int().min(1).max(65535).transform(String),
  HOST: z.string().min(1).default("0.0.0.0"),
  PUBLIC_API_URL: z.string().url(),
  CORS_ORIGINS: z.string().min(1),
  DATABASE_URL: z.string().min(1),
  REDIS_URL: z.string().min(1),
  JWT_SECRET: z.string().min(16),
  JWT_EXPIRES_IN: z.string().regex(/^\d+[smhd]?$/),
  REFRESH_TOKEN_SECRET: z.string().min(16),
  REFRESH_TOKEN_EXPIRES_IN: z
    .string()
    .regex(/^\d+[smhd]?$/)
    .default("30d"),
  LLM_PROVIDER: z.enum(["gemini"]).default("gemini"),
  LLM_API_KEY: z.string().optional().or(z.literal("")),
  LLM_MODEL: z.string().min(1).default("gemini-2.5-flash"),
  LLM_TIMEOUT_MS: z.coerce
    .number()
    .int()
    .min(1000)
    .default(20000)
    .transform(String),
  LLM_INSIGHT_TTL_MINUTES: z.coerce
    .number()
    .int()
    .min(1)
    .default(15)
    .transform(String),
  LLM_MAX_INSIGHTS: z.coerce
    .number()
    .int()
    .min(1)
    .max(8)
    .default(8)
    .transform(String),
  LLM_MAX_CONTEXT_ROWS: z.coerce
    .number()
    .int()
    .min(1)
    .max(100)
    .default(30)
    .transform(String),
  LLM_GENERATION_COOLDOWN_MINUTES: z.coerce
    .number()
    .int()
    .min(0)
    .default(60)
    .transform(String),
  SENTRY_DSN: z.string().url().optional().or(z.literal("")),
  LOG_LEVEL: z.enum(["debug", "info", "warn", "error"]),
});

export type ValidatedEnvironment = z.infer<typeof envSchema>;

export function validateEnvironment(
  config: Record<string, unknown>,
): ValidatedEnvironment {
  const result = envSchema.safeParse(config);
  if (!result.success) {
    const errors = result.error.issues
      .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
      .join("; ");
    throw new Error(`Invalid environment configuration: ${errors}`);
  }

  return result.data;
}
