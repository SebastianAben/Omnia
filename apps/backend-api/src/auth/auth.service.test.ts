import assert from "node:assert/strict";
import test from "node:test";

import { UnauthorizedException } from "@nestjs/common";

import { hashRefreshToken } from "./auth-session-token";
import { AuthService } from "./auth.service";

const refreshToken = "refresh-token-value-with-enough-entropy-123";
const refreshSecret = "refresh-secret-with-at-least-32-characters";
const session = {
  id: "session-1",
  userId: "user-1",
  deviceId: "register-1",
  revokedAt: null,
  expiresAt: new Date("2030-01-01T00:00:00.000Z"),
  user: {
    id: "user-1",
    fullName: "Test User",
    username: "test",
    branchId: "branch-1",
    isActive: true,
    role: { code: "cashier" },
    branch: { id: "branch-1", code: "BR-1", name: "Branch 1" },
  },
};

function createService(revokeCount = 1) {
  const createdSessions: Array<Record<string, unknown>> = [];
  const prisma = {
    authSession: {
      findUnique: async ({ where }: { where: { tokenHash: string } }) => {
        assert.equal(
          where.tokenHash,
          hashRefreshToken(refreshToken, refreshSecret),
        );
        return session;
      },
      updateMany: async () => ({ count: 1 }),
    },
    $transaction: async (
      callback: (transaction: {
        authSession: {
          updateMany: () => Promise<{ count: number }>;
          create: (input: { data: Record<string, unknown> }) => Promise<void>;
        };
      }) => Promise<void>,
    ) =>
      callback({
        authSession: {
          updateMany: async () => ({ count: revokeCount }),
          create: async ({ data }) => {
            createdSessions.push(data);
          },
        },
      }),
  };
  const config = {
    jwtSecret: "access-secret-with-at-least-32-characters",
    jwtExpiresIn: "15m",
    refreshTokenSecret: refreshSecret,
    refreshTokenExpiresIn: "30d",
  };

  return {
    createdSessions,
    service: new AuthService(prisma as never, config as never),
  };
}

test("refresh session rotates the stored token and returns a new pair", async () => {
  const { createdSessions, service } = createService();
  const result = await service.refreshSession({
    refresh_token: refreshToken,
  });

  assert.equal(createdSessions.length, 1);
  assert.equal(createdSessions[0]?.userId, session.userId);
  assert.notEqual(
    createdSessions[0]?.tokenHash,
    hashRefreshToken(refreshToken, refreshSecret),
  );
  assert.match(result.data.token, /^[^.]+\.[^.]+\.[^.]+$/);
  assert.notEqual(result.data.refresh_token, refreshToken);
});

test("refresh session rejects replay after another rotation wins", async () => {
  const { createdSessions, service } = createService(0);

  await assert.rejects(
    service.refreshSession({ refresh_token: refreshToken }),
    UnauthorizedException,
  );
  assert.equal(createdSessions.length, 0);
});
