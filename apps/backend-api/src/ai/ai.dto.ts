import { z } from "zod";

export const aiInsightQuerySchema = z.object({
  branch_id: z.string().trim().min(1).optional(),
  insight_type: z.string().trim().min(1).optional(),
  generated_after: z.string().datetime().optional(),
});

export type AiInsightQuery = z.infer<typeof aiInsightQuerySchema>;
