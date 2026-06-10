import { z } from "zod";

export const reportQuerySchema = z
  .object({
    branch_id: z.string().trim().min(1).optional(),
    from: z.string().datetime({ offset: true }).optional(),
    to: z.string().datetime({ offset: true }).optional(),
  })
  .refine(
    ({ from, to }) => !from || !to || new Date(from) <= new Date(to),
    {
      message: "`from` must be earlier than or equal to `to`",
      path: ["from"],
    },
  );

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
