export type CsvValue = Date | number | string | null | undefined;

export function buildCsv(rows: CsvValue[][]): string {
  return rows.map((row) => row.map(formatCsvCell).join(",")).join("\r\n");
}

export function takeBoundedRows<T>(rows: T[], limit: number) {
  return {
    rows: rows.slice(0, limit),
    truncated: rows.length > limit,
  };
}

function formatCsvCell(value: CsvValue): string {
  if (value === null || value === undefined) {
    return "";
  }

  const normalized =
    typeof value === "string"
      ? protectSpreadsheetFormula(value)
      : value instanceof Date
        ? value.toISOString()
        : String(value);

  if (!/[",\r\n]/.test(normalized)) {
    return normalized;
  }

  return `"${normalized.replace(/"/g, '""')}"`;
}

function protectSpreadsheetFormula(value: string): string {
  return /^[=+\-@]/.test(value) ? `'${value}` : value;
}
