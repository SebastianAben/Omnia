import {
  createHmac,
  scryptSync,
  timingSafeEqual,
} from "node:crypto";

import {
  Inject,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import type { ConfigType } from "@nestjs/config";

import { ok } from "../common/http";
import { appConfig } from "../config/app.config";
import { PrismaService } from "../prisma/prisma.service";
import { CurrentUser, LoginDto } from "./dto";

type TokenPayload = {
  sub: string;
  username: string;
  role_code: string;
  branch_id?: string;
  exp: number;
};

function base64Url(input: Buffer | string): string {
  return Buffer.from(input).toString("base64url");
}

function parseExpiresIn(value: string): number {
  const match = /^(\d+)([smhd])?$/.exec(value);
  if (!match) {
    return 15 * 60;
  }

  const amount = Number(match[1]);
  const unit = match[2] ?? "s";
  const multipliers: Record<string, number> = {
    s: 1,
    m: 60,
    h: 60 * 60,
    d: 24 * 60 * 60,
  };
  return amount * multipliers[unit];
}

@Injectable()
export class AuthService {
  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(appConfig.KEY)
    private readonly config: ConfigType<typeof appConfig>,
  ) {}

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findFirst({
      where: {
        OR: [{ username: dto.username }, { email: dto.username }],
        isActive: true,
      },
      include: {
        role: true,
        branch: true,
      },
    });

    if (!user || !this.verifyPassword(dto.password, user.passwordHash)) {
      throw new UnauthorizedException("Invalid username or password");
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    await this.prisma.auditLog.create({
      data: {
        userId: user.id,
        branchId: user.branchId,
        entityType: "user",
        entityId: user.id,
        action: "login",
        note: dto.device_id ? `device:${dto.device_id}` : undefined,
      },
    });

    const currentUser = {
      id: user.id,
      full_name: user.fullName,
      username: user.username,
      role_code: user.role.code,
      branch_id: user.branchId ?? undefined,
    };

    return ok({
      token: this.signToken(currentUser),
      user: currentUser,
      permissions: [],
      branches: user.branch ? [this.serializeBranch(user.branch)] : [],
    });
  }

  async me(user: CurrentUser) {
    const freshUser = await this.prisma.user.findUnique({
      where: { id: user.id },
      include: {
        role: true,
        branch: true,
      },
    });

    if (!freshUser?.isActive) {
      throw new UnauthorizedException("User is no longer active");
    }

    return ok({
      user: {
        id: freshUser.id,
        full_name: freshUser.fullName,
        username: freshUser.username,
        role_code: freshUser.role.code,
        branch_id: freshUser.branchId ?? undefined,
      },
      permissions: [],
      branches: freshUser.branch ? [this.serializeBranch(freshUser.branch)] : [],
    });
  }

  verifyToken(token: string): CurrentUser {
    const parts = token.split(".");
    if (parts.length !== 3) {
      throw new UnauthorizedException("Invalid bearer token");
    }

    const [header, payload, signature] = parts;
    const expectedSignature = this.signature(`${header}.${payload}`);
    if (signature !== expectedSignature) {
      throw new UnauthorizedException("Invalid bearer token");
    }

    const parsedPayload = JSON.parse(
      Buffer.from(payload, "base64url").toString("utf8"),
    ) as TokenPayload;
    if (parsedPayload.exp < Math.floor(Date.now() / 1000)) {
      throw new UnauthorizedException("Bearer token expired");
    }

    return {
      id: parsedPayload.sub,
      full_name: "",
      username: parsedPayload.username,
      role_code: parsedPayload.role_code,
      branch_id: parsedPayload.branch_id,
    };
  }

  private signToken(user: CurrentUser): string {
    const header = base64Url(
      JSON.stringify({ alg: "HS256", typ: "JWT" }),
    );
    const payload = base64Url(
      JSON.stringify({
        sub: user.id,
        username: user.username,
        role_code: user.role_code,
        branch_id: user.branch_id,
        exp:
          Math.floor(Date.now() / 1000) +
          parseExpiresIn(this.config.jwtExpiresIn),
      } satisfies TokenPayload),
    );
    const signature = this.signature(`${header}.${payload}`);
    return `${header}.${payload}.${signature}`;
  }

  private signature(value: string): string {
    return createHmac("sha256", this.config.jwtSecret)
      .update(value)
      .digest("base64url");
  }

  private verifyPassword(password: string, hash: string): boolean {
    const [scheme, salt, key] = hash.split(":");
    if (scheme !== "scrypt" || !salt || !key) {
      return false;
    }

    const expected = Buffer.from(key, "hex");
    const actual = scryptSync(password, salt, 64);
    return expected.length === actual.length && timingSafeEqual(expected, actual);
  }

  private serializeBranch(branch: { id: string; code: string; name: string }) {
    return {
      id: branch.id,
      code: branch.code,
      name: branch.name,
    };
  }
}
