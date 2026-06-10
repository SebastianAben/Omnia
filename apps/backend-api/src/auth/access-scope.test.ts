import assert from "node:assert/strict";
import { test } from "vitest";

import { ForbiddenException } from "@nestjs/common";

import {
  assertCentralAccess,
  requireBranchScope,
  resolveBranchScope,
} from "./access-scope";
import type { CurrentUser } from "./dto";

const branchUser: CurrentUser = {
  id: "user-branch",
  full_name: "Branch User",
  username: "branch",
  role_code: "supervisor",
  branch_id: "branch-a",
};

const hqUser: CurrentUser = {
  id: "user-hq",
  full_name: "HQ User",
  username: "hq",
  role_code: "hq_admin",
};

test("resolveBranchScope pins branch users to their own branch", () => {
  assert.equal(resolveBranchScope(branchUser), "branch-a");
  assert.equal(resolveBranchScope(branchUser, "branch-a"), "branch-a");
  assert.throws(
    () => resolveBranchScope(branchUser, "branch-b"),
    ForbiddenException,
  );
});

test("requireBranchScope rejects central users without an explicit branch", () => {
  assert.equal(requireBranchScope(hqUser, "branch-a"), "branch-a");
  assert.throws(() => requireBranchScope(hqUser), ForbiddenException);
});

test("assertCentralAccess rejects cashier roles only", () => {
  assert.doesNotThrow(() => assertCentralAccess(branchUser));
  assert.doesNotThrow(() => assertCentralAccess(hqUser));
  assert.throws(
    () =>
      assertCentralAccess({
        ...branchUser,
        role_code: "branch_cashier",
      }),
    ForbiddenException,
  );
});
