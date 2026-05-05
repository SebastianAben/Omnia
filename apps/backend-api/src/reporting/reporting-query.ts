import { z } from "zod";

export const reportQuerySchema = z.object({
  branch_id: z.string().trim().min(1).optional(),
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
});

export type ReportQuery = z.infer<typeof reportQuerySchema>;

export type ReportWindow = {
  branchId?: string;
  from: Date;
  to: Date;
};

export function parseReportWindow(query: ReportQuery): ReportWindow {
  const now = new Date();
  const defaultFrom = new Date(now);
  defaultFrom.setDate(defaultFrom.getDate() - 7);
  defaultFrom.setHours(0, 0, 0, 0);

  const from = query.from ? new Date(query.from) : defaultFrom;
  const to = query.to ? new Date(query.to) : now;

  return {
    branchId: query.branch_id,
    from,
    to,
  };
}

export function toNumber(value: { toString(): string } | number | null | undefined) {
  if (value === null || value === undefined) {
    return 0;
  }

  return typeof value === "number" ? value : Number(value.toString());
}

