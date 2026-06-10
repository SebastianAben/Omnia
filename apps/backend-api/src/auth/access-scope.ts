import { ForbiddenException } from "@nestjs/common";

import type { CurrentUser } from "./dto";

const cashierRolePattern = /cashier/i;

export function resolveBranchScope(
  user: CurrentUser,
  requestedBranchId?: string,
): string | undefined {
  if (!user.branch_id) {
    return requestedBranchId;
  }

  if (requestedBranchId && requestedBranchId !== user.branch_id) {
    throw new ForbiddenException("User cannot access another branch");
  }

  return user.branch_id;
}

export function requireBranchScope(
  user: CurrentUser,
  requestedBranchId?: string,
): string {
  const branchId = resolveBranchScope(user, requestedBranchId);

  if (!branchId) {
    throw new ForbiddenException("branch_id is required for this user");
  }

  return branchId;
}

export function assertCentralAccess(user: CurrentUser): void {
  if (cashierRolePattern.test(user.role_code)) {
    throw new ForbiddenException("Cashier role cannot access central data");
  }
}
