import assert from "node:assert/strict";
import { test } from "vitest";

import { createRefreshToken, hashRefreshToken } from "./auth-session-token";

test("refresh tokens are random and stored as deterministic hashes", () => {
  const first = createRefreshToken();
  const second = createRefreshToken();
  const secret = "refresh-secret-with-at-least-32-characters";

  assert.notEqual(first, second);
  assert.match(first, /^[A-Za-z0-9_-]{43}$/);
  assert.equal(
    hashRefreshToken(first, secret),
    hashRefreshToken(first, secret),
  );
  assert.notEqual(
    hashRefreshToken(first, secret),
    hashRefreshToken(second, secret),
  );
});
