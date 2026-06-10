import assert from "node:assert/strict";
import { test } from "vitest";

import { parseReportWindow, reportQuerySchema } from "./reporting-query";

test("report query schema trims branch and parses valid date windows", () => {
  const validQuery = reportQuerySchema.parse({
    branch_id: " branch-1 ",
    from: "2026-06-01T00:00:00.000Z",
    to: "2026-06-07T23:59:59.000+07:00",
  });

  assert.equal(validQuery.branch_id, "branch-1");
  assert.deepEqual(parseReportWindow(validQuery), {
    branchId: "branch-1",
    from: new Date("2026-06-01T00:00:00.000Z"),
    to: new Date("2026-06-07T23:59:59.000+07:00"),
  });
});

test("report query schema rejects invalid and reversed date windows", () => {
  assert.equal(
    reportQuerySchema.safeParse({
      from: "not-a-date",
      to: "2026-06-07T00:00:00.000Z",
    }).success,
    false,
  );

  const reversedWindow = reportQuerySchema.safeParse({
    from: "2026-06-08T00:00:00.000Z",
    to: "2026-06-07T00:00:00.000Z",
  });

  assert.equal(reversedWindow.success, false);
  if (!reversedWindow.success) {
    assert.deepEqual(reversedWindow.error.issues[0]?.path, ["from"]);
  }
});
