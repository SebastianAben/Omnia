import assert from "node:assert/strict";
import { test } from "vitest";

import { buildCsv, takeBoundedRows } from "./csv";

test("buildCsv escapes values and protects spreadsheet formulas", () => {
  const csv = buildCsv([
    ["name", "note"],
    ["Central, Branch", 'uses "quoted" label'],
    ["Line break", "first\nsecond"],
    ["Formula", "=SUM(A1:A2)"],
  ]);

  assert.equal(
    csv,
    'name,note\r\n"Central, Branch","uses ""quoted"" label"\r\nLine break,"first\nsecond"\r\nFormula,\'=SUM(A1:A2)',
  );
});

test("takeBoundedRows reports truncation status", () => {
  assert.deepEqual(takeBoundedRows([1, 2, 3], 2), {
    rows: [1, 2],
    truncated: true,
  });
  assert.deepEqual(takeBoundedRows([1, 2], 2), {
    rows: [1, 2],
    truncated: false,
  });
});
