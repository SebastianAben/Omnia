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
  REFRESH_TOKEN_SECRET: z.string().min(16).optional(),
  SHOPEE_CLIENT_ID: z.string().optional(),
  SHOPEE_CLIENT_SECRET: z.string().optional(),
  SHOPEE_REDIRECT_URI: z.string().url().optional().or(z.literal("")),
  SHOPEE_WEBHOOK_SECRET: z
    .string()
    .min(1)
    .default("local-shopee-webhook-secret"),
  SHOPEE_MOCK_MODE: z
    .enum(["true", "false"])
    .default("true")
    .refine((value) => value === "true", {
      message: "must be true for mock-first Shopee integration",
    }),
  SHOPEE_WEBHOOK_MAX_SKEW_SECONDS: z.coerce
    .number()
    .int()
    .min(0)
    .default(300)
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
