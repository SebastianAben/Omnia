import {
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
import {
  createRefreshToken,
  hashRefreshToken,
} from "./auth-session-token";
import {
  parseExpiresIn,
  signAccessToken,
  verifyAccessToken,
} from "./auth-token";
import { CurrentUser, LoginDto, RefreshSessionDto } from "./dto";

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

    const tokens = await this.issueSession(
      user.id,
      currentUser,
      dto.device_id,
    );

    return ok({
      ...tokens,
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
    return verifyAccessToken(token, this.config.jwtSecret);
  }

  async refreshSession(dto: RefreshSessionDto) {
    const now = new Date();
    const tokenHash = this.hashRefreshToken(dto.refresh_token);
    const session = await this.prisma.authSession.findUnique({
      where: { tokenHash },
      include: {
        user: {
          include: {
            role: true,
            branch: true,
          },
        },
      },
    });

    if (
      !session ||
      session.revokedAt ||
      session.expiresAt <= now ||
      !session.user.isActive
    ) {
      throw new UnauthorizedException("Invalid or expired refresh token");
    }

    const currentUser = {
      id: session.user.id,
      full_name: session.user.fullName,
      username: session.user.username,
      role_code: session.user.role.code,
      branch_id: session.user.branchId ?? undefined,
    };
    const nextRefreshToken = createRefreshToken();
    const nextExpiresAt = this.refreshExpiry(now);

    await this.prisma.$transaction(async (transaction) => {
      const revoked = await transaction.authSession.updateMany({
        where: {
          id: session.id,
          revokedAt: null,
        },
        data: {
          revokedAt: now,
          lastUsedAt: now,
        },
      });

      if (revoked.count !== 1) {
        throw new UnauthorizedException("Refresh token was already used");
      }

      await transaction.authSession.create({
        data: {
          userId: session.userId,
          tokenHash: this.hashRefreshToken(nextRefreshToken),
          deviceId: session.deviceId,
          expiresAt: nextExpiresAt,
        },
      });
    });

    return ok({
      token: this.signToken(currentUser),
      refresh_token: nextRefreshToken,
      user: currentUser,
      permissions: [],
      branches: session.user.branch
        ? [this.serializeBranch(session.user.branch)]
        : [],
    });
  }

  async logout(dto: RefreshSessionDto) {
    const revoked = await this.prisma.authSession.updateMany({
      where: {
        tokenHash: this.hashRefreshToken(dto.refresh_token),
        revokedAt: null,
      },
      data: {
        revokedAt: new Date(),
      },
    });

    return ok({ revoked: revoked.count > 0 });
  }

  private signToken(user: CurrentUser): string {
    return signAccessToken(
      user,
      this.config.jwtSecret,
      this.config.jwtExpiresIn,
    );
  }

  private async issueSession(
    userId: string,
    user: CurrentUser,
    deviceId?: string,
  ) {
    const refreshToken = createRefreshToken();

    await this.prisma.authSession.create({
      data: {
        userId,
        tokenHash: this.hashRefreshToken(refreshToken),
        deviceId,
        expiresAt: this.refreshExpiry(),
      },
    });

    return {
      token: this.signToken(user),
      refresh_token: refreshToken,
    };
  }

  private hashRefreshToken(token: string): string {
    return hashRefreshToken(token, this.config.refreshTokenSecret);
  }

  private refreshExpiry(now = new Date()): Date {
    return new Date(
      now.getTime() +
        parseExpiresIn(this.config.refreshTokenExpiresIn) * 1000,
    );
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
