import assert from "node:assert/strict";
import test from "node:test";

import { UnauthorizedException } from "@nestjs/common";

import {
  parseExpiresIn,
  signAccessToken,
  verifyAccessToken,
} from "./auth-token";
import type { CurrentUser } from "./dto";

const secret = "test-secret-with-at-least-32-characters";
const now = 1_800_000_000;
const user: CurrentUser = {
  id: "user-1",
  full_name: "Test User",
  username: "test",
  role_code: "hq_admin",
};

test("access token round-trips validated claims", () => {
  const token = signAccessToken(user, secret, "15m", now);

  assert.deepEqual(verifyAccessToken(token, secret, now + 1), {
    ...user,
    full_name: "",
  });
});

test("access token rejects malformed, tampered, and expired values", () => {
  const token = signAccessToken(user, secret, "1s", now);
  const [header, payload] = token.split(".");

  assert.throws(
    () => verifyAccessToken("not-a-token", secret, now),
    UnauthorizedException,
  );
  assert.throws(
    () => verifyAccessToken(`${header}.${payload}.invalid`, secret, now),
    UnauthorizedException,
  );
  assert.throws(
    () => verifyAccessToken(token, secret, now + 1),
    UnauthorizedException,
  );
});

test("access token rejects unsupported algorithms before accepting claims", () => {
  const token = signAccessToken(user, secret, "15m", now);
  const [, payload, signature] = token.split(".");
  const header = Buffer.from(
    JSON.stringify({ alg: "none", typ: "JWT" }),
  ).toString("base64url");

  assert.throws(
    () => verifyAccessToken(`${header}.${payload}.${signature}`, secret, now),
    UnauthorizedException,
  );
});

test("expiration parser handles supported units and rejects invalid config", () => {
  assert.equal(parseExpiresIn("30"), 30);
  assert.equal(parseExpiresIn("15m"), 900);
  assert.equal(parseExpiresIn("2h"), 7200);
  assert.throws(() => parseExpiresIn("forever"));
});
