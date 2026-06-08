import { createHmac, timingSafeEqual } from "node:crypto";

import { UnauthorizedException } from "@nestjs/common";
import { z } from "zod";

import type { CurrentUser } from "./dto";

const tokenHeaderSchema = z.object({
  alg: z.literal("HS256"),
  typ: z.literal("JWT"),
});

const tokenPayloadSchema = z.object({
  sub: z.string().min(1),
  username: z.string().min(1),
  role_code: z.string().min(1),
  branch_id: z.string().min(1).optional(),
  iat: z.number().int().nonnegative(),
  exp: z.number().int().positive(),
});

type TokenPayload = z.infer<typeof tokenPayloadSchema>;

function encodeJson(value: unknown): string {
  return Buffer.from(JSON.stringify(value)).toString("base64url");
}

function decodeJson(value: string): unknown {
  return JSON.parse(Buffer.from(value, "base64url").toString("utf8"));
}

function sign(value: string, secret: string): Buffer {
  return createHmac("sha256", secret).update(value).digest();
}

export function parseExpiresIn(value: string): number {
  const match = /^(\d+)([smhd])?$/.exec(value);
  if (!match) {
    throw new Error("Invalid JWT expiration configuration");
  }

  const multipliers = {
    s: 1,
    m: 60,
    h: 60 * 60,
    d: 24 * 60 * 60,
  } as const;
  const unit = (match[2] ?? "s") as keyof typeof multipliers;

  return Number(match[1]) * multipliers[unit];
}

export function signAccessToken(
  user: CurrentUser,
  secret: string,
  expiresIn: string,
  nowSeconds = Math.floor(Date.now() / 1000),
): string {
  const header = encodeJson({ alg: "HS256", typ: "JWT" });
  const payload = encodeJson({
    sub: user.id,
    username: user.username,
    role_code: user.role_code,
    branch_id: user.branch_id,
    iat: nowSeconds,
    exp: nowSeconds + parseExpiresIn(expiresIn),
  } satisfies TokenPayload);
  const signature = sign(`${header}.${payload}`, secret).toString("base64url");

  return `${header}.${payload}.${signature}`;
}

export function verifyAccessToken(
  token: string,
  secret: string,
  nowSeconds = Math.floor(Date.now() / 1000),
): CurrentUser {
  try {
    const parts = token.split(".");
    if (parts.length !== 3 || parts.some((part) => !part)) {
      throw new Error("Invalid token structure");
    }

    const [header, payload, signature] = parts;
    tokenHeaderSchema.parse(decodeJson(header));

    const expectedSignature = sign(`${header}.${payload}`, secret);
    const actualSignature = Buffer.from(signature, "base64url");
    if (
      actualSignature.length !== expectedSignature.length ||
      !timingSafeEqual(actualSignature, expectedSignature)
    ) {
      throw new Error("Invalid token signature");
    }

    const claims = tokenPayloadSchema.parse(decodeJson(payload));
    if (claims.exp <= nowSeconds || claims.iat > nowSeconds) {
      throw new Error("Invalid token lifetime");
    }

    const currentUser: CurrentUser = {
      id: claims.sub,
      full_name: "",
      username: claims.username,
      role_code: claims.role_code,
    };
    if (claims.branch_id) {
      currentUser.branch_id = claims.branch_id;
    }

    return currentUser;
  } catch {
    throw new UnauthorizedException("Invalid or expired bearer token");
  }
}
